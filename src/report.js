import * as core from "@actions/core";

export async function printReport(report) {
  const summary = core.summary.addHeading('Summary')
  summary.addDetails('Actor', report.actor)
  summary.addDetails('SHA', report.sha)
  summary.addDetails('Branch', report.ref)
  summary.addDetails('Repository', report.repository.repo)
  summary.addDetails('Total Complexity', report.totalComplexity)
  
  summary.addHeading('Complexity Report')
  report.files.forEach((file) => {
    summary.addHeading('File', file.file)
    const mappedKeys = Object.keys(file.report).map((funcName) => file.report[funcName])
    const maxComplexity = Math.max(mappedKeys)
    const totalComplexity = mappedKeys.reduce((prev, cur) => +prev + +cur)
    summary.addHeading('Max Complexity', maxComplexity)
    summary.addHeading('Total File Complexity', totalComplexity)
  })
}