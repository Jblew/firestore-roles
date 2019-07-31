// tslint:disable max-classes-per-file no-console
import { expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as fs from "fs";
import * as _ from "lodash";
import "mocha";
import * as path from "path";

import { Configuration } from "../Configuration";

import { Cli } from "./cli";
import { createTempDir, deleteTempDir, LoggerMock } from "./cli.mock.integration.test";

chaiUse(chaiAsPromised);

let tempDir = "";
beforeEach(async () => (tempDir = createTempDir()));
afterEach(async () => await deleteTempDir(tempDir));

describe("cli", function() {
    this.timeout(3000);

    const config: Configuration = {
        accountsCollection: "accounts",
        roleCollectionPrefix: "role_",
        roles: {
            admin: { manages: ["manager", "editor", "reviewer"] },
            manager: { manages: ["editor", "reviewer"] },
            editor: { manages: [] },
            reviewer: { manages: [] },
        },
    };

    const innerRules = `match /post/{uid} {}`;

    it("Saves rules to specified file", async () => {
        const configFile = path.resolve(tempDir, "config.js");
        const innerRulesFile = path.resolve(tempDir, "inner.rules");
        const outputFile = path.resolve(tempDir, "deploy.rules");
        const configContents = `module.exports = ${JSON.stringify(config)}`;
        fs.writeFileSync(configFile, configContents, "UTF-8");
        fs.writeFileSync(innerRulesFile, innerRules, "UTF-8");
        const logger = new LoggerMock();

        const args = ["node", "cli-entrypoint.js", "generate", configFile, innerRulesFile, outputFile];
        const exitCode = await new Cli(logger, args).parseCli();

        expect(exitCode).to.be.equal(0);
        expect(logger.stderr).to.be.equal("");
        expect(fs.existsSync(outputFile), "Output file exists").to.be.equal(true);
        const outputRead = fs.readFileSync(outputFile, "UTF-8");

        expect(outputRead).to.include(innerRules);
    });
});
