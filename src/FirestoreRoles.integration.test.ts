// tslint:disable max-classes-per-file no-console
import { use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";

import { Configuration } from "./Configuration";
import { cleanupEach, startupAll } from "./FirestoreRoles.mock.integration.test";

chaiUse(chaiAsPromised);

before("startup", startupAll);
afterEach(cleanupEach);

describe("FirestoreRoles", () => {
    describe("registerUser", () => {
        it.skip("Adds user to database");
        it.skip("Adds user with roles defined as empty array");
        it.skip("Adds user with requested roles defined as empty array");
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
