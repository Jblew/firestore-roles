// tslint:disable max-classes-per-file no-console
import { assert, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";
import * as uuid from "uuid";

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
                    const { userDoc } = await mock({ uid: uuid(), config });

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
});
