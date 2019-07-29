import { UserInfo as FirebaseUser } from "firebase/app";
import * as _ from "lodash";
import ow from "ow";

import { Configuration } from "./Configuration";
import { FirestoreRolesError } from "./FirestoreRolesError";
import { AccountRecord } from "./model/AccountRecord";
import { RequestedRolesHolder } from "./model/RequestedRolesHolder";
import { RolesHolder } from "./model/RolesHolder";
import { FirestoreEquivalent } from "./types/FirestoreEquivalent";

export class FirestoreRoles {
    private config: Configuration;
    private firestore: FirestoreEquivalent;

    public constructor(config: Configuration, firestore: FirestoreEquivalent) {
        Configuration.validate(config);
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
            ow.array.ofType(ow.string.nonEmpty.is(v => Configuration.isAllowedRole(this.config, v))),
        );

        await this.firestore.runTransaction(async () => await this.doRequestRoles(uid, roles));
    }

    public async setRoles(uid: string, roles: string[]) {
        ow(uid, "FirestoreRoles.setRoles(uid)", ow.string.nonEmpty);
        ow(
            roles,
            "FirestoreRoles.setRoles(roles)",
            ow.array.ofType(ow.string.nonEmpty.is(v => Configuration.isAllowedRole(this.config, v))),
        );

        await this.saveRoles(uid, roles);
    }

    public async removeFromRequestedRoles(uid: string, rolesToRemove: string[]) {
        ow(uid, "FirestoreRoles.removeFromRequestedRoles(uid)", ow.string.nonEmpty);
        ow(
            rolesToRemove,
            "FirestoreRoles.removeFromRequestedRoles(rolesToRemove)",
            ow.array.ofType(ow.string.nonEmpty.is(v => Configuration.isAllowedRole(this.config, v))),
        );

        await this.firestore.runTransaction(async () => await this.doRemoveFromRequestedRoles(uid, rolesToRemove));
    }

    private async doRequestRoles(uid: string, newRolesToRequest: string[]) {
        const accountRecord = await this.getAccountRecord(uid);
        const updatedRequestedRoles = _.uniq([...accountRecord.requestedRoles, ...newRolesToRequest]);
        await this.saveRequestedRoles(uid, updatedRequestedRoles);
    }

    private async doRemoveFromRequestedRoles(uid: string, rolesToRemove: string[]) {
        const accountRecord = await this.getAccountRecord(uid);
        const updatedRequestedRoles = _.without(accountRecord.requestedRoles, ...rolesToRemove);
        await this.saveRequestedRoles(uid, updatedRequestedRoles);
    }

    private async getAccountRecord(uid: string): Promise<AccountRecord> {
        const arSnapshot = await this.getUserDoc(uid).get();
        if (!arSnapshot.exists) throw new FirestoreRolesError("User does not exist");
        const ar = arSnapshot.data() as AccountRecord;
        AccountRecord.validate(ar, this.config);
        return ar;
    }

    private async saveAccountRecord(accountRecord: AccountRecord) {
        AccountRecord.validate(accountRecord, this.config);
        await this.getUserDoc(accountRecord.uid).set(accountRecord);
    }

    private async saveRequestedRoles(uid: string, requestedRoles: string[]) {
        const fieldsToUpdate: RequestedRolesHolder = {
            requestedRoles,
        };
        RequestedRolesHolder.validate(fieldsToUpdate, this.config);
        await this.getUserDoc(uid).set(fieldsToUpdate);
    }

    private async saveRoles(uid: string, roles: string[]) {
        const fieldsToUpdate: RolesHolder = {
            roles,
        };
        RolesHolder.validate(fieldsToUpdate, this.config);
        await this.getUserDoc(uid).set(fieldsToUpdate);
    }

    private getUserDoc(uid: string): FirestoreEquivalent.DocumentReferenceEquivalent {
        return this.firestore.collection(this.config.accountsCollection).doc(uid);
    }
}
