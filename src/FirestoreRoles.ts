import { UserInfo as FirebaseUser } from "firebase/app";
import * as _ from "lodash";
import ow from "ow";

import { FirestoreRolesConfiguration } from "./FirestoreRolesConfiguration";
import { FirestoreRolesError } from "./FirestoreRolesError";
import { AccountRecord } from "./model/AccountRecord";
import { RequestedRolesHolder } from "./model/RequestedRolesHolder";
import { RolesHolder } from "./model/RolesHolder";
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

        await this.saveAccountRecord(accountRecord);
    }

    public async requestRoles(uid: string, roles: string[]) {
        ow(uid, "FirestoreRoles.requestRoles(uid)", ow.string.nonEmpty);
        ow(
            roles,
            "FirestoreRoles.requestRoles(roles)",
            ow.array.ofType(ow.string.nonEmpty.is(v => FirestoreRolesConfiguration.isAllowedRole(this.config, v))),
        );

        await this.firestore.runTransaction(async () => await this.doRequestRoles(uid, roles));
    }
    private async doRequestRoles(uid: string, newRolesToRequest: string[]) {
        const accountRecord = await this.getAccountRecord(uid);
        const updatedRequestedRoles = _.uniq([...accountRecord.requestedRoles, ...newRolesToRequest]);
        await this.saveRequestedRoles(uid, updatedRequestedRoles);
    }
        AccountRecord.validate(accountRecord, this.config);

        await this.getUserDoc(user.uid).set(accountRecord);
    private async saveRequestedRoles(uid: string, requestedRoles: string[]) {
        const fieldsToUpdate: RequestedRolesHolder = {
            requestedRoles,
        };
        RequestedRolesHolder.validate(fieldsToUpdate, this.config);
        await this.getUserDoc(uid).set(fieldsToUpdate);
    }
    }

    private getUserDoc(uid: string): FirestoreEquivalent.DocumentReferenceEquivalent {
        return this.firestore.collection(this.config.accountsCollection).doc(uid);
    }
}
