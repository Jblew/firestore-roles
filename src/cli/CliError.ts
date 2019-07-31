import ChainedError from "typescript-chained-error";

export class CliError extends ChainedError {
    public cliError = true;

    public constructor(message: string, cause?: Error) {
        super(message, cause);
    }
}
