// tslint:disable max-classes-per-file no-console
import { assert, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";
import * as uuid from "uuid";

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
        });

        describe("Authenticated, not manager", () => {
            describe("Accounts collection", () => {
                const col = config.accountsCollection;

                it("Can create account with own uid", async () => {
                    const acc = getSampleAccountRecord(uuid());
                    const { userDoc, uid } = await mock({
                        uid: acc.uid,
                        config,
                        auth: { email: acc.email, name: acc.displayName },
                    });

                    await assert.isFulfilled(userDoc(col, uid).set(acc));
                });

                it("Cannot create account with not own uid", async () => {
                    const acc = getSampleAccountRecord(uuid());
                    const { userDoc, uid } = await mock({
                        uid: acc.uid,
                        config,
                        auth: { email: acc.email, name: acc.displayName },
                    });

                    acc.uid = `-some-other-uid-${uuid()}`;

                    await assert.isRejected(userDoc(col, acc.uid).set(acc), /PERMISSION_DENIED/);
                });

                it("Cannot create account with email mismatch", async () => {
                    const acc = getSampleAccountRecord(uuid());
                    const { userDoc, uid } = await mock({
                        uid: acc.uid,
                        config,
                        auth: { email: acc.email, name: acc.displayName },
                    });

                    acc.email = "fake@email";

                    await assert.isRejected(userDoc(col, uid).set(acc), /PERMISSION_DENIED/);
                });

                it("Cannot create account with displayName mismatch", async () => {
                    const acc = getSampleAccountRecord(uuid());
                    const { userDoc, uid } = await mock({
                        uid: acc.uid,
                        config,
                        auth: { email: acc.email, name: acc.displayName },
                    });

                    acc.displayName = "Fake display name";

                    await assert.isRejected(userDoc(col, uid).set(acc), /PERMISSION_DENIED/);
                });

                it("Can read account with own uid", async () => {
                    const { userDoc, uid, createAccount } = await mock({ uid: uuid(), config });
                    const createdAccount = await createAccount(d(uid));

                    await assert.isFulfilled(userDoc(col, createdAccount.uid).get());
                });

                it("Cannot read account with not own uid", async () => {
                    const { userDoc, uid, createAccount } = await mock({ uid: uuid(), config });
                    const createdAccount = await createAccount(`foreign-uid-${uid}`);

                    await assert.isRejected(userDoc(col, createdAccount.uid).get(), /false for 'get'/);
                });

                it("Cannot list", async () => {
                    const { userFirestore, uid, createAccount } = await mock({ uid: uuid(), config });
                    const createdAccount = await createAccount(d(uid));

                    await assert.isRejected(userFirestore.collection(col).get(), /false for 'list'/);
                });
            });

            describe("Roles collection", () => {
                it.skip("Can get own uid");
                it.skip("Can get other user uid");
                it.skip("Cannot list");
                it.skip("Cannot update");
                it.skip("Cannot create");
                it.skip("Cannot delete");
            });
        });

        describe("Authenticated, manager", () => {
            describe("Accounts collection", () => {
                it.skip("Can get data of account that has a role he manages");
                it.skip("Cannot get data of account that doesn't have a role he manages");
                it.skip("Can list accounts that have a role he manages");
                it.skip("Cannot list accounts that doesn't have a role he manages");
                it.skip("Cannot create account with not own uid");
                it.skip("Cannot update an account");
                it.skip("Cannot update own account");
                it.skip("Cannot delete an account");
                it.skip("Cannot delete own account");
            });

            describe("Roles collection", () => {
                it.skip("Can list in role he manages");
                it.skip("Cannot list in role that he doesnt manage");
                it.skip("Can create in role he manages");
                it.skip("Cannot create in role that he doesnt manage");
                it.skip("Cannot update in list that he manages");
                it.skip("Cannot update in list that he doesn't manage");
                it.skip("Can delete in list that he manages");
                it.skip("Cannot delete in list that he doesn't manage");
            });
        });
    });

    describe("Guarded rules", () => {
        it.skip("User without a required role cannot write to callerHasRole() guarded collection");
        it.skip("User with a required role can write to callerHasRole() guarded collection");
    });
});
