const fs = require("node:fs");
const path = require("node:path");
const { exec, execSync } = require("node:child_process");

const MIN_VERSION = "4.8.2";
const EXCLUDED_VERSIONS = ["4.13.0", "5.0.0-beta.11", "5.0.0-beta.15", "5.0.0-rc.1", "5.0.0-rc.3"];
const REPO_ROOT = path.join(__dirname, "..");
const INSTALL_TIMEOUT = 60000; // ms - Increased timeout to handle slower CI environment

const configureGit = () => {
  git('config --global user.email "emna.trabelsi@strapi.io"');
  git('config --global user.name "Emna Trabelsi"');
};

const listStrapiVersions = ({ minVersion }) => {
  const rawVersions = execSync("npm view create-strapi-app versions", {
    encoding: "utf8",
  });

  git("checkout master");

  // Force-fetch all branches
  git("fetch --all");

  const alreadyInstalled = git("branch --all")
    .trim()
    .split("\n")
    .map((v) => v.trim().replace("remotes/origin/", ""))
    .filter((v) => !v.includes("master") && !v.includes("HEAD"));

  console.log(`\nDetected installed versions in branches: ${alreadyInstalled.join(", ")}\n`);

  const versions = JSON.parse(rawVersions.replaceAll("'", '"'));

  const firstVersionIndex = versions.findIndex((version) =>
    version.startsWith(minVersion)
  );

  versions.splice(0, firstVersionIndex);

  const selectedVersions = versions.filter(
    (v) => !alreadyInstalled.includes(v) && !EXCLUDED_VERSIONS.includes(v)
  );

  return selectedVersions;
};

const installStrapiVersion = async (version, { workdir }) =>
  new Promise((resolve, reject) => {
    console.log(`Installing ${version}`);

    const childProcess = exec(
      `yes | npx create-strapi-app@${version} ${version} --quickstart`,
      {
        cwd: workdir,
        encoding: "utf8",
        timeout: INSTALL_TIMEOUT,
        killSignal: "SIGINT",
      },
      (err, stdout, stderr) => {
        if (fs.existsSync(path.join(workdir, version))) {
          fs.rmSync(path.join(workdir, version, "node_modules"), {
            recursive: true,
            force: true,
          });
          console.log(`Successfully installed ${version}`);
          childProcess.kill("SIGINT");
          resolve();
        } else {
          console.log(`Errors during installation for ${version}`);
          console.error({ err, stdout, stderr });

          childProcess.kill("SIGINT");
          reject(new Error(`Installation failed for version ${version}`));
        }
      }
    );
  });

const installStrapiVersions = async (versions) => {
  const workdir = path.join(REPO_ROOT, "workdir");

  fs.rmSync(workdir, { recursive: true, force: true });
  fs.mkdirSync(workdir);

  console.log(`Selected for install: ${versions.join(", ")}\n`);

  const successfulInstalls = [];

  for (const version of versions) {
    try {
      await installStrapiVersion(version, { workdir });
      successfulInstalls.push(version);
    } catch (error) {
      console.error(error.message);
    }
  }

  return successfulInstalls;
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

const moveVersionsToBranches = (versions) => {
  console.log("\nMoving each Strapi version files to a dedicated git branch");

  for (const version of versions) {
    const strapiPath = path.join(REPO_ROOT, "workdir", version);

    if (!fs.existsSync(strapiPath)) continue;

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
    git(`push origin ${version}`);

    fs.rmSync(path.join(strapiPath), {
      recursive: true,
      force: true,
    });
  }
};

const main = async () => {
  configureGit();

  const versions = listStrapiVersions({ minVersion: MIN_VERSION });

  const successfulInstalls = await installStrapiVersions(versions);
  moveVersionsToBranches(successfulInstalls);

  console.log("\nDone.");
  git("checkout master");
};

main();
