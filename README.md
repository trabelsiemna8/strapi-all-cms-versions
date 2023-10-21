# Strapi all versions

Repository containing every Strapi version with one version per branch since Strapi 4.4.0. Built to ease the testing of specific versions of the CMS in the cloud. Also contains a script to install new versions in new branches automatically.

## Requirements
- Nodejs 20
- Nodejs 16 (strapi < 1.12)
- Npm
- Git

## Add missing Strapi versions

```bash
node .bin/update.js

# Debug mode:
DEBUG=true node .bin/update.js
```

## Push all branches

```bash
bash .bin/push-all-branches.bash
```

## Using vscode tasks

- `CTRL (COMMAND) + SHIFT + P`
- Tasks: Run Task
  - Update strapi versions
  - Push all branches
