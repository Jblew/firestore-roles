import * as fs from "fs";
import ow from "ow";
import * as path from "path";

import { Configuration } from "../config/Configuration";

import { CliError } from "./CliError";
import { execGenerateCmd } from "./cmd-generate";
import { getUsage } from "./usage";
import { assertFileExists, resolveFile } from "./util";

export class Cli {
    private logger: Cli.Logger;
    private argv: string[];

    public constructor(logger: Cli.Logger, argv: string[]) {
        Cli.Logger.validate(logger);
        this.logger = logger;

        ow(argv, ow.array.ofType(ow.string));
        this.argv = argv;
    }

    public async parseCli(): Promise<number> {
        if (this.argv.length < 4) {
            return this.exitWithUsage();
        }

        this.argv.shift();
        this.argv.shift();

        const command: string = this.argv.shift() as string;
        return await this.wrapErrors(() => this.processCommand(command, this.argv as string[]));
    }

    private exitWithUsage(): number {
        this.logger.log(getUsage());
        return 1;
    }

    private async wrapErrors(fn: () => Promise<number>): Promise<number> {
        try {
            return await fn();
        } catch (error) {
            this.handleError(error);
            return 1;
        }
    }

    private handleError(error: Error) {
        /* istanbul ignore else "normally all errors are wrapped with CliError" */
        if ((error as CliError).cliError) this.logger.error(`Error: ${error.message}`);
        else this.logger.error(error + "" + error.stack);
    }

    private async processCommand(command: string, args: string[]): Promise<number> {
        switch (command) {
            case "generate":
                return await this.processGenerateCmd(args);
                break;

            default:
                /* istanbul ignore next */
                return this.exitWithUsage();
        }
    }

    private async processGenerateCmd(args: string[]): Promise<number> {
        /* istanbul ignore if */
        if (args.length < 2 || args.length > 3) {
            /* istanbul ignore next "This was already checked previously" */ return this.exitWithUsage();
        }

        let outputFile: string | undefined;
        const [configFileUnresolved, rulesFileUnresolved] = args;
        /* istanbul ignore else */
        if (args.length === 3) outputFile = resolveFile(args[2]);

        const configFile = resolveFile(path.resolve(configFileUnresolved));
        const rulesFile = resolveFile(path.resolve(rulesFileUnresolved));

        assertFileExists(configFile);
        assertFileExists(rulesFile);

        const config = this.requireConfig(configFile);
        const rules = fs.readFileSync(rulesFile, "UTF-8");
        const { output, message } = await execGenerateCmd(config, rules);
        this.logger.log(message);
        this.logger.log("");

        /* istanbul ignore else */
        if (outputFile) {
            fs.writeFileSync(outputFile, output, "UTF-8");
            this.logger.log(`Successfully written to file ${outputFile}`);
        }
        return 0;
    }

    private requireConfig(configFilePath: string): Configuration {
        let config = require(configFilePath);

        if (!config.roles && config.default) config = config.default;

        try {
            Configuration.validate(config);
            return config as Configuration;
        } catch (err) {
            throw new CliError(
                `Invalid config: \n${JSON.stringify(config, undefined, 2)}\n ${err.name} ${err.message}: ${err.stack}`,
                err,
            );
        }
    }
}
/* istanbul ignore next "Namespace init bug" */
export namespace Cli {
    export interface Logger {
        log: (msg: string) => void;
        error: (msg: string) => void;
    }

    export namespace Logger {
        export function validate(l: Logger) {
            ow(l.log, "Logger.log", ow.function);
            ow(l.error, "Logger.error", ow.function);
        }
    }
}
