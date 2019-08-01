// tslint:disable max-classes-per-file no-console
import { expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";
import * as uuid from "uuid/v4";

import { Configuration } from "./config/Configuration";
import { FirestoreRoles } from "./FirestoreRoles";
import { cleanupEach, getAccountRecord, mock, startupAll } from "./FirestoreRoles.mock.integration.test";
import { FirebaseAccount } from "./types/FirebaseAccount";

chaiUse(chaiAsPromised);

const config: Configuration.Optional = {
    roles: {
        admin: { manages: ["manager", "editor", "reviewer"] },
        manager: { manages: ["editor", "reviewer"] },
        editor: { manages: [] },
        reviewer: { manages: [] },
    },
};

describe("FirestoreRoles", function() {
    this.timeout(3000);

    before("startup", function() {
        this.timeout(4000);
        startupAll();
    });
    afterEach(cleanupEach);

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
            expect(obtainedAR.uid).to.be.equal(sampleAccount.uid);
            expect(obtainedAR.displayName).to.be.equal(sampleAccount.displayName);
        });

        it("Adds user with requested roles defined as empty array", async () => {
            const { roles, sampleAccount, sampleAccountDoc } = mock({});
            await roles.registerUser(sampleAccount);

            const obtainedAR = await getAccountRecord(sampleAccountDoc);
            expect(obtainedAR.displayName).to.be.equal(sampleAccount.displayName);
        });
    });

    describe("userExists", () => {
        it("Returns true for user that exists", async () => {
            const { roles, sampleAccount } = mock({});
            await roles.registerUser(sampleAccount);

            const exists = await roles.userExists(sampleAccount.uid);
            expect(exists).to.be.equal(true);
        });

        it("Returns false for user that does not exists", async () => {
            const { roles, sampleAccount } = mock({});
            await roles.registerUser(sampleAccount);

            const exists = await roles.userExists("-other-uid-");
            expect(exists).to.be.equal(false);
        });
    });

    describe("getAccountRecord", () => {
        it("Returns registered user", async () => {
            const { roles } = mock(config);
            await expect(roles.getAccountRecord("nonexistent-uid"))
                .to.eventually.be.rejectedWith("Account doesnt exist")
                .that.haveOwnProperty("firestoreRolesAccountDoesntExistError");
        });

        it("Throws FirestoreRolesAccountDoesntExistError for non-existent record", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);

            const gotAR = await roles.getAccountRecord(sampleAccount.uid);
            expect(gotAR.displayName).to.be.equal(sampleAccount.displayName);
        });
    });

    describe("enableRole", () => {
        it("Enables role of account", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);

            await roles.enableRole(sampleAccount.uid, "editor");
            await expect(roles.hasRole(sampleAccount.uid, "editor")).to.eventually.be.fulfilled.eq(true);
        });

        it("Fails to set not defined role", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);

            await expect(roles.enableRole(sampleAccount.uid, "nonexistent-role")).to.eventually.be.rejectedWith(
                "Role 'nonexistent-role' is not defined",
            );
        });
    });

    describe("disableRole", () => {
        it("Disables role of account", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);

            await roles.enableRole(sampleAccount.uid, "editor");
            await expect(roles.hasRole(sampleAccount.uid, "editor")).to.eventually.be.fulfilled.eq(true);

            await roles.disableRole(sampleAccount.uid, "editor");
            await expect(roles.hasRole(sampleAccount.uid, "editor")).to.eventually.be.fulfilled.eq(false);
        });

        it("Fails to disable not defined role", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);

            await expect(roles.disableRole(sampleAccount.uid, "nonexistent-role")).to.eventually.be.rejectedWith(
                "Role 'nonexistent-role' is not defined",
            );
        });
    });

    describe("hasRole", () => {
        it("Returns true if account has the role", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.enableRole(sampleAccount.uid, "editor");
            await expect(roles.hasRole(sampleAccount.uid, "editor")).to.eventually.be.fulfilled.eq(true);
        });

        it("Returns true if account doesnt have the role", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.enableRole(sampleAccount.uid, "manager");
            await expect(roles.hasRole(sampleAccount.uid, "editor")).to.eventually.be.fulfilled.eq(false);
        });
    });

    describe("getUidsInRole", () => {
        it("Returns all uids that has a role", async () => {
            const uids = [uuid(), uuid(), uuid()];
            const role = "editor";
            const { roles } = mock(config);

            for (const uid of uids) {
                await roles.enableRole(uid, role);
            }
            await roles.enableRole("other-uid", "admin");

            const gotUids = await roles.getUidsInRole(role);
            expect(gotUids)
                .to.be.an("array")
                .with.length(uids.length);
            expect(gotUids)
                .to.be.an("array")
                .that.has.members(uids);
        });
    });

    describe("requestRole", () => {
        it("Requests a role", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);
            const reqRole = "manager";
            await roles.requestRole(sampleAccount.uid, reqRole);

            expect(await roles.isRoleRequestedByUser(sampleAccount.uid, reqRole)).to.be.equal(true);
        });

        it("Fails to request not defined role", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);
            const reqRole = "nonexistent-role";
            await expect(roles.requestRole(sampleAccount.uid, reqRole)).to.eventually.be.rejectedWith(
                "Role 'nonexistent-role' is not defined",
            );
        });
    });

    describe("removeRoleRequest", () => {
        it("Removes previously requested role from requests", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);
            const reqRole = "manager";

            await roles.requestRole(sampleAccount.uid, reqRole);
            expect(await roles.isRoleRequestedByUser(sampleAccount.uid, reqRole)).to.be.equal(true);

            await roles.removeRoleRequest(sampleAccount.uid, reqRole);
            expect(await roles.isRoleRequestedByUser(sampleAccount.uid, reqRole)).to.be.equal(false);
        });
    });

    describe("getUidsRequestingRole", () => {
        it("Returns all uids that has a role", async () => {
            const uids = [uuid(), uuid(), uuid()];
            const role = "editor";
            const { roles } = mock(config);

            for (const uid of uids) {
                await roles.requestRole(uid, role);
            }
            await roles.requestRole("other-uid", "admin");

            const gotUids = await roles.getUidsRequestingRole(role);
            expect(gotUids)
                .to.be.an("array")
                .with.length(uids.length);
            expect(gotUids)
                .to.be.an("array")
                .that.has.members(uids);
        });
    });
});
