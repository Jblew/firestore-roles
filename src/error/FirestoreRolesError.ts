import ChainedError from "typescript-chained-error";

export class FirestoreRolesError extends ChainedError {
    public firestoreRolesError = true;

    public constructor(msg: string, cause?: Error) {
        super(msg, cause);
    }
}
