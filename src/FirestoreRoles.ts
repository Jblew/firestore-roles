import * as _ from "lodash";
import ow from "ow";

import { Configuration } from "./Configuration";
import { FirestoreRolesAccountDoesntExistError } from "./error/FirestoreRolesAccountDoesntExistError";
import { AccountRecord } from "./model/AccountRecord";
import { FirestoreRecordKeeper } from "./model/FirestoreRecordKeeper";
import { RequestedRolesHolder } from "./model/RequestedRolesHolder";
import { FirebaseAccount } from "./types/FirebaseAccount";
import { FirestoreEquivalent } from "./types/FirestoreEquivalent";

export class FirestoreRoles {
    private config: Configuration;
    private firestore: FirestoreEquivalent;

    public constructor(config: Configuration, firestore: FirestoreEquivalent) {
        Configuration.validate(config);
        this.config = config;

        this.firestore = firestore;
    }

    public async hasRole(uid: string, role: string): Promise<boolean> {
        return (await this.getRoleDoc(uid, role).get()).exists;
    }

    public async registerUser(user: FirebaseAccount) {
        const accountRecord: AccountRecord = {
            ...user,
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

    public async getRequestedRoles(uid: string): Promise<string[]> {
        const aRec = await this.getAccountRecord(uid);
        return aRec.requestedRoles;
    }

    public async enableRole(uid: string, role: string) {
        ow(uid, "FirestoreRoles.enableRole(uid)", ow.string.nonEmpty);
        ow(
            role,
            "FirestoreRoles.enableRole(role)",
            ow.string.nonEmpty.is(v => Configuration.isAllowedRole(this.config, v)),
        );

        await this.getRoleDoc(uid, role).set(FirestoreRecordKeeper);
    }

    public async disableRole(uid: string, role: string) {
        ow(uid, "FirestoreRoles.disableRole(uid)", ow.string.nonEmpty);
        ow(
            role,
            "FirestoreRoles.disableRole(role)",
            ow.string.nonEmpty.is(v => Configuration.isAllowedRole(this.config, v)),
        );

        await this.getRoleDoc(uid, role).delete();
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
        if (!arSnapshot.exists) throw new FirestoreRolesAccountDoesntExistError("Account doesnt exist");
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
        await this.getUserDoc(uid).update(fieldsToUpdate);
    }

    private getUserDoc(uid: string): FirestoreEquivalent.DocumentReferenceEquivalent {
        return this.firestore.collection(this.config.accountsCollection).doc(uid);
    }

    private getRoleDoc(uid: string, role: string) {
        ow(role, ow.string.is(v => Configuration.isAllowedRole(this.config, role) || `Role ${role} is not defined`));
        const col = this.config.roleCollectionPrefix + role;
        return this.firestore.collection(col).doc(uid);
    }
}
