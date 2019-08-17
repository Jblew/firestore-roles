import ow from "ow";

import { FirebaseAccount } from "../types/FirebaseAccount";

export interface AccountRecord extends FirebaseAccount {
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
    uid: string;
}

export namespace AccountRecord {
    export function validate(ar: AccountRecord, deprecatedConfigParam?: any) {
        ow(ar.uid, "AccountRecord.uid", ow.string.nonEmpty);
        ow(ar.displayName, "AccountRecord.displayName", ow.any(ow.null, ow.string.nonEmpty));
        ow(ar.email, "AccountRecord.email", ow.any(ow.null, ow.string.nonEmpty));
        ow(ar.phoneNumber, "AccountRecord.phoneNumber", ow.any(ow.null, ow.string.nonEmpty));
        ow(ar.photoURL, "AccountRecord.photoURL", ow.any(ow.null, ow.string.nonEmpty));
    }

    export const KEYS: Readonly<{ [x in keyof AccountRecord]: keyof AccountRecord }> = Object.freeze({
        displayName: "displayName",
        email: "email",
        phoneNumber: "phoneNumber",
        photoURL: "photoURL",
        providerId: "providerId",
        uid: "uid",
    });

    export function fromFirebaseUserInfo(
        userInfo: FirebaseUserInfoEquivalent,
        importOptions: { includePhoneNumber: boolean } = { includePhoneNumber: false },
    ): AccountRecord {
        const account: AccountRecord = {
            uid: userInfo.uid,
            displayName: userInfo.displayName,
            email: userInfo.email,
            providerId: userInfo.providerId,
            phoneNumber: importOptions.includePhoneNumber ? userInfo.phoneNumber : null,
            photoURL: userInfo.photoURL,
        };
        AccountRecord.validate(account);
        return account;
    }

    export interface FirebaseUserInfoEquivalent {
        displayName: string | null;
        email: string | null;
        phoneNumber: string | null;
        photoURL: string | null;
        providerId: string;
        uid: string;
    }
}
