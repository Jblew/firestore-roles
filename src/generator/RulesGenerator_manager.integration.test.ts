// tslint:disable max-classes-per-file no-console
import { assert, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";
import * as uuid from "uuid";

import { AccountRecord } from "../model/AccountRecord";
import { FirestoreRecordKeeper } from "../model/FirestoreRecordKeeper";

import { cleanupEach, config, getSampleAccountRecord, mock } from "./RulesGenerator.mock.integration.test";

chaiUse(chaiAsPromised);

/**
 * This integration tests serve mostly for security reasons. That is why the checks are performed on
 * raw firestore calls level instead of using FirestoreRoles class
 */

describe("RulesGenerator", function() {
    this.timeout(3000);

    afterEach(cleanupEach);

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
