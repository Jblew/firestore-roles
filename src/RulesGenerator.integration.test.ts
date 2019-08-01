// tslint:disable max-classes-per-file no-console
import { assert, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";
import * as uuid from "uuid";

import { Configuration } from "./config/Configuration";
import { AccountRecord } from "./model/AccountRecord";
import { FirestoreRecordKeeper } from "./model/FirestoreRecordKeeper";
import { cleanupEach, getSampleAccountRecord, mock } from "./RulesGenerator.mock.integration.test";

chaiUse(chaiAsPromised);

/**
 * This integration tests serve mostly for security reasons. That is why the checks are performed on
 * raw firestore calls level instead of using FirestoreRoles class
 */

describe("RulesGenerator", function() {
    this.timeout(3000);

    afterEach(cleanupEach);

    const config: Configuration = {
        accountsCollection: "accounts",
        roleCollectionPrefix: "role_",
        roleRequestsCollectionPrefix: "role_requests_",
        roles: {
            admin: { manages: ["manager", "editor", "reviewer"] },
            manager: { manages: ["editor", "reviewer"] },
            editor: { manages: [] },
            reviewer: { manages: [] },
        },
    };

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
                    const { userDoc } = await mock({
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
                    const createdAccount = await createAccount(uid);

                    await assert.isFulfilled(userDoc(col, createdAccount.uid).get());
                });

                it("Cannot read account with not own uid", async () => {
                    const { userDoc, uid, createAccount } = await mock({ uid: uuid(), config });
                    const createdAccount = await createAccount(`foreign-uid-${uid}`);

                    await assert.isRejected(userDoc(col, createdAccount.uid).get(), /false for 'get'/);
                });

                it("Cannot list", async () => {
                    const { userFirestore, uid, createAccount } = await mock({ uid: uuid(), config });
                    await createAccount(uid);

                    await assert.isRejected(
                        userFirestore
                            .collection(col)
                            .where("uid", "==", uid)
                            .get(),
                        /false for 'list'/,
                    );
                });
            });

            [
                { name: "Roles collection", colPrefix: config.roleCollectionPrefix, canCreateOwnUid: false },
                {
                    name: "Role requests collection",
                    colPrefix: config.roleRequestsCollectionPrefix,
                    canCreateOwnUid: true,
                },
            ].forEach(colType =>
                describe(colType.name, () => {
                    const role = _.keys(config.roles)[0];
                    const col = colType.colPrefix + role;

                    it("Can get own uid", async () => {
                        const { userDoc, uid, adminEnableRole } = await mock({ uid: uuid(), config });
                        await adminEnableRole(uid, role);

                        await assert.isFulfilled(userDoc(col, uid).get());
                    });

                    it("Can get other user uid", async () => {
                        const { userDoc, uid, adminEnableRole } = await mock({ uid: uuid(), config });
                        const someoneElsesUid = `someone-${uid}`;
                        await adminEnableRole(someoneElsesUid, role);

                        await assert.isFulfilled(userDoc(col, someoneElsesUid).get());
                    });

                    it("Cannot list", async () => {
                        const { userFirestore, uid, adminEnableRole } = await mock({ uid: uuid(), config });
                        await adminEnableRole(uid, role);

                        await assert.isRejected(userFirestore.collection(col).get(), /false for 'list'/);
                    });

                    it("Cannot update", async () => {
                        const { userDoc, uid, adminEnableRole } = await mock({ uid: uuid(), config });
                        await adminEnableRole(uid, role);

                        await assert.isRejected(userDoc(col, uid).update({ da: "ta" }), /PERMISSION_DENIED/);
                    });

                    it((colType.canCreateOwnUid ? "Can" : "Cannot") + " create record with own uid", async () => {
                        const { userDoc, uid } = await mock({ uid: uuid(), config });

                        if (colType.canCreateOwnUid) {
                            await assert.isFulfilled(userDoc(col, uid).set(FirestoreRecordKeeper));
                        } else {
                            await assert.isRejected(userDoc(col, uid).set(FirestoreRecordKeeper), /PERMISSION_DENIED/);
                        }
                    });

                    it("Cannot create record with not own uid", async () => {
                        const { userDoc, uid } = await mock({ uid: uuid(), config });

                        await assert.isRejected(
                            userDoc(col, "-some-other-uid").set(FirestoreRecordKeeper),
                            /PERMISSION_DENIED/,
                        );
                    });

                    it("Cannot delete", async () => {
                        const { userDoc, uid, adminEnableRole } = await mock({ uid: uuid(), config });
                        await adminEnableRole(uid, role);

                        await assert.isRejected(userDoc(col, uid).delete(), /PERMISSION_DENIED/);
                    });
                }),
            );
        });

        describe("Authenticated, manager", () => {
            let projectId = "";
            const manager = { role: "manager", account: getSampleAccountRecord(uuid()) };
            const managedUser = { role: "editor", account: getSampleAccountRecord(uuid()) };
            const notManagedUser = { role: "admin", account: getSampleAccountRecord(uuid()) };

            this.beforeEach(async () => {
                projectId = `firebase-project-${uuid()}`;
                const { adminEnableRole, createAccount } = await mock({ uid: undefined, config, projectId });

                async function createAccountWithRole(props: { account: AccountRecord; role: string }) {
                    await createAccount(props.account.uid, props.account);
                    await adminEnableRole(props.account.uid, props.role);
                }

                await createAccountWithRole(manager);
                await createAccountWithRole(managedUser);
                await createAccountWithRole(notManagedUser);
            });

            describe("Accounts collection", () => {
                const col = config.accountsCollection;

                it("Can get data of account that has a role he manages", async () => {
                    const { userDoc } = await mock({ uid: manager.account.uid, config, projectId });
                    await assert.isFulfilled(userDoc(col, managedUser.account.uid).get());
                });

                it("Cannot get data of account that doesn't have a role he manages", async () => {
                    const { userDoc } = await mock({ uid: manager.account.uid, config, projectId });

                    await assert.isRejected(userDoc(col, notManagedUser.account.uid).get(), /false for 'get'/);
                });

                it("Cannot list accounts", async () => {
                    const { userFirestore } = await mock({ uid: manager.account.uid, config, projectId });

                    await assert.isRejected(
                        userFirestore
                            .collection(col)
                            .where("uid", "==", notManagedUser.account.uid)
                            .get(),
                        /false for 'list'/,
                    );
                });

                it("Cannot create account with not own uid", async () => {
                    const { userDoc } = await mock({ uid: manager.account.uid, config, projectId });
                    const notOwnUid = `not-own-uid-${uuid()}`;

                    await assert.isRejected(
                        userDoc(col, notOwnUid).set(getSampleAccountRecord(notOwnUid)),
                        /PERMISSION_DENIED/,
                    );
                });

                it("Cannot update an account that he manages", async () => {
                    const { userDoc } = await mock({ uid: manager.account.uid, config, projectId });

                    await assert.isRejected(
                        userDoc(col, managedUser.account.uid).update({ email: "da@ta" }),
                        /PERMISSION_DENIED/,
                    );
                });

                it("Cannot update own account", async () => {
                    const { userDoc } = await mock({ uid: manager.account.uid, config, projectId });

                    await assert.isRejected(
                        userDoc(col, manager.account.uid).update({ email: "da@ta" }),
                        /PERMISSION_DENIED/,
                    );
                });

                it("Cannot delete an account that he manages", async () => {
                    const { userDoc } = await mock({ uid: manager.account.uid, config, projectId });

                    await assert.isRejected(userDoc(col, managedUser.account.uid).delete(), /PERMISSION_DENIED/);
                });

                it("Cannot delete own account", async () => {
                    const { userDoc } = await mock({ uid: manager.account.uid, config, projectId });

                    await assert.isRejected(userDoc(col, manager.account.uid).delete(), /PERMISSION_DENIED/);
                });
            });

            [
                {
                    name: "Roles collection",
                    colPrefix: config.roleCollectionPrefix,
                    canCreateNotOwnUidInRoleHeManages: true,
                },
                {
                    name: "Role requests collection",
                    colPrefix: config.roleRequestsCollectionPrefix,
                    canCreateNotOwnUidInRoleHeManages: false,
                },
            ].forEach(colType =>
                describe(colType.name, () => {
                    it("Can list in role he manages", async () => {
                        const role = managedUser.role;
                        const { userFirestore } = await mock({ uid: manager.account.uid, config, projectId });

                        const col = `${colType.colPrefix}${role}`;
                        await assert.isFulfilled(userFirestore.collection(col).get());
                    });

                    it("Cannot list in role that he doesnt manage", async () => {
                        const role = notManagedUser.role;
                        const { userFirestore } = await mock({ uid: manager.account.uid, config, projectId });

                        const col = `${colType.colPrefix}${role}`;
                        await assert.isRejected(userFirestore.collection(col).get(), /false for 'list'/);
                    });

                    it(
                        (colType.canCreateNotOwnUidInRoleHeManages ? "Can" : "Cannot") +
                            " create not own uid in role he manages",
                        async () => {
                            const role = managedUser.role;
                            const { userDoc } = await mock({ uid: manager.account.uid, config, projectId });

                            const col = `${colType.colPrefix}${role}`;
                            if (colType.canCreateNotOwnUidInRoleHeManages) {
                                await assert.isFulfilled(userDoc(col, "-not-own-uid-").set(FirestoreRecordKeeper));
                            } else {
                                await assert.isRejected(
                                    userDoc(col, "-not-own-uid-").set(FirestoreRecordKeeper),
                                    /PERMISSION_DENIED/,
                                );
                            }
                        },
                    );

                    it("Cannot create in role that he doesnt manage", async () => {
                        const role = notManagedUser.role;
                        const { userDoc } = await mock({ uid: manager.account.uid, config, projectId });

                        const col = `${colType.colPrefix}${role}`;
                        await assert.isRejected(userDoc(col, "doc").set(FirestoreRecordKeeper), /PERMISSION_DENIED/);
                    });

                    it("Cannot update in list that he manages", async () => {
                        const role = managedUser.role;
                        const { userDoc } = await mock({ uid: manager.account.uid, config, projectId });

                        const col = `${colType.colPrefix}${role}`;
                        await assert.isRejected(
                            userDoc(col, managedUser.account.uid).update({ da: "ta" }),
                            /PERMISSION_DENIED/,
                        );
                    });

                    it("Cannot update in list that he doesn't manage", async () => {
                        const role = notManagedUser.role;
                        const { userDoc } = await mock({ uid: manager.account.uid, config, projectId });

                        const col = `${colType.colPrefix}${role}`;
                        await assert.isRejected(
                            userDoc(col, notManagedUser.account.uid).update({ da: "ta" }),
                            /PERMISSION_DENIED/,
                        );
                    });

                    it("Can delete in list that he manages", async () => {
                        const role = managedUser.role;
                        const { userDoc } = await mock({ uid: manager.account.uid, config, projectId });

                        const col = `${colType.colPrefix}${role}`;
                        await assert.isFulfilled(userDoc(col, managedUser.account.uid).delete());
                    });

                    it("Cannot delete in list that he doesn't manage", async () => {
                        const role = notManagedUser.role;
                        const { userDoc } = await mock({ uid: manager.account.uid, config, projectId });

                        const col = `${colType.colPrefix}${role}`;
                        await assert.isRejected(userDoc(col, notManagedUser.account.uid).delete(), /PERMISSION_DENIED/);
                    });
                }),
            );
        });
    });

    describe("Guarded rules", () => {
        let projectId = "";
        const userWithRole = { role: "editor", account: getSampleAccountRecord(uuid()) };
        const userWithoutRole = { role: "reviewer", account: getSampleAccountRecord(uuid()) };

        this.beforeEach(async () => {
            projectId = `firebase-project-${uuid()}`;
            const { adminEnableRole, createAccount } = await mock({ uid: undefined, config, projectId });

            async function createAccountWithRole(props: { account: AccountRecord; role: string }) {
                await createAccount(props.account.uid, props.account);
                await adminEnableRole(props.account.uid, props.role);
            }

            await createAccountWithRole(userWithRole);
            await createAccountWithRole(userWithoutRole);
        });
        const guardedCol = "posts";
        const customRules = `
match /${guardedCol}/{post} {
    allow read: if true;
    allow create, write: if isAuthenticated() && callerHasRole("editor");
}
        `;

        it("User without a required role cannot write to callerHasRole() guarded collection", async () => {
            const { userDoc, uid } = await mock({ uid: userWithoutRole.account.uid, config, customRules, projectId });

            await assert.isRejected(userDoc(guardedCol, uid).set({ da: "ta" }), /PERMISSION_DENIED/);
        });

        it("User with a required role can write to callerHasRole() guarded collection", async () => {
            const { userDoc, uid } = await mock({ uid: userWithRole.account.uid, config, customRules, projectId });

            await assert.isFulfilled(userDoc(guardedCol, uid).set({ da: "ta" }));
        });
    });
});
