import React, { Suspense } from 'react';

// Lazy import remote components using capitalized remote key defined in vite config.
const RemoteSearchButton = React.lazy(() => import('SharedModules/SearchButton').catch(err => {
  console.error('Failed to load remote module SharedModules/SearchButton', err);
  throw err;
}));

const RemoteSearchBar = React.lazy(() => import('SharedModules/SearchBar').catch(err => {
  console.error('Failed to load remote module SharedModules/SearchBar', err);
  throw err;
}));

export const RemoteDemo: React.FC = () => {
  return (
    <div style={{marginBottom: 20, padding: '8px 12px', background: '#262d36', borderRadius: 8}}>
      <div style={{fontSize: 12, opacity: 0.75, marginBottom: 6}}>Remote Modules (SharedModules/SearchButton & SharedModules/SearchBar)</div>
      <Suspense fallback={<span style={{fontSize:12}}>Loading remote search components...</span>}>
        <div style={{display:'flex', gap: 12, alignItems: 'center'}}>
          <RemoteSearchBar placeholder="Search..." />
          <RemoteSearchButton label="Go" />
        </div>
      </Suspense>
    </div>
  );
};

export default RemoteDemo;
