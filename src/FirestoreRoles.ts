import { UserInfo as FirebaseUser } from "firebase/app";

import { AccountRecord } from "./AccountRecord";
import { FirestoreRolesConfiguration } from "./FirestoreRolesConfiguration";
import { FirestoreEquivalent } from "./types/FirestoreEquivalent";

export class FirestoreRoles {
    private config: FirestoreRolesConfiguration;
    private firestore: FirestoreEquivalent;

    public constructor(config: FirestoreRolesConfiguration, firestore: FirestoreEquivalent) {
        FirestoreRolesConfiguration.validate(config);
        this.config = config;

        this.firestore = firestore;
    }

    public async registerUser(user: FirebaseUser) {
        const accountRecord: AccountRecord = {
            ...user,
            roles: [],
            requestedRoles: [],
        };
        AccountRecord.validate(accountRecord, this.config);

        await this.getUserDoc(user.uid).set(accountRecord);
    }

    private getUserDoc(uid: string): FirestoreEquivalent.DocumentReferenceEquivalent {
        return this.firestore.collection(this.config.accountsCollection).doc(uid);
    }
}
