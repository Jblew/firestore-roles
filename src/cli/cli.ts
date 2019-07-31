// tslint:disable no-console
import * as fs from "fs";
import * as path from "path";

import { CliError } from "./CliError";
import { execGenerateCmd } from "./cmd-generate";
import { getUsage } from "./usage";
import { assertFileExists, resolveFile } from "./util";

export function parseCli() {
    if (process.argv.length < 4) {
        return exitWithUsage();
    }

    process.argv.shift();
    process.argv.shift();

    const command: string = process.argv.shift() as string;
    wrapErrors(() => processCommand(command, process.argv as string[]));
}

function exitWithUsage() {
    console.log(getUsage());
    process.exit(1);
}

function wrapErrors(fn: () => Promise<void>) {
    (async () => {
        try {
            await fn();
        } catch (error) {
            handleError(error);
        }
    })();
}

function handleError(error: Error) {
    if ((error as CliError).cliError) console.error(`Error: ${error.message}`);
    else console.error(error);
}

async function processCommand(command: string, args: string[]) {
    switch (command) {
        case "generate":
            await processGenerateCmd(args);
            break;

        default:
            return exitWithUsage();
    }
}

async function processGenerateCmd(args: string[]) {
    if (args.length < 2 || args.length > 3) return exitWithUsage();

    let outputFile: string | undefined;
    const [configFileUnresolved, rulesFileUnresolved] = args;
    if (args.length === 3) outputFile = resolveFile(args[3]);

    const configFile = resolveFile(path.resolve(configFileUnresolved));
    const rulesFile = resolveFile(path.resolve(rulesFileUnresolved));

    assertFileExists(configFile);
    assertFileExists(rulesFile);

    const config = require(configFile);
    const rules = fs.readFileSync(rulesFile, "UTF-8");
    const { output, message } = await execGenerateCmd(config, rules);

    if (outputFile) {
        fs.writeFileSync(outputFile, output, "UTF-8");
        console.log(`Successfully written to file ${outputFile}`);
    }
}
