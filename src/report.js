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
    [report.actor, report.sha, report.head, report.totalComplexity.toString()],
  ]);

  summary.addHeading("Complexity Report", 2);
  report.files.forEach((file) => {
    summary.addHeading(`File: ${file.file}\n`, 3);
    const mappedKeys = Object.keys(file.report).map(
      (funcName) => +file.report[funcName],
    );
    const maxComplexity = Math.max(...mappedKeys);
    const totalComplexity = mappedKeys.reduce((prev, cur) => +prev + +cur);

    summary.addTable([
      [
        { data: "File", header: true },
        { data: "Max", header: true },
        { data: "Total", header: true },
      ],
      [file.file, maxComplexity.toString(), totalComplexity.toString()],
    ]);
    summary.addHeading("Functions", 4);
    const functionRows = [
      [
        { data: "Name", header: true },
        { data: "Complexity", header: true },
      ],
    ];
    Object.keys(file.report).forEach((func) =>
      functionRows.push([func, file.report[func].toString()]),
    );
    summary.addTable(functionRows);
  });
  await summary.write();
}
