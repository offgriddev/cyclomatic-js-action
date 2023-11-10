import * as core from "@actions/core";

export async function printReport(report) {
  const summary = core.summary.addHeading("Summary");
  summary.addRaw(`Actor: ${report.actor}`);
  summary.addRaw(`SHA: ${report.sha}`);
  summary.addRaw(`Branch: ${report.ref}`);
  summary.addRaw(`Repository: ${report.repository.repo}`);
  summary.addRaw(`Total Complexity: ${report.totalComplexity}`);
  summary.addHeading("Complexity Report", 2);
  report.files.forEach((file) => {
    summary.addHeading("File", file.file);
    const mappedKeys = Object.keys(file.report).map(
      (funcName) => file.report[funcName],
    );
    const maxComplexity = Math.max(mappedKeys);
    const totalComplexity = mappedKeys.reduce((prev, cur) => +prev + +cur);
    summary.addRaw(`Max Complexity: ${maxComplexity}`);
    summary.addRaw(`Total Complexity: ${totalComplexity}`);
    summary.addSeparator();
  });
  await summary.write();
}
