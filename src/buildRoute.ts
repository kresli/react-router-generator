export interface RouteConfig {
  importName: string;
  importPath: string;
  routePath: string;
}

interface BuildRouteConfig {
  path: string;
  routerPath: string;
  id: number;
}

function getImportPath(path: string, routerPath: string) {
  return path.replace(routerPath, ".").replace("index.tsx", "index");
}

function getRoutePath(path: string, routerPath: string) {
  return path
    .replace(routerPath, "")
    .replace("/index.tsx", "")
    .replace("[", "")
    .replace("]", "");
}

export function buildRoute({
  path,
  routerPath,
  id,
}: BuildRouteConfig): RouteConfig {
  const importName = `Route${id}`;
  const importPath = getImportPath(path, routerPath);
  const routePath = getRoutePath(path, routerPath);
  return {
    importName,
    importPath,
    routePath,
  };
}
