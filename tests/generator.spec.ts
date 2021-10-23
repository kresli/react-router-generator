import { generator } from "../src/generator";
import * as mock from "mock-fs";
import * as fs from "fs";

afterEach(() => mock.restore());

test("basic", () => {
  mock({
    "src/pages/project/index.tsx": "",
  });
  generator({
    pagesPath: "src/pages",
    watch: false,
  });
  const content = fs.readFileSync("src/pages/CustomRouter.tsx", "utf-8");
  mock.restore();
  expect(content).toMatchInlineSnapshot(`
    "import Route0 from \\"src/pages/project/index\\";
    <Route exact path=\\"src/pages/project\\" component={Route0}/>"
  `);
});
