export interface FirestoreEquivalent {
    runTransaction(tCallback: (transaction: any) => Promise<void>): Promise<void>;

    collection(name: string): FirestoreEquivalent.CollectionReferenceEquivalent;
}

export namespace FirestoreEquivalent {
    export interface CollectionReferenceEquivalent {
        doc(name: string): DocumentReferenceEquivalent;
        get(): Promise<QuerySnapshot>;
    }

    export interface QuerySnapshot {
        docs: QueryDocumentSnapshot[];
    }

    export interface QueryDocumentSnapshot {
        id: string;
        exists: boolean;
        data(): object | undefined;
    }

    export interface DocumentReferenceEquivalent {
        get(): Promise<QueryDocumentSnapshot>;
        set(record: object): Promise<any>;
        update(record: object): Promise<any>;
        delete(): Promise<any>;
    }
}
