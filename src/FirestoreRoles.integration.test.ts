// tslint:disable max-classes-per-file no-console
import { assert, expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";

import { Configuration } from "./Configuration";
import { FirestoreRoles } from "./FirestoreRoles";
import { cleanupEach, getAccountRecord, mock, startupAll } from "./FirestoreRoles.mock.integration.test";
import { FirebaseAccount } from "./types/FirebaseAccount";

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

describe("FirestoreRoles", function() {
    this.timeout(3000);

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
            expect(obtainedAR.requestedRoles)
                .to.be.an("array")
                .with.length(0);
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

            await expect(await roles.enableRole(sampleAccount.uid, "nonexistent-role")).to.eventually.be.rejectedWith(
                "Expected string `e` `nonexistent-role`",
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

            await expect(await roles.disableRole(sampleAccount.uid, "nonexistent-role")).to.eventually.be.rejectedWith(
                "Expected string `e` `nonexistent-role`",
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

    describe("getRequestedRoles", () => {
        it("Fails if account doesnt exist", async () => {
            it("Fails if account doesnt exist", async () => {
                const { roles } = mock(config);

                await expect(roles.getRequestedRoles("nonexistent-uid"))
                    .to.eventually.be.rejectedWith("Account doesnt exist")
                    .that.haveOwnProperty("firestoreRolesAccountDoesntExistError");
            });
        });

        it("Returns empty array if account never had requested roles set up", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);

            const gotRoles = await roles.getRequestedRoles(sampleAccount.uid);
            expect(gotRoles)
                .to.be.an("array")
                .with.length(0);
        });

        it("Returns previously set requested roles", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);
            const reqRoles: string[] = ["manager", "admin"];
            await roles.requestRoles(sampleAccount.uid, reqRoles);
            const gotRoles = await roles.getRequestedRoles(sampleAccount.uid);
            expect(gotRoles)
                .to.be.an("array")
                .that.has.members(reqRoles);
        });
    });

    describe("requestRoles", () => {
        it("Adds specified roles to requestedRoles", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);
            const reqRoles: string[] = ["manager", "admin"];
            await roles.requestRoles(sampleAccount.uid, reqRoles);

            const gotRoles = await roles.getRequestedRoles(sampleAccount.uid);
            expect(gotRoles)
                .to.be.an("array")
                .that.has.members(reqRoles);
        });

        it("Fails to request not defined role", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);
            const reqRoles = ["nonexistent-role"];
            await expect(roles.requestRoles(sampleAccount.uid, reqRoles)).to.eventually.be.rejectedWith(
                "Expected string `e` `nonexistent-role`",
            );
        });

        it("Does not remove previous roles when adding new ones", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);
            const reqRoles: string[] = ["manager"];
            await roles.requestRoles(sampleAccount.uid, reqRoles);

            const reqRoles2: string[] = ["admin"];
            await roles.requestRoles(sampleAccount.uid, reqRoles2);

            const gotRoles = await roles.getRequestedRoles(sampleAccount.uid);
            expect(gotRoles)
                .to.be.an("array")
                .that.has.members([...reqRoles, ...reqRoles2]);
        });
    });

    describe("removeFromRequestedRoles", () => {
        it("Removes only specified roles from requested roles", async () => {
            const { roles, sampleAccount } = mock(config);
            await roles.registerUser(sampleAccount);
            const reqRoles: string[] = ["manager", "admin", "editor"];
            await roles.requestRoles(sampleAccount.uid, reqRoles);
            await roles.removeFromRequestedRoles(sampleAccount.uid, ["manager", "admin"]);

            const gotRoles = await roles.getRequestedRoles(sampleAccount.uid);
            expect(gotRoles)
                .to.be.an("array")
                .that.has.members(["editor"]);
        });
    });
});
