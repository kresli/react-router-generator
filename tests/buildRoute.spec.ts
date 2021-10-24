import { buildRoute } from "../src/buildRoute";

test("basic", () => {
  const route = buildRoute({
    path: "src/pages/project/index.tsx",
    routeBaseUrl: "src/pages",
    routerPath: "src/pages",
    id: 0,
  });
  expect(route).toMatchObject({
    importName: "Route0",
    importPath: "./project/index",
    routePath: "/project",
  });
});

test("route with slug", () => {
  const route = buildRoute({
    path: "src/pages/project/[:projectId]/index.tsx",
    routeBaseUrl: "src/pages",
    routerPath: "src/pages",
    id: 0,
  });
  expect(route).toMatchObject({
    importName: "Route0",
    importPath: "./project/[:projectId]/index",
    routePath: "/project/:projectId",
  });
});
