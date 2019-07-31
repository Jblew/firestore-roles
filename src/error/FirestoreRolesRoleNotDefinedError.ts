import { FirestoreRolesError } from "./FirestoreRolesError";

export class FirestoreRolesRoleNotDefinedError extends FirestoreRolesError {
    public firestoreRolesRoleNotDefinedError = true;

    public constructor(msg: string, cause?: Error) {
        super(msg, cause) /* istanbul ignore next "Semicolon bug" */;
    }
}
