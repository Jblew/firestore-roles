/* tslint:disable:max-classes-per-file */
import { expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";

import { Configuration } from "./Configuration";

chaiUse(chaiAsPromised);

describe("Configuration", () => {
    it("Default configuration passes validation", () => {
        Configuration.validate(Configuration.DEFAULT);
    });

    it("Disallows managing non-defined role", () => {
        const config: Configuration = {
            ...Configuration.DEFAULT,
            roles: {
                admin: { manages: ["nonexistentrole"] },
                editor: { manages: [] },
            },
        };

        expect(() => Configuration.validate(config)).to.throw("ArgumentError");
    });
});
