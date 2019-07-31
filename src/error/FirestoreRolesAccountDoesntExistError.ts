import { FirestoreRolesError } from "./FirestoreRolesError";

export class FirestoreRolesAccountDoesntExistError extends FirestoreRolesError {
    public firestoreRolesAccountDoesntExistError = true;

    public constructor(msg: string, cause?: Error) {
        super(msg, cause) /* istanbul ignore next "Semicolon bug" */;
    }
}
