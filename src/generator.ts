import { buildRoute } from "./buildRoute";
import { buildRouter } from "./buildRouter";
import { getPaths, watch } from "./watch";
import { writeFile } from "./writeFile";
// @ts-ignore
import defaultTemplate from "./router.template.txt";
export interface GeneratorConfig {
  routeBaseUrl: string;
  routeName: string;
  routerPath: string;
  routerTemplate?: string;
  watch?: boolean;
}

function writeRouterFile(
  paths: string[],
  routerPath: string,
  routeBaseUrl: string,
  template: string
) {
  const routes = paths.map((path, id) =>
    buildRoute({ path, routerPath, id, routeBaseUrl })
  );
  const router = buildRouter({
    routes,
    template: template || defaultTemplate,
  });
  writeFile(routerPath, router);
}

export function generator({
  routeBaseUrl,
  routeName,
  routerPath,
  routerTemplate = defaultTemplate,
  watch: isWatch = false,
}: GeneratorConfig) {
  const globPattern = `${routeBaseUrl}/**/${routeName}`;
  if (!isWatch) {
    const paths = getPaths(globPattern);
    return writeRouterFile(paths, routerPath, routeBaseUrl, routerTemplate);
  }
  return watch(globPattern, (paths) =>
    writeRouterFile(paths, routerPath, routeBaseUrl, routerTemplate)
  );
}
