/* tslint:disable:max-classes-per-file */
import { expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import "mocha";

import { Configuration } from "./Configuration";

chaiUse(chaiAsPromised);

describe("Configuration", () => {
    it("Default configuration passes validation", () => {
        Configuration.validate(Configuration.DEFAULT);
    });

    it("Disallows managing non-defined role", () => {
        const config: Configuration = {
            ...Configuration.DEFAULT,
            roles: {
                admin: { manages: ["nonexistentrole"] },
                editor: { manages: [] },
            },
        };

        expect(() => Configuration.validate(config)).to.throw("ArgumentError");
    });

    //
    const config: Configuration = {
        accountsCollection: "accounts",
        roleCollectionPrefix: "role_",
        roles: {
            admin: { manages: ["manager", "editor"] },
            manager: { manages: ["editor"] },
            editor: { manages: [] },
        },
    };

    describe("#isAllowedRole", () => {
        it("Returns true for allowed role", () => {
            expect(Configuration.isAllowedRole(config, "admin")).to.be.equal(true);
        });

        it("Returns false for disallowed role", () => {
            expect(Configuration.isAllowedRole(config, "nonexistent-role")).to.be.equal(false);
        });
    });

    describe("#assertAllowedRole", () => {
        it("Throws nothing on allowed role", () => {
            Configuration.assertAllowedRole(config, "admin");
        });

        it("Throws FirestoreRolesAccountDoesntExistError for disallowed role", () => {
            expect(() => Configuration.assertAllowedRole(config, "nonexistent-role"))
                .to.throw("is not defined")
                .that.haveOwnProperty("firestoreRolesRoleNotDefinedError");
        });
    });
});
