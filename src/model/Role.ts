import ow from "ow";

export interface Role {
    manages: string[];
}

export namespace Role {
    export function validate(role: Role, roleNames: string[], pref: string /* istanbul ignore next */ = "") {
        ow(role.manages, `${pref}Role.manages`, ow.array.ofType(ow.string.nonEmpty.oneOf(roleNames)));
    }
}
