// Type declarations for Module Federation remote modules
// Adjust to match actual exports once known.

// Legacy lowercase alias (if still referenced somewhere)
declare module 'sharedModules/*' {
  import * as React from 'react';
  const Component: React.ComponentType<any>;
  export default Component;
}

declare module 'sharedModules' {
  const mod: any;
  export = mod;
}

// Canonical capitalized remote name
declare module 'SharedModules/*' {
  import * as React from 'react';
  const Component: React.ComponentType<any>;
  export default Component;
}

declare module 'SharedModules' {
  const mod: any;
  export = mod;
}
