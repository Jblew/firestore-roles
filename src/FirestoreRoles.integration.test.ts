// tslint:disable max-classes-per-file no-console
import { expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";

import { Configuration } from "./Configuration";
import { cleanupEach, getAccountRecord, mock, startupAll } from "./FirestoreRoles.mock.integration.test";
import { AccountRecord } from "./model/AccountRecord";
import { FirebaseAccount } from "./types/FirebaseAccount";
import { FirestoreRoles } from "./FirestoreRoles";

chaiUse(chaiAsPromised);

before("startup", function() {
    this.timeout(4000);
    startupAll();
});
afterEach(cleanupEach);

const config: Configuration.Optional = {
    roles: {
        admin: { manages: ["manager", "editor", "reviewer"] },
        manager: { manages: ["editor", "reviewer"] },
        editor: { manages: [] },
        reviewer: { manages: [] },
    },
};

describe("FirestoreRoles", () => {
    describe("registerUser", () => {
        it("Adds user to database", async () => {
            const { roles, sampleAccount, sampleAccountDoc } = mock({});
            await roles.registerUser(sampleAccount);

            const obtainedUser = await getAccountRecord(sampleAccountDoc);
            expect(obtainedUser.uid).to.be.equal(sampleAccount.uid);
        });

        it("Adds user with roles defined as empty array", async () => {
            const { roles, sampleAccount, sampleAccountDoc } = mock({});
            await roles.registerUser(sampleAccount);

            const obtainedAR = await getAccountRecord(sampleAccountDoc);
            expect(obtainedAR.roles)
                .to.be.an("array")
                .with.length(0);
        });

        it("Adds user with requested roles defined as empty array", async () => {
            const { roles, sampleAccount, sampleAccountDoc } = mock({});
            await roles.registerUser(sampleAccount);

            const obtainedAR = await getAccountRecord(sampleAccountDoc);
            expect(obtainedAR.requestedRoles)
                .to.be.an("array")
                .with.length(0);
        });
    });

    describe("setRoles", () => {
        it.skip("Sets roles of account");
        it.skip("Does not modify other properties of an account");
    });

    describe("getRoles", () => {
        it.skip("Fails if account doesnt exist");
        it.skip("Returns empty array if account never had roles set up");
        it.skip("Returns previously set roles");
    });

    describe("hasRoles", () => {
        it.skip("Returns true if user has a role");
        it.skip("Returns false if user does not have a role");
    });

    describe("getRequestedRoles", () => {
        it.skip("Fails if account doesnt exist");
        it.skip("Returns empty array if account never had roles set up");
        it.skip("Returns previously set roles");
    });

    describe("requestRoles", () => {
        it.skip("Adds specified roles to requestedRoles");
        it.skip("Does not remove previous roles when adding new ones");
    });

    describe("removeFromRequestedRoles", () => {
        it.skip("Removes only specified roles from requested roles");
    });
});
