import ow from "ow";

import { Configuration } from "../Configuration";
import { FirebaseAccount } from "../types/FirebaseAccount";

import { RequestedRolesHolder } from "./RequestedRolesHolder";
import { RolesHolder } from "./RolesHolder";

type ParentType = FirebaseAccount & RolesHolder & RequestedRolesHolder;
export interface AccountRecord extends ParentType {
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
    providerId: string;
    uid: string;

    roles: string[];
    requestedRoles: string[];
}

export namespace AccountRecord {
    export function validate(ar: AccountRecord, config: Configuration) {
        ow(ar.uid, "AccountRecord.uid", ow.string.nonEmpty);
        ow(ar.providerId, "AccountRecord.providerId", ow.string.nonEmpty);
        ow(ar.displayName, "AccountRecord.displayName", ow.optional.string.nonEmpty);
        ow(ar.email, "AccountRecord.email", ow.optional.string.nonEmpty);
        ow(ar.phoneNumber, "AccountRecord.phoneNumber", ow.optional.string.nonEmpty);
        ow(ar.providerId, "AccountRecord.providerId", ow.optional.string.nonEmpty);
        RolesHolder.validate(ar, config);
        RequestedRolesHolder.validate(ar, config);

        ow(
            ar.requestedRoles,
            "AccountRecord.requestedRoles cannot already be in roles",
            ow.array.ofType(ow.string.nonEmpty.not.oneOf(ar.roles)),
        );
    }

    export const KEYS: { [x in keyof AccountRecord]: keyof AccountRecord } = Object.freeze({
        ...RolesHolder.KEYS,
        ...RequestedRolesHolder.KEYS,
        displayName: "displayName",
        email: "email",
        phoneNumber: "phoneNumber",
        photoURL: "photoURL",
        providerId: "providerId",
        uid: "uid",
    });
}
