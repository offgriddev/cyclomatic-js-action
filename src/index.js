import * as core from "@actions/core";
import { calculateComplexity } from "cyclomatic-js";

/**
 * This report leverages calculateComplexity to produce a complexity report recursively for an entire
 * project directory
 * @param {string} directory a given directory to analyze
 */
export async function generateComplexityReport(sha, actor, workingDirectory) {
  const include = /\.js$/;
  const exclude = /\__mocks__|.test.js|Test.js/;
  const sourceFiles = await getSourceFile(workingDirectory, include, exclude);
  const analyzedFiles = await Promise.all(
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
  );
  const report = {
    sha,
    actor,
    workingDirectory,
    totalComplexity: 0,
    dateUtc: new Date().toUTCString(),
  };
  const filename = `complexity-report-${new Date()}.json`;
  await writeFile(filename, JSON.stringify(report, undefined, 2));
  return filename;
}

async function run() {
  try {
    const sha = core.getInput("sha");
    const actor = core.getInput("actor");
    const workingDirectory = core.getInput("working_directory");
    const filename = generateComplexityReport(sha, actor, workingDirectory);

    core.setOutput("export_filename", filename);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
