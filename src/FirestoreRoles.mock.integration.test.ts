// tslint:disable  no-console
import * as firebase from "@firebase/testing";
import * as _ from "lodash";
import "mocha";

import { Configuration } from "./Configuration";
import { FirestoreRoles } from "./FirestoreRoles";

export function mock(config: Configuration = Configuration.DEFAULT) {
    const app = firebase.initializeTestApp({ projectId: "unit-testing-" + Date.now(), databaseName: "db" });
    const firestore = app.firestore();

    const roles = new FirestoreRoles(config, firestore);

    return {
        app,
        firestore,
        roles,
    };
}

export async function startupAll() {
    this.timeout(4000);
    const { firestore } = mock("firestore", {});
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
