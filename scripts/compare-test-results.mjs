import { readFileSync } from 'node:fs';
const [baselinePath, candidatePath] = process.argv.slice(2);
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const candidate = JSON.parse(readFileSync(candidatePath, 'utf8'));
function failed(report) {
  return report.testResults.flatMap(file => file.assertionResults
    .filter(test => test.status === 'failed')
    .map(test => ({ id: file.name.slice(file.name.lastIndexOf('/src/')) + ' :: ' + test.fullName,
      messages: test.failureMessages })));
}
const oldFailures = new Set(failed(baseline).map(test => test.id));
const regressions = failed(candidate).filter(test => !oldFailures.has(test.id));
console.log(JSON.stringify({
  baseline: { total: baseline.numTotalTests, passed: baseline.numPassedTests, failed: baseline.numFailedTests },
  candidate: { total: candidate.numTotalTests, passed: candidate.numPassedTests, failed: candidate.numFailedTests },
  newFailures: regressions,
  existingFailures: failed(candidate).filter(test => oldFailures.has(test.id)).map(test => test.id),
}, null, 2));
if (regressions.length || candidate.numTotalTests < baseline.numTotalTests
  || (candidate.numRuntimeErrorTestSuites ?? 0) > (baseline.numRuntimeErrorTestSuites ?? 0)
  || candidate.numPendingTests > baseline.numPendingTests
  || candidate.numFailedTests !== failed(candidate).length) process.exit(1);
