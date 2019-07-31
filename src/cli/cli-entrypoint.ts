#!/usr/bin/env node

// tslint:disable no-console

import { Cli } from "./cli";

const logger: Cli.Logger = {
    log(msg: string) {
        console.log(msg);
    },
    error(msg: string) {
        console.error(msg);
    },
};

(async () => {
    new Cli(logger, process.argv).parseCli();
})();
