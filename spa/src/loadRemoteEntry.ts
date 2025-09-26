// Optional fallback loader: dynamically inject remoteEntry script before importing exposed modules.
// Use only if network panel shows federation not requesting remoteEntry automatically.
export async function ensureSharedModulesLoaded(url = 'https://cleanui0011.github.io/mf-shared-modules/remoteEntry.js', globalVar = 'sharedModules') {
  if ((window as any)[globalVar]) return; // already present
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error('Failed to load remoteEntry: ' + url));
    document.head.appendChild(script);
  });
}
