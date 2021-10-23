import * as glob from "glob-promise";
import { readFileSync, writeFileSync } from "fs";
import * as watchr from "watchr";
// import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { resolve } from "path";
import { Watchr } from "watchr";

// const argv = yargs(hideBin(process.argv)).argv;

interface RouteConfig {
  relativePath: string;
  importLine: string;
  routeLine: string;
}

interface Config {
  pagesPath: string;
  routerPath: string;
  watch: boolean;
}

export class RouterGenerator {
  private readFile(path: string) {
    return readFileSync(resolve(__dirname, path), "utf-8");
  }
  private makeRoutePath(relativePath: string) {
    const reg = new RegExp(
      `${this.config.pagesPath}/(.*)/index.tsx`.replaceAll("//", "/"),
      "g"
    );
    let [, path] = reg.exec(relativePath) || ["", ""];
    path = path.replaceAll("[", ":");
    path = path.replaceAll("]", "");
    return `/${path}`;
  }
  private makeRouteConfig(relativePath: string, index: number): RouteConfig {
    const componentName = `RouteComponent${index}`;
    const importLine = `import ${componentName} from "${relativePath
      .replace(this.config.pagesPath, ".")
      .replace(".tsx", "")}";`;
    const path = this.makeRoutePath(relativePath);
    const routeLine = `<Route exact path="${path}" component={${componentName}}/>`;
    return {
      relativePath,
      importLine,
      routeLine,
    };
  }

  private generateRouterContent(routesConfig: RouteConfig[]) {
    const imports = routesConfig.map(({ importLine }) => importLine).join("\n");
    const routes = routesConfig
      .map(({ routeLine }) => `${routeLine}`)
      .join("\n");
    let file = this.readFile("./router.template.txt");
    file = file.replace("__IMPORTS__", imports);
    file = file.replace("__ROUTES__", routes);
    return file;
  }

  private writeRouterFile(content: string) {
    writeFileSync(this.config.routerPath, content);
  }

  private async update(
    changeType?: "update" | "create" | "delete",
    fullPath?: string
  ) {
    if (fullPath && !fullPath.match(/index\.tsx$/g)) return;
    try {
      const paths = await glob(
        resolve(`${this.config.pagesPath}/**/index.tsx`)
      );
      const routes = paths.map((path, i) => this.makeRouteConfig(path, i));
      const routerContent = this.generateRouterContent(routes);
      this.writeRouterFile(routerContent);
    } catch (e) {
      throw e;
    }
  }
  private config: Config;
  private watcher: Watchr | null = null;
  constructor(config: Config) {
    this.config = config;
  }

  async start() {
    if (this.config.watch) {
      const next = (err: string) => {
        if (err)
          return console.log(
            "watch failed on",
            this.config.pagesPath,
            "with error",
            err
          );
        console.log("watch successful on", this.config.pagesPath);
      };
      this.watcher = watchr.open(
        this.config.pagesPath,
        (changeType, fullPath) => this.update(changeType, fullPath),
        (err: string) => next(err)
      );
    } else {
      await this.update();
    }
  }
  stop() {
    this.watcher?.close();
  }
}
