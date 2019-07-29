import ow from "ow";

import { Configuration } from "../Configuration";

export interface RequestedRolesHolder {
    requestedRoles: string[];
}

export namespace RequestedRolesHolder {
    export function validate(rrh: RequestedRolesHolder, config: Configuration) {
        ow(
            rrh.requestedRoles,
            "RequestedRolesHolder.requestedRoles",
            ow.array.ofType(ow.string.nonEmpty.is(v => Configuration.isAllowedRole(config, v))),
        );
    }

    export const KEYS: { [x in keyof RequestedRolesHolder]: keyof RequestedRolesHolder } = Object.freeze({
        requestedRoles: "requestedRoles",
    });
}
