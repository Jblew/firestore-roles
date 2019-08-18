# Firestore user roles management
[![npm](https://img.shields.io/npm/v/firestore-roles.svg?style=flat-square)](https://www.npmjs.com/package/firestore-roles)  [![build](https://travis-ci.com/Jblew/firestore-roles.svg?branch=master)](https://travis-ci.com/Jblew/firestore-roles) [![codecov](https://codecov.io/gh/Jblew/firestore-roles/branch/master/graph/badge.svg)](https://codecov.io/gh/Jblew/firestore-roles) [![License](https://img.shields.io/github/license/Jblew/firestore-roles.svg?style=flat-square)](https://github.com/Jblew/firestore-roles/blob/master/LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)



- Ecosystem
  - [Vuex module](https://github.com/jblew/firestore-roles-vuex-module) with type-guarded actions dispatch
  - [Redux module](https://github.com/jblew/firestore-roles-redux-module)
  - [Roles manager UI](https://github.com/Jblew/firestore-roles-manager-ui/) packaged as a library that can be easily deployed.
- Declarative and exportable [configuration](#configuration)
- Role request support: users can request granting a role
- Support for managed roles (one role can manage multiple other roles)
- Built-in firestore [rules generator](#rules-generator) —wraps your rules with role management statement — can be [included in CI pipeline](#ci-usage)
- Integration tested with firestore emulators — 100% coverage for generated rules
- Typescript .d.ts typings included



## Installation

```bash
$ npm install --save firestore-roles
```

Then:

```typescript
import FirebaseRoles from "firstore-roles";
// or
const FirebaseRoles = require("firstore-roles");
```



##Usage

### Configuration

>To be continued...

### Methods

> To be continued...

### Rules generator

>To be continued...

###CI usage

> To be continued...






### Need help?

- Feel free to email me at <jedrzej@lewandowski.doctor>



### Would like to help?

Warmly welcomed:

- Bug reports via issues
- Enhancement requests via via issues
- Pull requests
- Security reports to jedrzej@lewandowski.doctor



***

Made with ❤️ by [Jędrzej Lewandowski](https://jedrzej.lewandowski.doctor/).

