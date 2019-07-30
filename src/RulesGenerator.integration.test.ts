// tslint:disable max-classes-per-file no-console
import { assert, expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";

import { Configuration } from "./Configuration";
import { cleanupEach, mock } from "./RulesGenerator.mock.integration.test";

chaiUse(chaiAsPromised);

afterEach(cleanupEach);

const config: Configuration = {
    accountsCollection: "accounts",
    roles: {
        admin: { manages: ["manager", "editor", "reviewer"] },
        manager: { manages: ["editor", "reviewer"] },
        editor: { manages: [] },
        reviewer: { manages: [] },
    },
};

describe.only("RulesGenerator", function() {
    this.timeout(3000);

    describe("Generated rules for accounts collection", () => {
        const col = config.accountsCollection;
        describe("Not authenticated user", () => {
            it.only("Cannot create in accounts collection", async () => {
                const { userFirestore } = await mock({ uid: undefined, config, customRules: "" });

                await assert.isRejected(userFirestore.collection(col).add({ da: "ta" }), /PERMISSION_DENIED/);
                await assert.isRejected(userFirestore.collection(col).add({ roles: ["ta"] }), /PERMISSION_DENIED/);
            });

            it("Cannot get from accounts collection", async () => {
                const { userDoc, adminDoc } = await mock({ uid: undefined, config, customRules: "" });
                await adminDoc(col, "a").set({ da: "ta" });

                await assert.isRejected(userDoc(col, "a").get(), /false for/);
            });

            it("Cannot set to accounts collection", async () => {
                const { userDoc } = await mock({ uid: undefined, config, customRules: "" });

                await assert.isRejected(userDoc(col, "a").set({ da: "ta" }), /PERMISSION_DENIED/);
            });

            it("Cannot update in accounts collection", async () => {
                const { userDoc, adminDoc } = await mock({ uid: undefined, config, customRules: "" });
                await adminDoc(col, "a").set({ da: "ta" });

                await assert.isRejected(userDoc(col, "a").update({ ano: "ther" }), /PERMISSION_DENIED/);
            });

            it("Cannot delete in accounts collection", async () => {
                const { userDoc, adminDoc } = await mock({ uid: undefined, config, customRules: "" });
                await adminDoc(col, "a").set({ da: "ta" });

                await assert.isRejected(userDoc(col, "a").delete(), /PERMISSION_DENIED/);
            });

            it.skip("Cannot list from accounts collection");
        });

    });
});
