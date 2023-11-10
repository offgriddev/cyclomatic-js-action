import * as core from "@actions/core";

export async function printReport(report) {
  const summary = core.summary.addHeading("Summary");
  summary.addTable([
    [
      {
        data: "Actor",
        header: true,
      },
      {
        data: "SHA",
        header: true,
      },
      {
        data: "Branch",
        header: true,
      },
      {
        data: "Total Complexity",
        header: true,
      },
    ],
    [report.actor, report.sha, report.ref, report.totalComplexity],
  ]);

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
