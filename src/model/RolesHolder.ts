import ow from "ow";

import { FirestoreRolesConfiguration } from "../FirestoreRolesConfiguration";

export interface RolesHolder {
    roles: string[];
}

export namespace RolesHolder {
    export function validate(rrh: RolesHolder, config: FirestoreRolesConfiguration) {
        ow(
            rrh.roles,
            "RolesHolder.requestedRoles",
            ow.array.ofType(ow.string.nonEmpty.is(v => FirestoreRolesConfiguration.isAllowedRole(config, v))),
        );
    }

    export const KEYS: { [x in keyof RolesHolder]: keyof RolesHolder } = Object.freeze({
        roles: "roles",
    });
}
