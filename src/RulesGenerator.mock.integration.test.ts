// tslint:disable  no-console
import * as firebase from "@firebase/testing";
import * as _ from "lodash";
import "mocha";
import * as uuid from "uuid/v4";

import { Configuration } from "./Configuration";
import { FirestoreRoles } from "./FirestoreRoles";
import { RulesGenerator } from "./RulesGenerator";

export async function mock(props: { uid: string | undefined; config: Configuration; customRules: string }) {
    const projectId = `unit-testing-${uuid()}`;
    const app = firebase.initializeTestApp({
        projectId,
        auth: props.uid ? { uid: props.uid, email: "alice@example.com" } : undefined,
    });
    const userFirestore = app.firestore();

    const adminApp = firebase.initializeAdminApp({ projectId });
    const adminFirestore = adminApp.firestore();

    const rules = RulesGenerator.generateRules(props.config, props.customRules);
    await firebase.loadFirestoreRules({ projectId, rules });

    const userRoles = new FirestoreRoles(props.config, userFirestore);
    const adminRoles = new FirestoreRoles(props.config, adminFirestore);

    function userDoc(col: string, doc: string) {
        return userFirestore.collection(col).doc(doc);
    }
    function adminDoc(col: string, doc: string) {
        return adminFirestore.collection(col).doc(doc);
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
    };
}

export async function cleanupEach() {
    try {
        await Promise.all(firebase.apps().map(app => app.delete()));
    } catch (error) {
        console.warn("Warning: Error in firebase shutdown " + error);
    }
}
