const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const REPO_ROOT = path.join(__dirname, "..");
console.log(REPO_ROOT);

const moveVersionsToBranches = (versions) => {
  console.log("\nMoving each Strapi version files to a dedicated Git branch");

  for (const version of versions) {
    const strapiPath = path.join(REPO_ROOT, "workdir", version);
    console.log(strapiPath);

    // if (!fs.existsSync(strapiPath)) {
    //   console.log(`Version ${version} not found in workdir.`);
    //   continue;
    // }

    console.log(`\n> Creating branch for ${version}`);
    git("checkout master");

    // Delete branch if it already exists
    try {
      git(`branch -D ${version}`);
    } catch (error) {}

    git(`checkout -b ${version}`);
    copyDirectoryContent(strapiPath, REPO_ROOT);
    git("add -A");
    git(`commit -m "Init version ${version}"`);

    fs.rmSync(path.join(strapiPath), {
      recursive: true,
      force: true,
    });
  }
};

const git = (command) =>
  execSync(`git ${command}`, {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });

const copyDirectoryContent = (src, dst) => {
  const files = fs.readdirSync(src);

  for (const file of files) {
    fs.cpSync(path.join(src, file), path.join(REPO_ROOT, file), {
      recursive: true,
      filter: (src) => !src.endsWith(".gitignore"),
    });
  }

  console.log(`Copied ${files.length} files to repository root`);
};

const main = async () => {
  // Replace 'versions' array with the versions you want to move to branches
  const versions = ["4.12.7", "4.12.6"];

  moveVersionsToBranches(versions);

  console.log("\nDone.");
  git("checkout master");
};

main();
