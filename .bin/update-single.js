const fs = require("node:fs");
const path = require("node:path");
const { exec, execSync } = require("node:child_process");

const VERSION = "4.25.3";
const REPO_ROOT = path.join(__dirname, "..");
const INSTALL_TIMEOUT = 60000; // ms - Increased timeout to handle slower CI environment

const installStrapiVersion = async (version, { workdir }) =>
  new Promise((resolve) => {
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
          resolve();
        }
      }
    );
  });

const git = (command) =>
  execSync(`git ${command}`, {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });

const configureGit = () => {
  git('config --global user.email "emna.trabelsi@strapi.io"');
  git('config --global user.name "Emna Trabelsi"');
};

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

const moveVersionToBranch = (version) => {
  console.log("\nMoving Strapi version files to a dedicated git branch");

  const strapiPath = path.join(REPO_ROOT, "workdir", version);

  if (!fs.existsSync(strapiPath)) return;

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
};

const main = async () => {
  configureGit();

  const workdir = path.join(REPO_ROOT, "workdir");

  fs.rmSync(workdir, { recursive: true, force: true });
  fs.mkdirSync(workdir);

  console.log(`Selected for install: ${VERSION}\n`);

  await installStrapiVersion(VERSION, { workdir });
  moveVersionToBranch(VERSION);

  console.log("\nDone.");
  git("checkout master");
};

main();
