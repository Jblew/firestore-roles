import ow from "ow";

import { FirestoreRolesConfiguration } from "../FirestoreRolesConfiguration";

export interface RequestedRolesHolder {
    requestedRoles: string[];
}

export namespace RequestedRolesHolder {
    export function validate(rrh: RequestedRolesHolder, config: FirestoreRolesConfiguration) {
        ow(
            rrh.requestedRoles,
            "RequestedRolesHolder.requestedRoles",
            ow.array.ofType(ow.string.nonEmpty.is(v => FirestoreRolesConfiguration.isAllowedRole(config, v))),
        );
    }

    export const KEYS: { [x in keyof RequestedRolesHolder]: keyof RequestedRolesHolder } = Object.freeze({
        requestedRoles: "requestedRoles",
    });
}
