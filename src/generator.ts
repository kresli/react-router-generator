import { buildRoute } from "./buildRoute";
import { buildRouter } from "./buildRouter";
import { getPaths, watch } from "./watch";
import { writeFile } from "./writeFile";
export interface GeneratorConfig {
  pagesPath: string;
  watch: boolean;
}

function writeRouterFile(paths: string[], routerPath: string) {
  const routes = paths.map((path, index) =>
    buildRoute({ path, routerPath, id: index })
  );
  const router = buildRouter({
    routes,
    template: "<<IMPORTS>>\n<<ROUTES>>",
  });
  writeFile(routerPath, router);
}

export function generator({ pagesPath, watch: isWatch }: GeneratorConfig) {
  const globPattern = `${pagesPath}/**/index.tsx`;
  const routerPath = `${pagesPath}/CustomRouter.tsx`;
  if (!isWatch) return writeRouterFile(getPaths(globPattern), routerPath);
  return watch(globPattern, (paths) => writeRouterFile(paths, routerPath));
}
