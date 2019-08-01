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

describe("cli", function() {
    this.timeout(3000);

    let tempDir = "";
    beforeEach(async () => (tempDir = createTempDir()));
    afterEach(async () => await deleteTempDir(tempDir));

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

    describe("Test with saving the file", () => {
        let configFile = "";
        let innerRulesFile = "";
        let outputFile = "";
        let logger: LoggerMock = new LoggerMock();

        const configContentsModuleExports = `module.exports = ${JSON.stringify(config)}`;
        const configContentsModuleExportsInvalid = `module.exports = { in: "valid" }`;
        const configContentsExportsDefault = `exports.default = ${JSON.stringify(config)}`;

        function writeConfig(configContents: string) {
            fs.writeFileSync(configFile, configContents, "UTF-8");
        }

        beforeEach(async () => {
            configFile = path.resolve(tempDir, "config.js");
            innerRulesFile = path.resolve(tempDir, "inner.rules");
            outputFile = path.resolve(tempDir, "deploy.rules");

            fs.writeFileSync(innerRulesFile, innerRules, "UTF-8");
            writeConfig(configContentsModuleExports);

            logger = new LoggerMock();
        });

        it("Saves rules to specified file", async () => {
            const args = ["node", "cli-entrypoint.js", "generate", configFile, innerRulesFile, outputFile];
            const exitCode = await new Cli(logger, args).parseCli();

            expect(exitCode).to.be.equal(0);
            expect(logger.stderr).to.be.equal("");
            expect(fs.existsSync(outputFile), "Output file exists").to.be.equal(true);
            const outputRead = fs.readFileSync(outputFile, "UTF-8");

            expect(outputRead).to.include(innerRules);
        });

        it("Saves rules to specified file", async () => {
            const args = ["node", "cli-entrypoint.js", "generate", configFile, innerRulesFile, outputFile];
            const exitCode = await new Cli(logger, args).parseCli();

            expect(exitCode).to.be.equal(0);
            expect(logger.stderr).to.be.equal("");
            expect(fs.existsSync(outputFile), "Output file exists").to.be.equal(true);
            const outputRead = fs.readFileSync(outputFile, "UTF-8");

            expect(outputRead).to.include(innerRules);
        });

        it("Exits with error on invalid config", async () => {
            writeConfig(configContentsModuleExportsInvalid);
            const args = ["node", "cli-entrypoint.js", "generate", configFile, innerRulesFile, outputFile];
            const exitCode = await new Cli(logger, args).parseCli();

            expect(exitCode).to.be.equal(1);
            expect(logger.stderr)
                .to.be.a("string")
                .with.length.gt(0);
        });

        it("Loads config with module.exports", async () => {
            writeConfig(configContentsModuleExports);
            const args = ["node", "cli-entrypoint.js", "generate", configFile, innerRulesFile, outputFile];
            const exitCode = await new Cli(logger, args).parseCli();

            expect(exitCode).to.be.equal(0);
            expect(logger.stderr)
                .to.be.a("string")
                .with.length(0);
        });

        it("Loads config with exports.default", async () => {
            writeConfig(configContentsExportsDefault);
            const args = ["node", "cli-entrypoint.js", "generate", configFile, innerRulesFile, outputFile];
            const exitCode = await new Cli(logger, args).parseCli();

            expect(exitCode).to.be.equal(0);
            expect(logger.stderr)
                .to.be.a("string")
                .with.length(0);
        });

        it("Prints usage on wrong no of arguments", async () => {
            const args = ["node", "cli-entrypoint.js", "generate"];
            const exitCode = await new Cli(logger, args).parseCli();

            expect(exitCode).to.be.equal(1);
            expect(logger.stdout).to.include("Usage");
        });

        it("Prints to stderr on error (file doesnt exist)", async () => {
            const args = ["node", "cli-entrypoint.js", "generate", "nonexistent.config.f", innerRulesFile, outputFile];
            const exitCode = await new Cli(logger, args).parseCli();

            expect(exitCode).to.be.equal(1);
            expect(logger.stderr)
                .to.be.a("string")
                .with.length.gt(0);
        });
    });
});
