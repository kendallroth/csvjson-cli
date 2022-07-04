import { parse as parseCsv } from "csv";
import fs, { constants as fsConstants } from "fs";
import fsPromise from "fs/promises";
import path from "path";

// Types
import { JSONObject } from "@typings/app.types";

class FileService {
  /**
   * Check whether a file exists
   *
   * @param   filePath - File path
   * @returns Whether file exists
   */
  async checkFileExists(filePath: string): Promise<boolean> {
    try {
      await fsPromise.access(filePath, fsConstants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Parse a CSV file (using streams for performance)
   *
   * @param   filePath       - CSV file path
   * @param   recordCallback - Callback for each record as it is parsed
   * @throws  Error if CSV path is invalid/nonexistant
   * @returns CSV file data
   */
  async readCsvFile(
    filePath: string,
    parser: ReturnType<typeof parseCsv>,
    recordCallback?: (record: JSONObject, count: number) => void,
  ): Promise<JSONObject[]> {
    if (!this.validateFileType(filePath, "csv")) {
      throw new Error("Input file type is invalid");
    }

    const filePathFull = path.join(process.cwd(), filePath);
    const fileExists = await this.checkFileExists(filePathFull);
    if (!fileExists) throw new Error("File path does not exist!");

    // Use file streams to handle massive files (sync can only support ~425 MB)!
    const parseStream = fs.createReadStream(filePath).pipe(parser);

    // Execute callback for each record to enable faster parsing/handling
    const records = [];
    for await (const record of parseStream) {
      records.push(record);
      recordCallback?.(record, records.length);
    }

    return records;
  }

  /**
   * Write a JSON file
   *
   * @param filePath - Output file path
   * @param data     - JSON data
   */
  async writeJsonFile(filePath: string, data: JSONObject | JSONObject[]): Promise<void> {
    if (!this.validateFileType(filePath, "json")) {
      throw new Error("Input file type is invalid");
    }

    const filePathFull = path.join(process.cwd(), filePath);
    await fsPromise.writeFile(filePathFull, JSON.stringify(data, null, 2));
  }

  /**
   * Validate whether a file path has a valid file type
   *
   * @param   filePath   - File path (with extension)
   * @param   extensions - Valid file extension(s)
   * @returns Whether file path has a valid extension
   */
  validateFileType(filePath: string, extensions: string | string[]): boolean {
    const extension = filePath.split(".").pop();
    if (!extension) return false;

    return Array.isArray(extensions) ? extensions.includes(extension) : extensions === extension;
  }
}

const singleton = new FileService();
export default singleton;
