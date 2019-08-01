import ow from "ow";

import { Configuration } from "../config/Configuration";
import { FirebaseAccount } from "../types/FirebaseAccount";

export interface AccountRecord extends FirebaseAccount {
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
    uid: string;
}

export namespace AccountRecord {
    export function validate(ar: AccountRecord, config: Configuration) {
        ow(ar.uid, "AccountRecord.uid", ow.string.nonEmpty);
        ow(ar.displayName, "AccountRecord.displayName", ow.any(ow.null, ow.string.nonEmpty));
        ow(ar.email, "AccountRecord.email", ow.any(ow.null, ow.string.nonEmpty));
        ow(ar.phoneNumber, "AccountRecord.phoneNumber", ow.any(ow.null, ow.string.nonEmpty));
        ow(ar.photoURL, "AccountRecord.photoURL", ow.any(ow.null, ow.string.nonEmpty));
    }

    export const KEYS: { [x in keyof AccountRecord]: keyof AccountRecord } = Object.freeze({
        displayName: "displayName",
        email: "email",
        phoneNumber: "phoneNumber",
        photoURL: "photoURL",
        providerId: "providerId",
        uid: "uid",
    });
}
