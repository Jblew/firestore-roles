// tslint:disable no-shadowed-variable

import ow from "ow";

import { ow_catch } from "./util";

export interface FirestoreRolesConfiguration {
    accountsCollection: string;
    roles: { [k: string]: FirestoreRolesConfiguration.Role };
}

export namespace FirestoreRolesConfiguration {
    export function validate(c: FirestoreRolesConfiguration) {
        ow(c.accountsCollection, "FirestoreRolesConfiguration.accountsCollection", ow.string.nonEmpty);

        ow(
            c.roles,
            "FirestoreRolesConfiguration.roles",
            ow.object.valuesOfType(
                ow.object.is(o => ow_catch(() => FirestoreRolesConfiguration.Role.validate(o as Role))),
            ),
        );
    }

    export function isAllowedRole(config: FirestoreRolesConfiguration, role: string) {
        return typeof config.roles[role] !== undefined;
    }

    export interface Role {
        manages: string[];
    }

    export namespace Role {
        export function validate(r: Role) {
            ow(r.manages, "Role.manages", ow.array.ofType(ow.string.nonEmpty));
        }
    }
}
