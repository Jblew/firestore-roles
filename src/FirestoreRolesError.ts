import ChainedError from "typescript-chained-error";

export class FirestoreRolesError extends ChainedError {
    public constructor(msg: string, cause?: Error) {
        super(msg, cause);
    }
}
