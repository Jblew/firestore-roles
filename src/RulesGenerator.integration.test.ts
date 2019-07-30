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
            it("Cannot create in accounts collection", async () => {
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

        describe("Authenticated, not manager", () => {
            it.skip("Can create account with own uid");
            it.skip("Can create account with own uid with empty roles field");
            it.skip("Cannot create account with own uid with not empty roles field");
            it.skip("Cannot create account with not own uid");
            it.skip("Can read account with own uid");
            it.skip("Cannot read account with not own uid");
            it.skip("Cannot list");
            it.skip("Can request a role");
            it.skip("Can remove role from requested roles");
            it.skip("Cannot set roles field");
            it.skip("Cannot delete a role");
            it.skip("Cannot update roles field");
            it.skip("Cannot update other fields");
        });

        describe("Authenticated, manager", () => {
            it.skip("Cannot update or set own roles field");
            it.skip("Cannot create account with own uid with not empty roles field");
            it.skip("Cannot create account with not own uid");
            it.skip("Can list users with roles he manages");
            it.skip("Cannot list users with roles that he doesnt manage");
            it.skip("Can get users with roles he manages");
            it.skip("Cannot get users with roles that he doesnt manage");
            it.skip("Can add role that he manages");
            it.skip("Cannot add role that he doesnt manage");
            it.skip("Can remove role that he manages");
            it.skip("Cannot remove role that he doesnt manage");
            it.skip("Can add requestedRoles that he manages");
            it.skip("Cannot add requestedRoles that he doesnt manage");
            it.skip("Can remove requestedRoles that he manages");
            it.skip("Cannot remove requestedRoles that he doesnt manage");
            it.skip("Cannot update or set other fields in users with roles that he manages");
            it.skip("Cannot update or set other fields in users with roles that he doesnt manage");
        });
    });

    describe("Guarded rules", () => {
        it.skip("User without a required role cannot write to hasRoles() guarded collection");
        it.skip("User with a required role can write to hasRoles() guarded collection");
    });
});
