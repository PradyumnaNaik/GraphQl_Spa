# McDonalds KPI Dashboard (React + Highcharts + GraphQL)

A sample mono-folder containing:

1. GraphQL BFF (Apollo Server, TypeScript) serving static KPI data. (Port 4000)
2. Python Strawberry GraphQL server (Starlette + Uvicorn) serving additional KPI data. (Port 4001)
3. React SPA (Vite + TypeScript) consuming both GraphQL APIs with Apollo Client and rendering 10 KPI charts using Highcharts.

## Structure

```text
GraphQL_SPA/
  server/       # Apollo GraphQL server (port 4000)
  py_server/    # Strawberry GraphQL server (port 4001)
  spa/          # React dashboard (Vite dev server port 5173)
```

## Prerequisites

- Node.js 18+ (recommended LTS)
- Python 3.11+ (for Strawberry server)
- Package managers: NPM (or PNPM/Yarn) + pip / venv

## Install Dependencies

Node services:

```bash
cd server && npm install && cd ../spa && npm install
```

Python Strawberry server:

```bash
cd py_server
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

## Run GraphQL Servers

Node Apollo:

```bash
cd server
npm run dev
```

Python Strawberry:

```bash
cd py_server
# Activate venv first
uvicorn app.main:app --reload --port 4001
```

(Or use run.sh / run.bat helpers.)

Endpoints:

- Apollo: <http://localhost:4000>
- Strawberry GraphiQL: <http://localhost:4001/graphql>

Test Query (works on both servers, field names align with shared schema shape):

```graphql
query Test {
  dashboard { categories kpis { id name values } }
}
```

## Run SPA

In a separate terminal:

```bash
cd spa
npm run dev
```

Open: <http://localhost:5173>

## Dashboard Overview

- First 6 charts: Apollo (Node) data (Revenue, Transactions, Avg Ticket, Drive Thru %, Delivery %, Customer Sat)
- Next 4 charts: Strawberry (Python) data (Labor Cost %, Food Cost %, Waste $, Energy kWh)
- Each card shows a small source label: Apollo or Strawberry.

## Production Build

```bash
cd server && npm run build
cd ../spa && npm run build
```

SPA production assets: `spa/dist` (You would host these behind a static server / CDN; Python & Node APIs deploy separately.)

## Modify / Extend

Add KPI to Node server:

1. Edit `server/src/data.json` kpis array.
2. Restart Node server.
3. Add a card in `spa/src/App.tsx` under the Apollo section.

Add KPI to Python server:

1. Edit `py_server/data.json` kpis array.
2. Restart Uvicorn process.
3. Add a card in `PySection` cards array in `spa/src/App.tsx`.

## Module Federation (Consuming Remote Shared Components)

This SPA is configured to consume a remote federated module host located at:

```text
SharedModules@https://cleanui0011.github.io/mf-shared-modules/remoteEntry.js
```

Implementation details:

- Added `@originjs/vite-plugin-federation` to `devDependencies`.
- Updated `vite.config.ts` with a `federation` plugin configuring the remote under key `SharedModules`.
- Created `src/federation.d.ts` to satisfy TypeScript (declares both `SharedModules/*` and legacy lowercase alias).

Example usage (lazy load exposed search components):

```tsx
import React, { Suspense } from 'react';
const SearchBar = React.lazy(() => import('SharedModules/SearchBar'));
const SearchButton = React.lazy(() => import('SharedModules/SearchButton'));

export function RemoteSearch() {
  return (
    <Suspense fallback={<span>Loading search UI...</span>}>
      <div style={{display:'flex', gap: 12}}>
        <SearchBar placeholder="Search KPIs" />
        <SearchButton label="Go" />
      </div>
    </Suspense>
  );
}
```

If the remote adds more exports, follow the same pattern `import('SharedModules/ComponentName')`.

Notes:

- Capitalization matters; the remote key in `vite.config.ts` must match import specifiers.
- React singletons enforced to avoid multiple React renderers.
- For SSR (not enabled here), you'd need async federation handling and potentially `await import` in server entry.

Troubleshooting Federation:

- 404 on remoteEntry: verify URL is correct & published (GitHub Pages can take a minute after deploy).
- Chunk load error: remote updated while your page is open; hard refresh.
- Type errors: replace `any` declarations in `federation.d.ts` with concrete prop interfaces once known.

## Notes

- Both schemas expose `dashboard` for parity; they return different KPI sets allowing side-by-side comparison.
- Two ApolloClient instances are used in the SPA (one per endpoint) to keep caches isolated.
- CORS configured individually (ports 4000 & 4001 allow SPA origin 5173).
- No auth layer included; add auth headers via Apollo link if required.

## Troubleshooting

- If charts fail: confirm both servers are running (4000 & 4001) before loading the SPA.
- CORS errors: ensure ports not blocked and origin matches `http://localhost:5173`.
- Python import errors: verify virtual environment is activated when installing packages.
- TypeScript errors: remove `node_modules` and reinstall if packages mismatch.
- 500 Internal Server Error at `GET /`: The Strawberry/Starlette app likely only mounts `/graphql`. Access `http://localhost:4001/graphql`. If you want a friendly root, add a route:

  ```python
  # py_server/app/main.py (example)
  # ...existing imports...
  from starlette.applications import Starlette
  from starlette.responses import JSONResponse
  from strawberry.asgi import GraphQL
  import pathlib, json, strawberry

  BASE_DIR = pathlib.Path(__file__).parent.parent
  DATA_PATH = BASE_DIR / "data.json"

  # Safely load data (avoid relative path issues)
  with DATA_PATH.open() as f:
      raw = json.load(f)

  # ...define Query using raw...
  schema = strawberry.Schema(query=Query)
  graphql_app = GraphQL(schema)

  app = Starlette()

  @app.route("/")
  async def root(_request):
      return JSONResponse({"status": "ok", "graphql": "/graphql"})

  app.add_route("/graphql", graphql_app)
  app.add_websocket_route("/graphql", graphql_app)
  ```

  Ensure you start uvicorn from `py_server` directory (so relative imports and paths resolve):

  ```bash
  uvicorn app.main:app --reload --port 4001
  ```

  If still 500, run with `--log-level debug` or wrap the data load in try/except to print the exception.

Enjoy.
