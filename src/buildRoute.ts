export interface RouteConfig {
  importName: string;
  importPath: string;
  routePath: string;
}

interface BuildRouteConfig {
  path: string;
  routerPath: string;
  routeBaseUrl: string;
  id: number;
}

function getImportPath(path: string, routerPath: string) {
  // remove suffix from path
  return path.replace(routerPath, ".").replace(/\.[^.]*$/, "");
}

function getRoutePath(path: string, routeBaseUrl: string) {
  return path
    .replace(routeBaseUrl, "")
    .replace(/\/[^\/]*\.*$/, "")
    .replace("[", "")
    .replace("]", "");
}

export function buildRoute({
  path,
  routerPath,
  id,
  routeBaseUrl,
}: BuildRouteConfig): RouteConfig {
  const importName = `Route${id}`;
  const importPath = getImportPath(path, routerPath);
  const routePath = getRoutePath(path, routeBaseUrl);
  return {
    importName,
    importPath,
    routePath,
  };
}
