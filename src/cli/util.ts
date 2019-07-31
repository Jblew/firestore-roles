import * as fs from "fs";
import * as path from "path";

import { CliError } from "./CliError";

export function assertFileExists(file: string) {
    if (!fs.existsSync(file)) throw new CliError(`File ${file} doesnt exist!`);
}

export function resolveFile(file: string) {
    return path.resolve(process.cwd(), file);
}
