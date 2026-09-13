import { readFileSync } from 'node:fs';
const report = JSON.parse(readFileSync('candidate-tests.json', 'utf8'));
const failures = report.testResults.flatMap(file => file.assertionResults
  .filter(test => test.status === 'failed').map(test => ({
    file: file.name.slice(file.name.lastIndexOf('/src/')), test: test.fullName,
    message: test.failureMessages.join('\n').slice(0, 6000),
  })));
console.log(JSON.stringify({ total: report.numTotalTests, passed: report.numPassedTests, failed: report.numFailedTests, failures }, null, 2));
