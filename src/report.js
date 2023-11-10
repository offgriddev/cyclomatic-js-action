import * as core from "@actions/core";

export async function printReport(report) {
  const summary = core.summary.addHeading("Summary");
  summary
    .addRaw(`Actor: ${report.actor}\n`)
    .addEOL()
    .addRaw(`SHA: ${report.sha}\n`)
    .addEOL()
    .addRaw(`Branch: ${report.ref}\n`)
    .addEOL()
    .addRaw(`Repository: ${report.repository.repo}\n`)
    .addEOL();

  summary.addList([
    `Actor: ${report.actor}\n`,
    `SHA: ${report.sha}\n`,
    `Branch: ${report.ref}\n`,
  ]);
  summary.addRaw(`Total Complexity: ${report.totalComplexity}\n`);
  summary.addHeading("Complexity Report", 2);
  report.files.forEach((file) => {
    summary.addHeading(`File: ${file.file}\n`, 3);
    const mappedKeys = Object.keys(file.report).map(
      (funcName) => +file.report[funcName],
    );
    const maxComplexity = Math.max(...mappedKeys);
    const totalComplexity = mappedKeys.reduce((prev, cur) => +prev + +cur);
    summary.addRaw(`Max Complexity: ${maxComplexity}`);
    summary.addBreak();
    summary.addRaw(`Total File Complexity: ${totalComplexity}`);
    summary.addBreak();
    Object.keys(file.report).forEach((funcName) => {
      summary.addHeading(`Function: ${funcName}`, 4);
      summary.addRaw(`Total Function Complexity: ${file.report[funcName]}`);
      summary.addBreak();
    });
    summary.addSeparator();
  });
  await summary.write();
}
