// tslint:disable no-shadowed-variable
import * as _ from "lodash";
import ow from "ow";

import { ow_catch } from "./util";

export interface Configuration extends Configuration.Optional {
    accountsCollection: string;
    roles: { [k: string]: Configuration.Role };
}

export namespace Configuration {
    export interface Optional {
        accountsCollection?: string;
        roles?: { [k: string]: Configuration.Role };
    }

    export function validate(c: Configuration) {
        ow(c.accountsCollection, "Configuration.accountsCollection", ow.string.nonEmpty);

        const roleNames = _.keys(c.roles);
        ow(
            c.roles,
            "Configuration.roles",
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
        export function validate(role: Role, roleNames: string[]) {
            ow(role.manages, "Role.manages", ow.array.ofType(ow.string.nonEmpty.oneOf(roleNames)));
        }
    }
}
