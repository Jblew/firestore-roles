import * as _ from "lodash";

import { Configuration } from "./Configuration";

export namespace RulesGenerator {
    export function generateRules(config: Configuration): string {
        Configuration.validate(config);
        return fromTemplate({
            accountsCollection: config.accountsCollection,
            roleManagementStatements: constructRoleManagementStatements(config),
        });
    }

    function constructRoleManagementStatements(config: Configuration) {
        const indentation = "                ";
        const statements: string[] = [];
        for (const roleName of _.keys(config.roles)) {
            const role: Configuration.Role = config.roles[roleName];
            const managedRoles = role.manages.map(managedRole => `"${managedRole}"`).join(", ");
            statements.push(`${indentation} || allowRoleManagementOnly("${roleName}", [${managedRoles}])`);
        }
        return statements.join(`\n`);
    }

    function fromTemplate(props: { accountsCollection: string; roleManagementStatements: string }) {
        return `
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    ${METHODS}

    match /${props.accountsCollection}/{uid} {
        allow read if: accountBelongsToCaller(uid);
        allow create if: allowCreateAccountWithEmptyRoles(uid);
        allow update, delete, read if:
                (accountBelongsToCaller(uid) && disallowSelfRolesManagement())
                ${props.roleManagementStatements}
        ;
    }

    ... your rules here, eg.:
    match /posts/{post} {
        allow read: if true;
        allow write: if isAuthenticated() && hasRoles(["author"]);
    }
}
    `;
    }

    const METHODS = Object.freeze(`
    function isAuthenticated() {
        return request.auth != null;
    }

    function accountBelongsToCaller(uid) {
        return request.auth != null && request.auth.uid == uid;
    }

    function getRoles() {
        return get(/databases/$(database)/documents/accounts/$(request.auth.uid)).data.roles;
    }

    function hasRoles(roles) {
        return isAuthenticated() && getRoles().hasAll(keys)
    }

    function disallowModifyingAccountExceptRoles() {
        return !(resource.data.keys().length === 1 && ("roles" in resource.data.keys()));
    }

    function allowRoleManagementOnly(manager, roles) {
        return hasRoles([manager]) && disallowModifyingAccountExceptRoles() && roles.hasAll(resource.data.roles);
    }

    function disallowSelfRolesManagement() {
        return !("roles" in resource.data.keys());
    }

    function allowCreateAccountWithEmptyRoles(uid) {
        return accountBelongsToCaller(uid) && ("roles" in resource.data.keys()) && resource.data.roles.length == 0;
    }
    `);
}