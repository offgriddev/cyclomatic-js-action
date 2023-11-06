import * as core from "@actions/core";
import { readdir, writeFile } from "fs/promises";
import { calculateComplexity } from "cyclomatic-js";

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
export async function generateComplexityReport(sha, actor, workingDirectory) {
  const include = new RegExp(core.getInput("includedFileTypes"));
  const exclude = new RegExp(core.getInput("excludedFileTypes"));
  const sourceFiles = await getSourceFile(workingDirectory, include, exclude);
  core.info(sourceFiles);
  const analyzedFiles = await Promise.all(
    sourceFiles.map(async (file) => {
      try {
        return {
          file,
          report: await calculateComplexity(file),
        };
      } catch (e) {
        core.error("Error calculating complexity", e);
        return {
          file,
          error:
            "failed to generate report for file, possible syntactical issue",
        };
      }
    }),
  );
  const date = Date.now();
  const report = {
    sha,
    actor,
    workingDirectory,
    files: analyzedFiles,
    totalComplexity: 0,
    dateUtc: date,
  };
  core.info(JSON.stringify(report, undefined, 2));
  const filename = `complexity-report-${date}.json`;
  await writeFile(filename, JSON.stringify(report, undefined, 2));
  return filename;
}

async function run() {
  try {
    const workingDirectory = core.getInput("working_directory");
    const filename = await generateComplexityReport(
      sha,
      actor,
      workingDirectory || "./",
    );

    core.info(filename);
    core.setOutput("export_filename", filename);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
