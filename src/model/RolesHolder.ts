import ow from "ow";

import { Configuration } from "../Configuration";

export interface RolesHolder {
    roles: string[];
}

export namespace RolesHolder {
    export function validate(rrh: RolesHolder, config: Configuration) {
        ow(
            rrh.roles,
            "RolesHolder.requestedRoles",
            ow.array.ofType(ow.string.nonEmpty.is(v => Configuration.isAllowedRole(config, v))),
        );
    }

    export const KEYS: { [x in keyof RolesHolder]: keyof RolesHolder } = Object.freeze({
        roles: "roles",
    });
}
