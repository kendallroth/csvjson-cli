# `csvjson` CLI

CLI interface for parsing CSV file to JSON (with argument and file-based transformations).

## Usage

The CLI commands can be run in several ways, either as a linked NPM module (normal) or locally (when developing).

> **NOTE:** Dependencies must be installed with `npm install` before running for the first time!

```sh
# Install as a globally linked NPM module
npm run local:install
csvjson -h

# Run locally
npm run local:run -- -h
```

## Commands

```
Commands:
csvjson parse  Parse a CSV file to JSON output
```

### `parse`

Parse a CSV file to JSON output, optionally mapping/filtering columns via simple string definition **or** a custom transformation file (using default export).

#### Column Definitions

Column definitions (`--column` argument) follow a simple formatting system for aliases and types, where the alias is prepended with `:` and type is prepended with `@`. Types can include `string` (_default_), `number` (parsed as float), and `boolean` (parsed from string representation).

```sh
--columns="hashtag,count@number,is active:active@boolean"
```

| Name        | Alias    | Type      |
| ----------- | -------- | --------- |
| `hashtag`   |          | `string`  |
| `count`     |          | `number`  |
| `is active` | `active` | `boolean` |

> **NOTE:** If used alongside custom transformation file, the custom transformation file will take precedence.

#### Custom Transformation File

A custom transformation file can be used to completely transform or filter records, offering far more flexibility than the column definition string. The transformation file must export a default function, which will be passed the raw parsed record and the current row number. The transformation function must return a customized object, or `null` or `undefined` to skip the record.

```js
module.exports = (record, count) => {
  // Returning 'null' or 'undefined' will filter out records
  if (record.hashtag === "#sample") return null;

  // Records can be completely transformed
  return {
    hashtag: record.hashtag,
    count: parseInt(record.count, 10),
    active: record["is active"] === "true",
  };
};


```

#### API

```
csvjson parse

Parse a CSV file to JSON output

Options:
      --columns         Columns to include (with aliases)                                   [string]
      --ignore-empty    Whether empty lines should be ignored              [boolean] [default: true]
      --input-file      Input CSV file path                                      [string] [required]
      --output-file     Output JSON file path                                               [string]
      --output-table    Whether to output as a table (small datasets)     [boolean] [default: false]
      --transform-file  Record transform/filter file path (requires default export)         [string]
      --types           Column types (simple)                                               [string]
```

```sh
# Simple example with column definition string (table display)
csvjson parse --input-file "./src/examples/sample.csv" --output-table --columns "hashtag,count@number,is active:active@boolean"
# Complex example with custom record transformation file (JSON file output)
csvjson parse --input-file "./src/examples/sample.csv" --output-file "./output/sample.json" --transform-file "./src/examples/transform.js"
```
