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