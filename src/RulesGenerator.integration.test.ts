// tslint:disable max-classes-per-file no-console
import { assert, expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";

import { Configuration } from "./Configuration";
import { cleanupEach, d, mock, getSampleAccountRecord } from "./RulesGenerator.mock.integration.test";

chaiUse(chaiAsPromised);

afterEach(cleanupEach);

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

describe.only("RulesGenerator", function() {
    this.timeout(3000);

    describe("Generated rules for accounts collection", () => {
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

        describe("Authenticated, not manager", () => {
            it("Can create account with own uid", async () => {
                const { userDoc, uid } = await mock({ uid: uuid(), config });

                await assert.isFulfilled(userDoc(col, d(uid)).set({ da: "ta", some: "opts" }, {}));
            });

            it("Cannot create account with own uid with not empty roles field", async () => {
                const { userDoc, uid } = await mock({ uid: uuid(), config });

                await assert.isRejected(userDoc(col, d(uid)).set({ da: "ta", roles: ["admin"] }), /PERMISSION_DENIED/);
            });

            it("Cannot create account with not own uid", async () => {
                const { userDoc } = await mock({ uid: uuid(), config });

                await assert.isRejected(userDoc(col, "foreign-uid").set({ da: "ta" }), /PERMISSION_DENIED/);
            });

            it("Can read account with own uid", async () => {
                const { userDoc, adminDoc, uid } = await mock({ uid: uuid(), config });
                await adminDoc(col, d(uid)).set({ da: "ta" });

                await assert.isFulfilled(userDoc(col, d(uid)).get());
            });

            it("Cannot read account with not own uid", async () => {
                const { userDoc, adminDoc } = await mock({ uid: uuid(), config });
                const foreignUid = "foreign-uid";
                await adminDoc(col, "foreign-uid").set({ da: "ta" });

                await assert.isRejected(userDoc(col, "foreign-uid").get(), /false for 'get'/);
            });

            it("Cannot list", async () => {
                const { userFirestore } = await mock({ uid: uuid(), config });

                await assert.isRejected(userFirestore.collection(col).get(), /false for 'list'/);
            });

            async function setRequestedRoles() {}

            it("Can request a role for own uid", async () => {
                const { userDoc, createAccount, uid } = await mock({ uid: uuid(), config });
                const account = await createAccount(d(uid));
                await assert.isFulfilled(userDoc(col, d(uid)).update({ requestedRoles: ["newrole"] }));
            });

            it("Cannot request a role for foreigh uid", async () => {
                const { userDoc, createAccount, uid } = await mock({ uid: undefined, config });
                const account = await createAccount("foreignuid");
                await assert.isRejected(
                    userDoc(col, d(uid)).update({ requestedRoles: ["newrole"] }),
                    /false for 'update'/,
                );
            });

            it("Can remove own role from requested roles", async () => {
                const { userDoc, adminDoc, createAccount, uid } = await mock({
                    uid: undefined,
                    config,
                });
                const account = await createAccount("foreignuid");
                await adminDoc(col, d(uid)).update({ requestedRoles: [] });
                await assert.isRejected(
                    userDoc(col, d(uid)).update({ requestedRoles: ["newrole"] }),
                    /false for 'update'/,
                );
            });

            it("Cannot remove foreign role from requested roles", async () => {});

            it.skip("Cannot set roles field");

            it.skip("Cannot delete a role");

            it.skip("Cannot update roles field");

            it.skip("Cannot empty roles field");

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
            it.skip("Cannot empty roles field when there are roles that he doesnt manage");
            it.skip("Can add requestedRoles that he manages");
            it.skip("Cannot add requestedRoles that he doesnt manage");
            it.skip("Can remove requestedRoles that he manages");
            it.skip("Cannot remove requestedRoles that he doesnt manage");
            it.skip("Cannot empty roles field when there are requestedRoles that he doesnt manage");
            it.skip("Cannot update or set other fields in users with roles that he manages");
            it.skip("Cannot update or set other fields in users with roles that he doesnt manage");
        });
    });

    describe("Guarded rules", () => {
        it.skip("User without a required role cannot write to hasRoles() guarded collection");
        it.skip("User with a required role can write to hasRoles() guarded collection");
    });
});
