import { RouteConfig } from "./buildRoute";

interface Config {
  routes: RouteConfig[];
  template: string;
}

export function buildRouter({ routes, template }: Config) {
  const imports = routes
    .map(
      ({ importName, importPath }) =>
        `import ${importName} from "${importPath}";`
    )
    .join("\n");
  const elements = routes
    .map(
      ({ routePath, importName }) =>
        `<Route exact path="${routePath}" component={${importName}}/>`
    )
    .join("\n");
  return template
    .replace("<<IMPORTS>>", imports)
    .replace("<<ROUTES>>", elements);
}
