import * as fs from "fs";
import * as path from "path";
import * as rimraf from "rimraf";
import * as uuid from "uuid/v4";

import { Cli } from "./cli";

export function createTempDir(): string {
    const name = `tmp-${uuid()}`;
    const absolute = path.resolve(process.cwd(), name);
    fs.mkdirSync(absolute);
    return absolute;
}

export async function deleteTempDir(tempDirPath: string) {
    await new Promise((resolve, reject) => {
        rimraf(tempDirPath, error => {
            if (error) reject(error);
            else resolve();
        });
    });
}

export class LoggerMock implements Cli.Logger {
    public stdout: string = "";
    public stderr: string = "";

    public log(msg: string) {
        this.stdout += msg + "\n";
    }

    public error(msg: string) {
        this.stderr += msg + "\n";
    }
}
