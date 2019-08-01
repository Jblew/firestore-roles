import * as _ from "lodash";
import ow from "ow";

import { Configuration } from "./config/Configuration";
import { FirestoreRolesAccountDoesntExistError } from "./error/FirestoreRolesAccountDoesntExistError";
import { AccountRecord } from "./model/AccountRecord";
import { FirestoreRecordKeeper } from "./model/FirestoreRecordKeeper";
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

    /**
     *
     * Account management
     */
    public async registerUser(user: FirebaseAccount) {
        const accountRecord: AccountRecord = {
            ...user,
        };

        await this.saveAccountRecord(accountRecord);
    }

    public async getAccountRecord(uid: string): Promise<AccountRecord> {
        const arSnapshot = await this.getUserDoc(uid).get();
        if (!arSnapshot.exists) throw new FirestoreRolesAccountDoesntExistError("Account doesnt exist");
        const ar = arSnapshot.data() as AccountRecord;
        AccountRecord.validate(ar, this.config);
        return ar;
    }

    public async userExists(uid: string): Promise<boolean> {
        const docSnapshot = await this.getUserDoc(uid).get();
        return docSnapshot.exists;
    }

    /**
     *
     * Role management
     */
    public async enableRole(uid: string, role: string) {
        this.validateInput("enableRole", { uid, role });

        await this.getRoleDoc(uid, role).set(FirestoreRecordKeeper);
    }

    public async disableRole(uid: string, role: string) {
        this.validateInput("disableRole", { uid, role });

        await this.getRoleDoc(uid, role).delete();
    }

    public async hasRole(uid: string, role: string): Promise<boolean> {
        this.validateInput("hasRole", { uid, role });
        return (await this.getRoleDoc(uid, role).get()).exists;
    }

    public async getUidsInRole(role: string): Promise<string[]> {
        this.validateInput("getUidsInRole", { role });

        return (await this.getRolesCollection(role).get()).docs.map(doc => doc.id);
    }

    /**
     *
     * Role request management
     */
    public async requestRole(uid: string, role: string) {
        this.validateInput("requestRole", { uid, role });

        await this.getRoleRequestDoc(uid, role).set(FirestoreRecordKeeper);
    }

    public async removeRoleRequest(uid: string, role: string) {
        this.validateInput("removeRoleRequest", { uid, role });

        await this.getRoleRequestDoc(uid, role).delete();
    }

    public async isRoleRequestedByUser(uid: string, role: string): Promise<boolean> {
        this.validateInput("isRoleRequestedByUser", { uid, role });

        return (await this.getRoleRequestDoc(uid, role).get()).exists;
    }

    public async getUidsRequestingRole(role: string): Promise<string[]> {
        this.validateInput("getUidsRequestingRole", { role });

        return (await this.getRoleRequestsCollection(role).get()).docs.map(doc => doc.id);
    }

    /**
     *
     * Private methods
     */
    private validateInput(fnName: string, vars: { uid?: string; role?: string }) {
        if (vars.uid) {
            ow(vars.uid, `FirestoreRoles.${fnName}(.uid`, ow.string.nonEmpty);
        }
        /* istanbul ignore else "Now, all methods have the role param" */
        if (vars.role) {
            ow(vars.role, `FirestoreRoles.${fnName}(.role`, ow.string.nonEmpty);
            Configuration.assertAllowedRole(this.config, vars.role); // throws
        }
    }

    private async saveAccountRecord(accountRecord: AccountRecord) {
        AccountRecord.validate(accountRecord, this.config);
        await this.getUserDoc(accountRecord.uid).set(accountRecord);
    }

    private getUserDoc(uid: string): FirestoreEquivalent.DocumentReferenceEquivalent {
        return this.firestore.collection(this.config.accountsCollection).doc(uid);
    }

    private getRolesCollection(role: string) {
        Configuration.assertAllowedRole(this.config, role); // throws
        const col = this.config.roleCollectionPrefix + role;
        return this.firestore.collection(col);
    }

    private getRoleDoc(uid: string, role: string) {
        return this.getRolesCollection(role).doc(uid);
    }

    private getRoleRequestsCollection(role: string) {
        Configuration.assertAllowedRole(this.config, role); // throws
        const col = this.config.roleRequestsCollectionPrefix + role;
        return this.firestore.collection(col);
    }

    private getRoleRequestDoc(uid: string, role: string) {
        return this.getRoleRequestsCollection(role).doc(uid);
    }
}
