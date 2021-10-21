import glob from 'glob-promise';
import { readFileSync, writeFileSync } from 'fs';
import watchr from 'watchr';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import { resolve } from 'path';

const argv = yargs(hideBin(process.argv)).argv;

class Watcher {
    #readFile(path: string) {
        return readFileSync(resolve(__dirname, path), 'utf-8');
    }
    #makeRoutePath(relativePath: string) {
        let [, path] = /src\/pages\/(.*)\/index\.tsx$/g.exec(relativePath)
        path = path.replaceAll("[", ":");
        path = path.replaceAll("]", "");
        return path;
    }
    #makeRouteConfig(relativePath, index) {
        const componentName = `RouteComponent${index}`
        const importLine = `import ${componentName} from "${relativePath.replace("src/pages/", "./").replace(".tsx", "")}";`;
        const path = this.makeRoutePath(relativePath)
        const routeLine = `<Route exact path="${path}" component={${componentName}}/>`
        return {
            relativePath,
            importLine,
            routeLine
        }
    }
    
    #generateRouterContent(routesConfig) {
        const imports = routesConfig.map(({importLine}) => importLine).join("\n");
        const routes = routesConfig.map(({routeLine}) => `\t\t\t\t${routeLine}`).join("\n");
        let file = this.readFile('./router.template.txt');
        file = file.replace("__IMPORTS__", imports);
        file = file.replace("__ROUTES__", routes);
        return file;
    }
    
    #writeRouterFile(content) {
        writeFileSync("src/pages/CustomRouter.tsx", content);
    }
    
    static async update() {
        const paths = await glob('src/pages/**/index.tsx');
        const routes = paths.map((path, i) => this.makeRouteConfig(path, i));
        const routerContent = this.generateRouterContent(routes);
        this.writeRouterFile(routerContent);
    }
    constructor(config) {
        this.config = config;
    }
    get pagesPath() { return this.config.pagesPath }
    get routerPath() { return this.config.routerPath }

    async start(path) {
        function next(err) {
            if (err) return console.log('watch failed on', path, 'with error', err)
            console.log('watch successful on', path)
        }
        const stalker = watchr.open(path, () => Watcher.update(), next);
        await Watcher.update();
    }

}

const watcher = new Watcher({
    pagesPath: "src/pages",
    routerPath: "src/pages/CustomRouter.tsx"
});
watcher.start();
