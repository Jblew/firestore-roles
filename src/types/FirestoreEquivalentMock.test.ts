// tslint:disable max-classes-per-file

import { FirestoreEquivalent } from "../types/FirestoreEquivalent";

export class FirestoreEquivalentMock implements FirestoreEquivalent {
    public collections: { [x: string]: FirestoreEquivalentMock.CollectionRef } = {};

    public async runTransaction(asyncTransactionFn: (trx: any) => Promise<void>): Promise<void> {
        await asyncTransactionFn(null);
    }

    public collection(name: string): FirestoreEquivalent.CollectionReferenceEquivalent {
        return (this.collections[name] = this.collections[name] || new FirestoreEquivalentMock.CollectionRef());
    }
}

export namespace FirestoreEquivalentMock {
    export class CollectionRef implements FirestoreEquivalent.CollectionReferenceEquivalent {
        public documents: { [x: string]: DocumentRef } = {};

        public doc(name: string): FirestoreEquivalent.DocumentReferenceEquivalent {
            return (this.documents[name] = this.documents[name] || new DocumentRef());
        }
    }

    export class DocumentRef implements FirestoreEquivalentMock.DocumentRef {
        private data: any = undefined;
        private exists: boolean = false;
        public async get(): Promise<DocumentSnapshot> {
            return {
                exists: this.exists,
                data: () => this.data,
            };
        }

        public async set(newData: object): Promise<any> {
            this.data = newData;
            this.exists = true;
        }
    }

    export interface DocumentSnapshot {
        exists: boolean;
        data(): object | undefined;
    }
}
