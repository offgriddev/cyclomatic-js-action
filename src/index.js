import * as core from "@actions/core";
import "./require-polyfill.js";
import { readdir, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { calculateComplexity } from "cyclomatic-js";

import { context, getOctokit } from "@actions/github";
import { printReport } from "./report.js";

export async function getPushDetails(githubToken, event) {
  core.info(JSON.stringify(event.commits, undefined, 2));
  if (!event.commits) return undefined;

  const github = getOctokit(githubToken, context.repo);
  // push always originates from a PR
  const prs = await github.rest.pulls.list({
    ...context.repo,
    state: "closed",
  });
  for (const commit of event.commits) {
    const found = prs.data.find((pr) => pr.merge_commit_sha === commit.id);
    if (found)
      return {
        head: found.head.ref,
        actor: commit.author.username,
        actorName: commit.author.name,
      };
  }
  core.info("Found no PRs related to the commits in the PushEvent");
}

async function getSourceFile(folder, includedType, excludedType) {
  let filePaths = [];
  // get contents for folder
  const paths = await readdir(folder, { withFileTypes: true });
  // check if item is a directory

  for (const path of paths) {
    const filePath = `${folder}/${path.name}`;

    if (path.isDirectory()) {
      if (path.name.match(/.*node_modules.*|.git|.github/)) continue;

      const recursePaths = await getSourceFile(
        `${folder}/${path.name}`,
        includedType,
        excludedType,
      );
      filePaths = filePaths.concat(recursePaths);
    } else {
      if (filePath.match(includedType) && !filePath.match(excludedType))
        filePaths.push(filePath);
    }
  }
  return filePaths;
}

/**
 * This report leverages calculateComplexity to produce a complexity report recursively for an entire
 * project directory
 * @param {string} directory a given directory to analyze
 */
export async function generateComplexityReport(
  event,
  githubToken,
  workingDirectory,
) {
  const inc = core.getInput("includedFileTypes");
  const exc = core.getInput("excludedFileTypes");
  const include = new RegExp(inc);
  const exclude = new RegExp(exc);
  const sourceFiles = await getSourceFile(workingDirectory, include, exclude);
  const analyzedFiles = (
    await Promise.all(
      sourceFiles.map(async (file) => {
        try {
          return {
            file,
            report: await calculateComplexity(file),
          };
        } catch (e) {
          return {
            file,
            error:
              "failed to generate report for file, possible syntactical issue",
          };
        }
      }),
    )
  )
    .filter((file) => !!file.report)
    .filter((file) => Object.keys(file.report).length > 0);
  const date = new Date().toISOString();
  const reports = analyzedFiles.map((file) => file.report);

  const totalComplexity = reports
    .map((r) => {
      if (!r) return 0;
      const keys = Object.keys(r);
      if (keys.length === 0) return 0;

      const complexities = [];
      keys.forEach((key) => {
        const complexity = r[key];
        complexities.push(complexity);
      });

      return complexities.reduce((prev, cur) => prev + cur, 0);
    })
    .reduce((prev, cur) => prev + cur, 0);
  const baseMetrics = {
    sha: context.sha,
    ref: context.ref,
    repository: context.repo,
    files: analyzedFiles,
    totalComplexity,
    dateUtc: date,
  };
  const prBase = {
    head: context.payload.pull_request?.head.ref,
    actor: context.actor,
  };
  const pushBase = await getPushDetails(githubToken, event);
  // pull_request will be empty on a push
  const isPushRequest = !!pushBase;
  const analytics = isPushRequest
    ? {
        ...pushBase,
        ...baseMetrics,
      }
    : { ...prBase, ...baseMetrics };
  await printReport(analytics);
  const folder = "complexity-assessment";
  const filename = `${folder}/${analytics.repository.repo}/${context.sha}-${analytics.actor}-complexity.json`;
  core.info(`Report saved to: ${filename}`);
  if (!existsSync(folder)) await mkdir(folder);
  if (!existsSync(`${folder}/${analytics.repository.repo}`))
    await mkdir(`${folder}/${analytics.repository.repo}`);
  await writeFile(filename, JSON.stringify(analytics, undefined, 2));
  return filename;
}

async function run() {
  try {
    const workingDirectory = core.getInput("working_directory");
    const githubToken = core.getInput("github_token");
    const event = core.getInput("event");
    const filename = await generateComplexityReport(
      event,
      githubToken,
      workingDirectory || "./",
    );

    core.setOutput("export_filename", filename);
  } catch (error) {
    core.setFailed(error.message);
    core.setFailed(error.stack);
  }
}

run();
