#!/usr/bin/env node

import yargs from "yargs";

// Utilities
import ParseCommand from "./commands/parse.command";

// Utilities
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../package.json");

yargs
  .scriptName("csvjson")
  .usage("$0 <cmd> [args]")
  .version(version)
  .alias("h", "help")
  .alias("v", "version")
  .strict(true)
  .command(ParseCommand)
  .demandCommand(1, "No default behaviour")
  .wrap(Math.min(100, yargs.terminalWidth()))
  .help().argv;
