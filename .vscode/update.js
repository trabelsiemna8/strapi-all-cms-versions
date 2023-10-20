const fs = require("node:fs");
const path = require("node:path");
const { exec, execSync } = require("node:child_process");

const MIN_VERSION = "4.13.0";
const REPO_ROOT = path.join(__dirname, "..");

const listStrapiVersions = ({ minVersion }) => {
  const rawVersions = execSync("npm view create-strapi-app versions", {
    encoding: "utf8",
  });

  const versions = JSON.parse(rawVersions.replaceAll("'", '"'));

  const firstVersionIndex = versions.findIndex((version) =>
    version.startsWith(minVersion)
  );

  versions.splice(0, firstVersionIndex);

  return versions;
};

const installStrapiVersion = async (version, { workdir }) =>
  new Promise((resolve, reject) => {
    console.log(`Installing ${version}`);

    exec(
      `yes | npx create-strapi-app@${version} ${version} --quickstart`,
      {
        cwd: workdir,
        encoding: "utf8",
        timeout: 15000, // ms - Exit after timeout to skip dependency installation
      },
      (err, stdout, stderr) => {
        if (fs.existsSync(path.join(workdir, version))) {
          fs.rmSync(path.join(workdir, version, "node_modules"), {
            recursive: true,
            force: true,
          });
          console.log(`Successfully installed ${version}`);
          resolve();
        } else {
          console.log(`Errors for ${version}`);
          console.error({ err, stdout, stderr });
          resolve();
        }
      }
    );
  });

const installStrapiVersions = async (versions) => {
  const workdir = path.join(REPO_ROOT, "workdir");

  fs.rmSync(workdir, { recursive: true, force: true });
  fs.mkdirSync(workdir);

  console.log("Installing versions:");
  console.log(versions.join("\n"), "\n");

  const installs = versions.map((version) =>
    installStrapiVersion(version, { workdir })
  );

  await Promise.all(installs);
};

const git = (command) =>
  execSync(`git ${command}`, {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });

const copyDirectoryContent = (src, dst) => {
  const files = fs.readdirSync(src);

  files.forEach((file) => {
    try {
      fs.cpSync(path.join(src, file), path.join(REPO_ROOT, file), {
        recursive: true,
        errorOnExist: true,
      });
    } catch (err) {
      // Silent on exists
    }
  });
};

const moveVersionsToBranches = (versions) => {
  git("checkout master");

  for (const version of versions) {
    const strapiPath = path.join(REPO_ROOT, "workdir", version);

    if (!fs.existsSync(strapiPath)) continue;

    git(`checkout -b ${version}`);
    copyDirectoryContent(strapiPath, REPO_ROOT);
    git("add -A");
    git(`commit -m "Init version ${version}"`);
    git("checkout master");

    console.log(checkout);
  }
};

const main = async () => {
  const versions = listStrapiVersions({ minVersion: MIN_VERSION });

  // await installStrapiVersions(versions);
  moveVersionsToBranches([versions[0]]);
};

main();
