// tslint:disable  no-console
import * as firebase from "@firebase/testing";
import * as _ from "lodash";
import "mocha";
import * as uuid from "uuid/v4";

import { Configuration } from "./Configuration";
import { FirestoreRoles } from "./FirestoreRoles";
import { RulesGenerator } from "./RulesGenerator";
import { AccountRecord } from "./model/AccountRecord";

export async function mock(props: { uid: string | undefined; config: Configuration; customRules?: string }) {
    const projectId = `unit-testing-${uuid()}`;
    const app = firebase.initializeTestApp({
        projectId,
        auth: props.uid ? { uid: props.uid, email: "alice@example.com" } : undefined,
    });
    const userFirestore = app.firestore();

    const adminApp = firebase.initializeAdminApp({ projectId });
    const adminFirestore = adminApp.firestore();

    const rules = RulesGenerator.generateRules(props.config, props.customRules || "");
    await firebase.loadFirestoreRules({ projectId, rules });

    const userRoles = new FirestoreRoles(props.config, userFirestore);
    const adminRoles = new FirestoreRoles(props.config, adminFirestore);

    function userDoc(col: string, doc: string) {
        return userFirestore.collection(col).doc(doc);
    }
    function adminDoc(col: string, doc: string) {
        return adminFirestore.collection(col).doc(doc);
    }

    async function createAccount(uid: string): Promise<AccountRecord> {
        const ar = getSampleAccountRecord(uid);
        await adminDoc(props.config.accountsCollection, uid).set(ar);
        return ar;
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
        ...props,
    };
}

export function getSampleAccountRecord(uid: string): AccountRecord {
    return {
        uid,
        displayName: `sample-account-${uid}`,
        email: `${uid}@sample.sample`,
        providerId: "google",
        photoURL: null,
        phoneNumber: null,
        roles: [],
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
