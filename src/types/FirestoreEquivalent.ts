export interface FirestoreEquivalent {
    runTransaction(tCallback: (transaction: any) => Promise<void>): Promise<void>;

    collection(name: string): FirestoreEquivalent.CollectionReferenceEquivalent;
}

export namespace FirestoreEquivalent {
    export interface CollectionReferenceEquivalent {
        doc(name: string): DocumentReferenceEquivalent;
    }

    export interface DocumentReferenceEquivalent {
        get(): Promise<{
            exists: boolean;
            data(): object | undefined;
        }>;
        set(record: object): Promise<any>;
        update(record: object): Promise<any>;
    }
}
