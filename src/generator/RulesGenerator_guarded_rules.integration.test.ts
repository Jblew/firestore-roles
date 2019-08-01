// tslint:disable max-classes-per-file no-console
import { assert, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";
import * as uuid from "uuid";

import { AccountRecord } from "../model/AccountRecord";

import { cleanupEach, config, getSampleAccountRecord, mock } from "./RulesGenerator.mock.integration.test";

chaiUse(chaiAsPromised);

/**
 * This integration tests serve mostly for security reasons. That is why the checks are performed on
 * raw firestore calls level instead of using FirestoreRoles class
 */

describe("RulesGenerator", function() {
    this.timeout(3000);

    afterEach(cleanupEach);

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
