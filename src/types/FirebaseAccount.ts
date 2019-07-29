import { UserInfo } from "firebase/app";

export interface FirebaseAccount {
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
    providerId: string;
    uid: string;
}

// Prevent deleting type test variables
// tslint:disable
const compatibilityTest_fromLocal: FirebaseAccount = {} as FirebaseAccount;
const compatibilityTest_toFirebase: UserInfo = compatibilityTest_fromLocal;

const compatibilityTest_fromFirebase: UserInfo = {} as UserInfo;
const compatibilityTest_toLocal: FirebaseAccount = compatibilityTest_fromFirebase;
