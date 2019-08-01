export function getUsage() {
    return `Usage:
firestore-roles generate <config.js> <firestore-inner-rules.rules> <output.rules>

Config js should have a default export (module.exports=) that exports object compatible
with Configuration interface.

Example:

// firestore-roles.config.js
module.exports = {
    accountsCollection: "accounts",
    roleCollectionPrefix: "role_",
    roles: {
        admin: {
            manages: ["manager", "editor", "reviewer"]
        },
        manager: {
            manages: ["editor", "reviewer"]
        },
        editor: {
            manages: []
        },
        reviewer: {
            manages: []
        },
    },
};
`;
}
