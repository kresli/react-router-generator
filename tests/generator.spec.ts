import { generator } from "../src/generator";
import * as mock from "mock-fs";
import * as fs from "fs";

afterEach(() => mock.restore());

test("basic", () => {
  mock({
    "src/pages/project/index.tsx": "",
  });
  generator({
    routeBaseUrl: "src/pages",
    routeName: "index.tsx",
    routerPath: "src/pages/CustomRouter.tsx",
    watch: false,
    routerTemplate: "<<IMPORTS>>\n<<ROUTES>>",
  });
  const content = fs.readFileSync("src/pages/CustomRouter.tsx", "utf-8");
  mock.restore();
  expect(content).toMatchInlineSnapshot(`
    "import Route0 from \\"src/pages/project/index\\";
    <Route exact path=\\"/project\\" component={Route0}/>"
  `);
});

test("custom entry point", () => {
  mock({
    "src/pages/project/route.tsx": "",
  });
  generator({
    routeBaseUrl: "src/pages",
    routeName: "route.tsx",
    routerPath: "src/pages/Router.tsx",
    watch: false,
    routerTemplate: "<<IMPORTS>>\n<<ROUTES>>",

    // pages: "src/pages/**/route.tsx",
    // router: "src/pages/Router.tsx",
    // watch: false,
    // template: "<<IMPORTS>>\n<<ROUTES>>",
  });
  const content = fs.readFileSync("src/pages/Router.tsx", "utf-8");
  mock.restore();
  expect(content).toMatchInlineSnapshot(`
    "import Route0 from \\"src/pages/project/route\\";
    <Route exact path=\\"/project\\" component={Route0}/>"
  `);
});
