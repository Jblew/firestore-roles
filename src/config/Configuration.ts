// tslint:disable no-shadowed-variable
import * as _ from "lodash";
import ow from "ow";

import { FirestoreRolesRoleNotDefinedError } from "../error/FirestoreRolesRoleNotDefinedError";
import { Role } from "../model/Role";
import { ow_catch } from "../util";

export interface Configuration extends Configuration.Optional {
    accountsCollection: string;
    roleCollectionPrefix: string;
    roleRequestsCollectionPrefix: string;
    roles: { [k: string]: Role };
}

export namespace Configuration {
    export interface Optional {
        accountsCollection?: string;
        roleCollectionPrefix?: string;
        roles?: { [k: string]: Role };
    }

    export function validate(c: Configuration, pref: string = "") {
        ow(c.accountsCollection, `${pref}Configuration.accountsCollection`, ow.string.nonEmpty);
        ow(c.roleCollectionPrefix, `${pref}Configuration.roleCollectionPrefix`, ow.string.nonEmpty);
        ow(c.roleRequestsCollectionPrefix, `${pref}Configuration.roleRequestsCollectionPrefix`, ow.string.nonEmpty);

        const roleNames = _.keys(c.roles);
        ow(
            c.roles,
            `${pref} Configuration.roles`,
            ow.object.valuesOfType(ow.object.is(o => ow_catch(() => Role.validate(o as Role, roleNames)))),
        );
    }

    export function isAllowedRole(config: Configuration, role: string): boolean {
        return typeof config.roles[role] !== "undefined";
    }

    export function assertAllowedRole(config: Configuration, role: string) {
        if (!isAllowedRole(config, role)) throw new FirestoreRolesRoleNotDefinedError(`Role '${role}' is not defined`);
    }

    export const DEFAULT: Configuration = {
        accountsCollection: "accounts",
        roleCollectionPrefix: "role_",
        roleRequestsCollectionPrefix: "role_requests_",
        roles: {
            admin: { manages: ["manager", "editor"] },
            manager: { manages: ["editor"] },
            editor: { manages: [] },
        },
    };
}
