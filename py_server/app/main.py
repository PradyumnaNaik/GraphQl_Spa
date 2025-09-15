import json
from pathlib import Path
import strawberry
from typing import List, Optional
from strawberry.asgi import GraphQL
from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware
from starlette.routing import Route
import sys

# Added Python version guard (Strawberry version incompatibility with 3.13 private dataclasses API removal)
if sys.version_info >= (3, 13):
    raise RuntimeError("Python 3.13 detected. Please use Python 3.11 or 3.12 for Strawberry until official 3.13 support.")

DATA_PATH = Path(__file__).parent.parent / "data.json"

def load_data():
    with DATA_PATH.open() as f:
        return json.load(f)

@strawberry.type
class KPI:
    id: str
    name: str
    values: List[float]

@strawberry.type
class Store:
    id: str
    name: str

@strawberry.type
class DashboardData:
    categories: List[str]
    kpis: List[KPI]
    stores: List[Store]

@strawberry.type
class Query:
    @strawberry.field
    def dashboard(self) -> DashboardData:
        data = load_data()
        return DashboardData(
            categories=data["categories"],
            kpis=[KPI(**k) for k in data["kpis"]],
            stores=[Store(**s) for s in data["stores"]],
        )

    @strawberry.field(description="Lookup KPI by id")
    def kpi(self, id: str) -> Optional[KPI]:
        data = load_data()
        for k in data["kpis"]:
            if k["id"] == id:
                return KPI(**k)
        return None

schema = strawberry.Schema(query=Query)

graphql_app = GraphQL(schema)

async def homepage(scope, receive, send):
    if scope["type"] != "http":
        return
    body = b"Strawberry GraphQL running at /graphql"
    await send({"type": "http.response.start", "status": 200, "headers": [(b"content-type", b"text/plain")]})
    await send({"type": "http.response.body", "body": body })

routes = [Route('/', endpoint=homepage), Route('/graphql', endpoint=graphql_app)]

app = Starlette(routes=routes)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)