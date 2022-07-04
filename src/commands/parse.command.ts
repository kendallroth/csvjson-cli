import chalk from "chalk";
import { parse as parseCsv } from "csv";
import oraSpinner from "ora";
import { Arguments, CommandModule } from "yargs";

// Utilities
import { FileService } from "@services";
import { print } from "@utilities/display.util";

// Types
import { JSONObject } from "@typings/app.types";

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

interface IParseArgs extends Arguments {
  /** Definition string for columns to include in output (with aliases/simple transformations) */
  columns?: string;
  /** Whether empty lines should be ignored */
  "ignore-empty"?: boolean;
  /** Input CSV file path */
  "input-file": string;
  /** Output JSON file path */
  "output-file"?: string;
  /** Output results as table (for small sets) */
  "output-table"?: boolean;
  /** Column formatting/types */
  types?: string;
}

interface IColumnDefinition {
  alias?: string;
  /** Original column key/name */
  key: string;
  /** Mapped column key/name */
  name: string;
  /** Column value type */
  type?: ColumnTypeString;
}

type ColumnType = string | number | boolean;
type ColumnTypeString = "string" | "number" | "boolean";

type ColumnDefinitions = Record<string, IColumnDefinition>;

////////////////////////////////////////////////////////////////////////////////
// Command
////////////////////////////////////////////////////////////////////////////////

const ParseCommand: CommandModule = {
  command: "parse",
  describe: "Parse a CSV file to JSON output",
  builder: {
    columns: {
      describe: "Columns to include (with aliases)",
      type: "string",
    },
    "ignore-empty": {
      describe: "Whether empty lines should be ignored",
      default: true,
      type: "boolean",
    },
    "input-file": {
      demandOption: true,
      description: "Input CSV file path",
      type: "string",
    },
    "output-file": {
      describe: "Output JSON file path",
      type: "string",
    },
    "output-table": {
      default: false,
      describe: "Whether to output as a table (small datasets)",
      type: "boolean",
    },
    types: {
      describe: "Column types (simple)",
      type: "string",
    },
  },
  handler: async (argv: Arguments): Promise<void> => {
    const args = argv as IParseArgs;

    const {
      columns: columnString,
      "ignore-empty": ignoreEmpty,
      "input-file": inputFile,
      "output-file": outputFile,
      "output-table": outputTable,
    } = args;

    // Either file output or pretty print specifier must be passed (as safety for large files)!
    if (!outputFile && !outputTable) {
      print(chalk.red("Either 'output-file' or 'output-table' arguments must be passed!"));
      process.exit(1);
    }

    await validateIOFiles(inputFile, outputFile);

    // Parse optional selected columns and aliases/types from arguments
    const columnDefinitions = parseColumnDefinitions(columnString);

    // TODO: Support customizing parser from CLI arguments
    const parser = parseCsv({
      columns: true,
      skipEmptyLines: ignoreEmpty,
      // Data transformations can be applied via 'columns' string OR 'transform' file (one or the other)
      on_record: (record, context) => {
        spinner.text = `Parsing: ${context.lines.toLocaleString()}`;

        if (columnDefinitions) {
          return transformRecordFromDefinition(record, columnDefinitions);
        }

        return record;
      },
    });

    const spinner = oraSpinner("Parsing CSV").start();

    let output: JSONObject[] = [];
    try {
      output = await FileService.readCsvFile(inputFile, parser);
    } catch (e: any) {
      print(chalk.yellow("Failed to parse CSV file"));
      print(e);
      spinner.stop();
      process.exit();
    }

    spinner.stop();

    print(`Parsed: ${output.length}`);

    if (outputTable) {
      const maxTableResults = 10;

      // Prevent outputting table if there are too many results (clutters terminal)
      const tableOutput = output.slice(0, maxTableResults);
      if (tableOutput.length !== output.length) {
        print(chalk.yellow(`Only printed ${maxTableResults} of ${output.length}`));
      }

      // eslint-disable-next-line no-console
      console.table(tableOutput);
    } else if (outputFile) {
      await FileService.writeJsonFile(outputFile, output);
    }
  },
};

////////////////////////////////////////////////////////////////////////////////
// Utilities
////////////////////////////////////////////////////////////////////////////////

/**
 * Parse column definitions (aliases/types) from column definition string
 *
 * @param   columnString - Column definition string
 * @returns Column definitions
 * @example
 * --columns="hashtag,count@number,is active:active@boolean"
 */
const parseColumnDefinitions = (columnString?: string): ColumnDefinitions | null => {
  if (!columnString) return null;

  const definitionParts = columnString.split(",");

  // TODO: Certainly could refactor column definition parsing (fairly lengthy?)
  return definitionParts.reduce((accum: ColumnDefinitions, part) => {
    let [key, alias] = part.split(/[:@]/);
    key = key.trim();

    // Column alias will always be the second column definition part (after ':')
    alias = alias?.trim();

    // Column type will always be the last column definition part (after '@)
    let [, type] = part.split("@");
    type = type?.trim();
    if (!["string", "number", "boolean"].includes(type)) {
      type = "string";
    }

    const definition: IColumnDefinition = {
      alias,
      key,
      // NOTE: Deliberately use loose "falsy" check (to avoid empty names with no alias)
      name: alias || key,
      type: type as ColumnTypeString,
    };

    return { ...accum, [key]: definition };
  }, {});
};

/**
 * Transform a raw JSON record based on a column definition (applies aliases/types)
 *
 * @param   record  - Raw input record
 * @param   columns - Column definitions
 * @returns Transformed JSON record
 */
const transformRecordFromDefinition = (
  record: JSONObject,
  columns: ColumnDefinitions,
): JSONObject => {
  return Object.keys(record).reduce((itemAccum: JSONObject, key) => {
    const column: IColumnDefinition | undefined = columns[key];
    if (!column) return itemAccum;

    // Format column type as specified in column definition
    const valueString = record[key] as string;
    let value: ColumnType = valueString;
    if (column.type === "number") {
      try {
        value = parseFloat(valueString);
      } catch {
        // TODO: Determine if this should raise an error?
        // NOTE: Ignore invalid parsed values
      }
    } else if (column.type === "boolean") {
      if (["true", "t", "1"].includes(value.toLowerCase())) {
        value = true;
      } else if (["false", "f", "0"].includes(value.toLowerCase())) {
        value = false;
      }
    }

    return { ...itemAccum, [column.name]: value };
  }, {});
};

/**
 * Validate input/output file paths
 *
 * @param  inputFile  - Input file path
 * @param  outputFile - Output file path
 * @throws Error if input or output path are invalid
 */
const validateIOFiles = async (inputFile: string, outputFile?: string) => {
  if (!FileService.validateFileType(inputFile, "csv")) {
    print(chalk.red("Input file type is invalid"));
    process.exit(1);
  }
  if (!(await FileService.checkFileExists(inputFile))) {
    print(chalk.red("Input file does not exist"));
    process.exit(1);
  }
  if (outputFile && !FileService.validateFileType(outputFile, "json")) {
    print(chalk.red("Output file type is invalid"));
    process.exit(1);
  }
};

export default ParseCommand;
