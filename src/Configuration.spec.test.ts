/* tslint:disable:max-classes-per-file */
import { use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";

import { Configuration } from "./Configuration";

chaiUse(chaiAsPromised);

describe("Configuration", () => {
    it("Default configuration passes validation", async () => {
        Configuration.validate(Configuration.DEFAULT);
    });
});
