#!/usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { generator, GeneratorConfig } from "./generator";

const argv = yargs(hideBin(process.argv)).options({
  pagesPath: { type: "string", required: true },
  watch: { type: "boolean", default: false },
}).argv;

generator({ pagesPath: argv.pagesPath, watch: argv.watch });
