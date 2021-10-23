import * as mock from "mock-fs";
import * as fs from "fs";
import { watch } from "../src/watch";
import waitForExpect from "wait-for-expect";

afterEach(() => mock.restore());

test("basic", async () => {
  const callback = jest.fn();
  mock({
    "src/pages/fungi/index.tsx": "",
    "src/pages/projects": {},
  });
  const cancel = watch("src/pages/**/index.tsx", callback, { interval: 100 });
  await waitForExpect(() =>
    expect(callback).toHaveBeenLastCalledWith(["src/pages/fungi/index.tsx"])
  );
  fs.writeFileSync("src/pages/projects/index.tsx", "");
  await waitForExpect(() =>
    expect(callback).toHaveBeenLastCalledWith([
      "src/pages/fungi/index.tsx",
      "src/pages/projects/index.tsx",
    ])
  );
  cancel();
});

test("call callback only when change", async () => {
  const callback = jest.fn();
  mock({
    "src/pages/fungi/index.tsx": "",
    "src/pages/projects": {},
  });
  const cancel = watch("src/pages/**/index.tsx", callback, { interval: 100 });
  await waitForExpect(() => expect(callback).toHaveBeenCalledTimes(1));
  await waitForExpect(() =>
    expect(callback).toHaveBeenLastCalledWith(["src/pages/fungi/index.tsx"])
  );
  expect(callback).toHaveBeenCalledTimes(1);
  fs.writeFileSync("src/pages/projects/index.tsx", "");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  expect(callback).toHaveBeenCalledTimes(2);
  cancel();
});
