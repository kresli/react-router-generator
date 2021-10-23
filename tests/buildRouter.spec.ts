import { buildRouter } from "../src/buildRouter";

test("basic", () => {
  const router = buildRouter({
    routes: [
      {
        importName: "Comp0",
        importPath: "./my/test/index",
        routePath: "/my/test",
      },
    ],
    template: "<<IMPORTS>>\n<<ROUTES>>>",
  });

  expect(router).toMatch(
    `import Comp0 from "./my/test/index";\n<Route exact path="/my/test" component={Comp0}/>`
  );
});
