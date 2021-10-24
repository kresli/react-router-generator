const yargs = require("yargs");
import { Argv } from "yargs";
import { generator, GeneratorConfig } from "./generator";

const { argv } = (yargs(process.argv.slice(2)) as Argv).options({
  /**
   * src/pages
   */
  routeBaseUrl: { type: "string", required: true },
  /**
   * route.tsx
   *  */
  routeName: { type: "string", required: true },
  /**
   * src/CustomRouter.tsx
   */
  routerPath: { type: "string", require: true },
  watch: { type: "boolean", default: false },
});

generator(argv);
