import ow from "ow";

import { Configuration } from "../Configuration";
import { FirebaseAccount } from "../types/FirebaseAccount";

import { RequestedRolesHolder } from "./RequestedRolesHolder";

type ParentType = FirebaseAccount & RequestedRolesHolder;
export interface AccountRecord extends ParentType {
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
    providerId: string;
    uid: string;

    requestedRoles: string[];
}

export namespace AccountRecord {
    export function validate(ar: AccountRecord, config: Configuration) {
        ow(ar.uid, "AccountRecord.uid", ow.string.nonEmpty);
        ow(ar.providerId, "AccountRecord.providerId", ow.string.nonEmpty);
        ow(ar.displayName, "AccountRecord.displayName", ow.any(ow.null, ow.string.nonEmpty));
        ow(ar.email, "AccountRecord.email", ow.any(ow.null, ow.string.nonEmpty));
        ow(ar.phoneNumber, "AccountRecord.phoneNumber", ow.any(ow.null, ow.string.nonEmpty));
        ow(ar.providerId, "AccountRecord.providerId", ow.any(ow.null, ow.string.nonEmpty));
        RequestedRolesHolder.validate(ar, config);
    }

    export const KEYS: { [x in keyof AccountRecord]: keyof AccountRecord } = Object.freeze({
        ...RequestedRolesHolder.KEYS,
        displayName: "displayName",
        email: "email",
        phoneNumber: "phoneNumber",
        photoURL: "photoURL",
        providerId: "providerId",
        uid: "uid",
    });
}
