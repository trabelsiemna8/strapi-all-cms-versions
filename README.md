# strapi-all-versions

## Requirements
- Nodejs 20
- Nodejs 16 (strapi < 1.12)
- Npm
- Git

## Add missing strapi versions

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
