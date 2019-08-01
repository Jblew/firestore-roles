// tslint:disable  no-console
import * as firebase from "@firebase/testing";
import * as _ from "lodash";
import "mocha";
import * as uuid from "uuid/v4";

import { Configuration } from "./config/Configuration";
import { FirestoreRoles } from "./FirestoreRoles";
import { AccountRecord } from "./model/AccountRecord";
import { FirestoreRecordKeeper } from "./model/FirestoreRecordKeeper";
import { RulesGenerator } from "./RulesGenerator";

export async function mock(props: {
    uid: string | undefined;
    config: Configuration;
    customRules?: string;
    auth?: { email: string; name: string };
    projectId?: string;
}) {
    const projectId = props.projectId || `unit-testing-${uuid()}`;
    const auth = props.uid ? { ...(props.auth || {}), uid: props.uid } : undefined;
    const app = firebase.initializeTestApp({
        projectId,
        auth,
    });
    const userFirestore = app.firestore();

    const adminApp = firebase.initializeAdminApp({ projectId });
    const adminFirestore = adminApp.firestore();

    const rules = new RulesGenerator(props.config, props.customRules || "").asString();
    await firebase.loadFirestoreRules({ projectId, rules });

    const userRoles = new FirestoreRoles(props.config, userFirestore);
    const adminRoles = new FirestoreRoles(props.config, adminFirestore);

    function userDoc(col: string, doc: string | undefined) {
        return userFirestore.collection(col).doc(d(doc));
    }
    function adminDoc(col: string, doc: string | undefined) {
        return adminFirestore.collection(col).doc(d(doc));
    }

    async function createAccount(
        uidOrUndefined: string | undefined,
        providedAccountRecord?: AccountRecord,
    ): Promise<AccountRecord> {
        const uid = d(uidOrUndefined);
        const ar = providedAccountRecord || getSampleAccountRecord(uid);
        await adminDoc(props.config.accountsCollection, uid).set(ar);
        return ar;
    }

    async function adminEnableRole(uidOrUndefined: string | undefined, role: string) {
        const uid = d(uidOrUndefined);

        await adminDoc(props.config.roleCollectionPrefix + role, uid).set(FirestoreRecordKeeper);
    }

    return {
        app,
        adminApp,
        userFirestore,
        adminFirestore,
        rules,
        userRoles,
        adminRoles,
        userDoc,
        adminDoc,
        createAccount,
        adminEnableRole,
        ...props,
    };
}

export function getSampleAccountRecord(uid: string): AccountRecord & { displayName: string; email: string } {
    return {
        uid,
        displayName: `sample-account-${uid}`,
        email: `${uid}@sample.sample`,
        providerId: "google",
        photoURL: null,
        phoneNumber: null,
        requestedRoles: [],
    };
}

export async function cleanupEach() {
    try {
        await Promise.all(firebase.apps().map(app => app.delete()));
    } catch (error) {
        console.warn("Warning: Error in firebase shutdown " + error);
    }
}

export function d<T>(v: T | undefined): T {
    if (typeof v === "undefined") throw new Error("Undefined parameter of d() method");
    return v;
}
