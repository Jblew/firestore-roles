// tslint:disable max-classes-per-file no-console
import { assert, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";
import * as uuid from "uuid";

import { AccountRecord } from "../model/AccountRecord";

import { cleanupEach, config, mock } from "./RulesGenerator.mock.integration.test";

chaiUse(chaiAsPromised);

/**
 * This integration tests serve mostly for security reasons. That is why the checks are performed on
 * raw firestore calls level instead of using FirestoreRoles class
 */

describe("RulesGenerator", function() {
    this.timeout(3000);

    afterEach(cleanupEach);

    describe("Not authenticated user", () => {
        describe("Accounts collection", () => {
            const col = config.accountsCollection;

            it("Cannot create in accounts collection", async () => {
                const { userFirestore } = await mock({ uid: undefined, config });

                await assert.isRejected(userFirestore.collection(col).add({ da: "ta" }), /PERMISSION_DENIED/);
                await assert.isRejected(userFirestore.collection(col).add({ roles: ["ta"] }), /PERMISSION_DENIED/);
            });

            it("Cannot get from accounts collection", async () => {
                const { userDoc, adminDoc } = await mock({ uid: undefined, config });
                await adminDoc(col, "a").set({ da: "ta" });

                await assert.isRejected(userDoc(col, "a").get(), /false for 'get'/);
            });

            it("Cannot set to accounts collection", async () => {
                const { userDoc } = await mock({ uid: undefined, config });

                await assert.isRejected(userDoc(col, "a").set({ da: "ta" }), /PERMISSION_DENIED/);
            });

            it("Cannot update in accounts collection", async () => {
                const { userDoc, adminDoc } = await mock({ uid: undefined, config });
                await adminDoc(col, "a").set({ da: "ta" });

                await assert.isRejected(userDoc(col, "a").update({ ano: "ther" }), /PERMISSION_DENIED/);
            });

            it("Cannot delete in accounts collection", async () => {
                const { userDoc, adminDoc } = await mock({ uid: undefined, config });
                await adminDoc(col, "a").set({ da: "ta" });

                await assert.isRejected(userDoc(col, "a").delete(), /PERMISSION_DENIED/);
            });

            it("Cannot list from accounts collection", async () => {
                const { userFirestore } = await mock({ uid: undefined, config });

                await assert.isRejected(userFirestore.collection(col).get(), /false for 'list'/);
            });
        });

        describe("Roles collection", () => {
            const col = config.roleCollectionPrefix + _.keys(config.roles)[0];

            it("Cannot list", async () => {
                const { userFirestore } = await mock({ uid: undefined, config });
                await assert.isRejected(userFirestore.collection(col).get(), /false for 'list'/);
            });

            it("Cannot read", async () => {
                const { userDoc, createAccount } = await mock({ uid: undefined, config });
                const createdAccount = await createAccount(uuid());

                await assert.isRejected(userDoc(col, createdAccount.uid).get(), /false for 'get'/);
            });

            it("Cannot create", async () => {
                const { userFirestore } = await mock({ uid: undefined, config });

                await assert.isRejected(userFirestore.collection(col).add({ uid: "uid" }), /PERMISSION_DENIED/);
            });

            it("Cannot update", async () => {
                const { userDoc, createAccount } = await mock({ uid: undefined, config });
                const createdAccount = await createAccount(uuid());

                await assert.isRejected(userDoc(col, createdAccount.uid).update({ a: "b" }), /PERMISSION_DENIED/);
            });

            it("Cannot delete", async () => {
                const { userDoc, createAccount } = await mock({ uid: undefined, config });
                const createdAccount = await createAccount(uuid());

                await assert.isRejected(userDoc(col, createdAccount.uid).delete(), /PERMISSION_DENIED/);
            });
        });

        describe("Role requests collection", () => {
            const col = config.roleRequestsCollectionPrefix + _.keys(config.roles)[0];

            it("Cannot list", async () => {
                const { userFirestore } = await mock({ uid: undefined, config });
                await assert.isRejected(userFirestore.collection(col).get(), /false for 'list'/);
            });

            it("Cannot read", async () => {
                const { userDoc, createAccount } = await mock({ uid: undefined, config });
                const createdAccount = await createAccount(uuid());

                await assert.isRejected(userDoc(col, createdAccount.uid).get(), /false for 'get'/);
            });

            it("Cannot create", async () => {
                const { userFirestore } = await mock({ uid: undefined, config });

                await assert.isRejected(userFirestore.collection(col).add({ uid: "uid" }), /PERMISSION_DENIED/);
            });

            it("Cannot update", async () => {
                const { userDoc, createAccount } = await mock({ uid: undefined, config });
                const createdAccount = await createAccount(uuid());

                await assert.isRejected(userDoc(col, createdAccount.uid).update({ a: "b" }), /PERMISSION_DENIED/);
            });

            it("Cannot delete", async () => {
                const { userDoc, createAccount } = await mock({ uid: undefined, config });
                const createdAccount = await createAccount(uuid());

                await assert.isRejected(userDoc(col, createdAccount.uid).delete(), /PERMISSION_DENIED/);
            });
        });
    });
});
