// test("", () => {
//   expect(true).toEqual(true);
// });
// export {};

import * as mock from "mock-fs";
import * as fs from "fs";
import { RouterGenerator } from "../src/react-router-generator";
import { resolve } from "path";

// mock;

const { readFileSync } = fs;
const { restore, bypass } = mock;

afterEach(() => {
  restore();
});

test("src/pages path", async () => {
  mock({
    "src/pages/project/index.tsx": "content",
    "src/router.template.txt": "__IMPORTS__\n__ROUTES__\n",
  });
  const watcher = new RouterGenerator({
    pagesPath: resolve(process.cwd(), "src/pages"),
    routerPath: resolve(process.cwd(), "src/pages/CustomRoutes.tsx"),
    watch: false,
  });
  // await watcher.start();
  // const file = readFileSync("src/pages/CustomRoutes.tsx", "utf-8");
  // restore();
  // expect(file).toMatchInlineSnapshot(`
  //   "import RouteComponent0 from \\"./project/index\\";
  //   <Route exact path=\\"/project\\" component={RouteComponent0}/>
  //   "
  // `);
  // watcher.stop();
});

// test("unique path", async () => {
//   mock({
//     "unique/data/index.tsx": "content",
//     "src/router.template.txt": "__IMPORTS__\n__ROUTES__\n",
//     some: {},
//   });
//   const watcher = new RouterGenerator({
//     pagesPath: resolve(process.cwd(), "unique"),
//     routerPath: resolve(process.cwd(), "some/CustomRoutes.tsx"),
//     watch: false,
//   });
//   await watcher.start();
//   const file = readFileSync("some/CustomRoutes.tsx", "utf-8");
//   restore();
//   expect(file).toEqual(
//     `import RouteComponent0 from "./data/index";\n` +
//       `<Route exact path="/data" component={RouteComponent0}/>\n`
//   );
//   watcher.stop();
// });

// test("watch", (done) => {
//   mock({
//     "src/pages/project/index.tsx": "content",
//     "src/router.template.txt": "__IMPORTS__\n__ROUTES__\n",
//   });
//   const watcher = new RouterGenerator({
//     pagesPath: resolve(process.cwd(), "src/pages"),
//     routerPath: resolve(process.cwd(), "src/pages/CustomRoutes.tsx"),
//     watch: true,
//   });
//   watcher.start();
//   setTimeout(() => {
//     watcher.stop();
//     done();
//   }, 2000);
// });
