/* tslint:disable no-unused-expression */
import { expect } from "chai";
import * as _ from "lodash";
import "mocha";
import * as uuid from "uuid";

import { AccountRecord } from "./AccountRecord";

describe("AccountRecord", () => {
    describe("#validate", () => {
        const sampleAccountRecord: AccountRecord = {
            displayName: "Torvalds",
            email: "torvalds@linux.org",
            phoneNumber: null,
            photoURL: null,
            uid: uuid(),
            providerId: "google.com",
        };

        it("Passes valid account record", () => {
            AccountRecord.validate(sampleAccountRecord);
        });

        it("Disallows empty uid", () => {
            const sampleAccountRecordWithoutUid = _.omit(sampleAccountRecord, "uid") as AccountRecord;
            expect(() => AccountRecord.validate(sampleAccountRecordWithoutUid)).to.throw(
                /Expected `AccountRecord.uid` to be of type `string`/,
            );
        });
    });

    describe("#fromFirebaseUserInfo", () => {
        const sampleFirebaseUserInfo: firebase.UserInfo = {
            displayName: `dn-${uuid()}`,
            email: `${uuid()}@email.com`,
            photoURL: `pu-${uuid()}`,
            uid: `uid-${uuid()}`,
            providerId: `prv-${uuid()}`,
            phoneNumber: (Math.floor(Math.random() * 10 ** 9) + "").padStart(9, "0"),
        };

        it("Correctly translates fields", () => {
            const accountRecord = AccountRecord.fromFirebaseUserInfo(sampleFirebaseUserInfo);

            expect(accountRecord.displayName).to.be.equal(sampleFirebaseUserInfo.displayName);
            expect(accountRecord.email).to.be.equal(sampleFirebaseUserInfo.email);
            expect(accountRecord.uid).to.be.equal(sampleFirebaseUserInfo.uid);
            expect(accountRecord.providerId).to.be.equal(sampleFirebaseUserInfo.providerId);
            expect(accountRecord.photoURL).to.be.equal(sampleFirebaseUserInfo.photoURL);
        });

        it("By default skips phone number", () => {
            const accountRecord = AccountRecord.fromFirebaseUserInfo(sampleFirebaseUserInfo);

            expect(accountRecord.phoneNumber).to.be.null;
        });

        it("Skips phone number when includePhoneNumber = false", () => {
            const accountRecord = AccountRecord.fromFirebaseUserInfo(sampleFirebaseUserInfo, {
                includePhoneNumber: false,
            });

            expect(accountRecord.phoneNumber).to.be.null;
        });

        it("Does not skip phone number when includePhoneNumber = true", () => {
            const accountRecord = AccountRecord.fromFirebaseUserInfo(sampleFirebaseUserInfo, {
                includePhoneNumber: true,
            });

            expect(accountRecord.phoneNumber).to.not.be.null;
            expect(accountRecord.phoneNumber).to.be.equal(sampleFirebaseUserInfo.phoneNumber);
        });
    });
});
