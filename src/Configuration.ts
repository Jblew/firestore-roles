// tslint:disable no-shadowed-variable
import * as _ from "lodash";
import ow from "ow";

import { ow_catch } from "./util";

export interface Configuration extends Configuration.Optional {
    accountsCollection: string;
    roleCollectionPrefix: string;
    roles: { [k: string]: Configuration.Role };
}

export namespace Configuration {
    export interface Optional {
        accountsCollection?: string;
        roleCollectionPrefix?: string;
        roles?: { [k: string]: Configuration.Role };
    }

    export function validate(c: Configuration, pref: string = "") {
        ow(c.accountsCollection, `${pref}Configuration.accountsCollection`, ow.string.nonEmpty);
        ow(c.roleCollectionPrefix, `${pref}Configuration.roleCollectionPrefix`, ow.string.nonEmpty);

        const roleNames = _.keys(c.roles);
        ow(
            c.roles,
            `${pref} Configuration.roles`,
            ow.object.valuesOfType(
                ow.object.is(o => ow_catch(() => Configuration.Role.validate(o as Role, roleNames))),
            ),
        );
    }

    export function isAllowedRole(config: Configuration, role: string): boolean {
        return typeof config.roles[role] !== "undefined";
    }

    export const DEFAULT: Configuration = {
        accountsCollection: "accounts",
        roleCollectionPrefix: "role_",
        roles: {
            admin: { manages: ["manager", "editor"] },
            manager: { manages: ["editor"] },
            editor: { manages: [] },
        },
    };

    export interface Role {
        manages: string[];
    }

    export namespace Role {
        export function validate(role: Role, roleNames: string[], pref: string = "") {
            ow(role.manages, `${pref}Role.manages`, ow.array.ofType(ow.string.nonEmpty.oneOf(roleNames)));
        }
    }
}
