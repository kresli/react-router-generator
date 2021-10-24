const yargs = require("yargs");
// import { hideBin } from "yargs/helpers";
import { generator, GeneratorConfig } from "./generator";

const argv = yargs(process.argv.slice(2)).options({
  pagesPath: { type: "string", required: true },
  watch: { type: "boolean", default: false },
}).argv;

generator({ pagesPath: argv.pagesPath, watch: argv.watch });
