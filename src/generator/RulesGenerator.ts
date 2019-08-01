// tslint:disable member-ordering
import * as _ from "lodash";
import ow from "ow";

import { Configuration } from "../config/Configuration";
import { Role } from "../model/Role";

export class RulesGenerator {
    private config: Configuration;
    private customRules: string;

    public constructor(config: Configuration, customRules: string = RulesGenerator.DEFAULT_CUSTOM_RULES) {
        Configuration.validate(config, "RulesGenerator.constructor(config) ");
        this.config = config;

        ow(customRules, "customRules", ow.string);
        this.customRules = customRules;
    }

    public asString(): string {
        return this.fromTemplate();
    }

    private getManagersPerRole() {
        const managersPerRole: { [x: string]: string[] } = {};

        const getManagers = (roleName: string) => {
            return _.toPairs(this.config.roles)
                .filter(r => r[1].manages.indexOf(roleName) >= 0)
                .map(r => r[0]);
        };

        for (const roleName of _.keys(this.config.roles)) {
            managersPerRole[roleName] = getManagers(roleName);
        }
        return managersPerRole;
    }

    private constructRoleManagementStatements() {
        const roleManagers = this.getManagersPerRole();

        const statements: string[] = [];
        for (const roleName of _.keys(this.config.roles)) {
            statements.push(this.constructSingleRoleStatement(roleName, roleManagers[roleName]));
        }
        return statements.join(`\n`);
    }

    private constructSingleRoleStatement(roleName: string, roleManagers: string[]) {
        const managerStatements = roleManagers.map(m => ` || callerHasRole("${m}")`).join("");
        return `
    match /${this.config.roleCollectionPrefix}${roleName}/{uid} {
        allow get: if isAuthenticated();
        allow read, list, create, delete: if isAuthenticated() && ( false
                // managers of the ${roleName} role:
                ${managerStatements}
        );
        allow update: if false;
    }

    match /${this.config.roleRequestsCollectionPrefix}${roleName}/{uid} {
        allow get: if isAuthenticated();
        allow create: if isAuthenticated() && allowCreateOwnUid(uid);
        allow read, list, delete: if isAuthenticated() && ( false
                // managers of the ${roleName} role:
                ${managerStatements}
        );
        allow update: if false;
    }
        `;
    }

    private constructAccountReadStatements() {
        const indentation = "               ";
        const statements: string[] = [];
        for (const roleName of _.keys(this.config.roles)) {
            const role: Role = this.config.roles[roleName];
            const managedRolesStatement = role.manages
                .map(managedRole => ` || userHasRole("${managedRole}", uid)`)
                .join("");
            statements.push(`${indentation} || callerHasRole("${roleName}") && (false${managedRolesStatement})`);
        }
        return statements.join(`\n`);
    }

    private fromTemplate() {
        return `
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    ${this.getMethods()}

    match /${this.config.accountsCollection}/{uid} {
        allow create: if allowAccountCreateWithNonFakeParams(uid);
        allow get: if isAuthenticated() &&
         (
            accountBelongsToCaller(uid)
             || ( false
                // manager of a role can read data of users who belong to the role
${this.constructAccountReadStatements()}
            )
        );
        allow list: if false;
    }
    ${this.constructRoleManagementStatements()}

${this.indent(this.customRules, "    ")}
  }
}
    `;
    }

    private getMethods() {
        return Object.freeze(`
    function isAuthenticated() {
        return request.auth != null;
    }

    function accountBelongsToCaller(uid) {
        return request.auth != null && uid != null && request.auth.uid == uid;
    }

    function docExistsInCollection(colName, docName) {
        return exists(/databases/$(database)/documents/$(colName)/$(docName));
    }

    function userHasRole(role, uid) {
        return docExistsInCollection("${this.config.roleCollectionPrefix}" + role, uid);
    }

    function callerHasRole(role) {
        return userHasRole(role, request.auth.uid);
    }

    function allowCreateOwnUid(uid) {
        return request.auth.uid == uid;
    }

    function allowAccountCreateWithNonFakeParams(uid) {
        return isAuthenticated()
             && allowCreateOwnUid(uid)
             && request.auth.token.email == request.resource.data.email
             && request.auth.token.name == request.resource.data.displayName
            ;
    }
    `);
    }

    private indent(str: string, indentation: string) {
        return indentation + str.split("\n").join(`\n${indentation}`);
    }

    public static DEFAULT_CUSTOM_RULES = `
        ... your rules here, eg.:
        match /posts/{post} {
            allow read: if true;
            allow write: if isAuthenticated() && callerHasRole("editor");
        }
    `;
}
