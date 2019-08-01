// tslint:disable  no-console
import * as firebase from "@firebase/testing";
import * as _ from "lodash";
import "mocha";
import * as uuid from "uuid/v4";

import { Configuration } from "./config/Configuration";
import { FirestoreRoles } from "./FirestoreRoles";
import { AccountRecord } from "./model/AccountRecord";
import { FirebaseAccount } from "./types/FirebaseAccount";

export function mock(config: Configuration.Optional) {
    const app = firebase.initializeTestApp({ projectId: "unit-testing-" + Date.now(), databaseName: "db" });
    const firestore = app.firestore();
    const accountsCollection = `accounts_${uuid()}`;
    const sampleAccount = getSampleFirebaseAccount();
    const sampleAccountDoc = firestore.collection(accountsCollection).doc(sampleAccount.uid);
    const configMerged: Configuration = {
        ...Configuration.DEFAULT,
        accountsCollection,
        ...config,
    };
    const roles = new FirestoreRoles(configMerged, firestore);

    return {
        app,
        firestore,
        roles,
        accountsCollection,
        sampleAccount,
        sampleAccountDoc,
    };
}

export function getSampleFirebaseAccount(): FirebaseAccount {
    const uid = `u_${uuid()}`;
    return {
        uid,
        displayName: `sample-account-${uid}`,
        email: `${uid}@sample.sample`,
        providerId: "google",
        photoURL: null,
        phoneNumber: null,
    };
}

export async function startupAll() {
    const { firestore } = mock({});
    await firestore
        .collection("a")
        .doc("a")
        .get();
}

export async function cleanupEach() {
    try {
        await Promise.all(firebase.apps().map(app => app.delete()));
    } catch (error) {
        console.warn("Warning: Error in firebase shutdown " + error);
    }
}

export async function getAccountRecord(doc: firebase.firestore.DocumentReference): Promise<AccountRecord> {
    return (await doc.get()).data() as AccountRecord;
}
