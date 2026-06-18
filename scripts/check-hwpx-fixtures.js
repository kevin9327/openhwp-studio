const fs = require("node:fs");
const path = require("node:path");
const { createZip, extractTextNodes, readZip } = require("./hwpx-fixture-utils");

const root = path.resolve(__dirname, "..");
const samplesDir = path.join(root, "samples");
const expectedPath = path.join(samplesDir, "openhwp-basic.expected.json");
const expected = JSON.parse(fs.readFileSync(expectedPath, "utf8"));
const fixturePath = path.join(samplesDir, expected.fixture);
const fixture = fs.readFileSync(fixturePath);
const entries = readZip(fixture);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const name of expected.entries) {
  assert(entries.has(name), `Missing expected ZIP entry: ${name}`);
}

const sectionPaths = [...entries.keys()]
  .filter((name) => /^Contents\/section\d+\.xml$/i.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
assert(JSON.stringify(sectionPaths) === JSON.stringify(expected.sections), `Unexpected sections: ${sectionPaths.join(", ")}`);

const sectionXml = entries.get(sectionPaths[0]).toString("utf8");
const paragraphs = extractTextNodes(sectionXml);
assert(JSON.stringify(paragraphs) === JSON.stringify(expected.paragraphs), "Fixture paragraph extraction mismatch");

const tableCount = (sectionXml.match(/<(?!\/)[^:>]*:?tbl\b/g) || []).length;
assert(tableCount === expected.tableCount, `Expected ${expected.tableCount} table(s), found ${tableCount}`);

for (const name of expected.styles) {
  assert(entries.has(name), `Missing expected style entry: ${name}`);
}
for (const name of expected.relationships) {
  assert(entries.has(name), `Missing expected relationship entry: ${name}`);
}

const doctor = inspectFixturePackage({ entries, sectionPaths, styles: expected.styles, relationships: expected.relationships, tableCount, paragraphs });
assert(doctor.score === expected.doctor.score, `Expected doctor score ${expected.doctor.score}, found ${doctor.score}`);
assert(doctor.status === expected.doctor.status, `Expected doctor status ${expected.doctor.status}, found ${doctor.status}`);
assert(JSON.stringify(doctor.counts) === JSON.stringify(expected.doctor.counts), "Doctor issue counts mismatch");
assert(
  JSON.stringify(doctor.issues.map(({ id, severity }) => ({ id, severity }))) === JSON.stringify(expected.doctor.issues),
  "Doctor issue list mismatch",
);

const patchedText = "브라우저에서 로컬 HWPX 문서를 열고 문단을 수정하고 검증합니다.";
const patchedTableCellText = "검증 값 수정";
const patchedEntries = [...entries].map(([name, data]) => ({
  name,
  data:
    name === sectionPaths[0]
      ? data.toString("utf8").replace(expected.paragraphs[3], patchedText).replace(expected.paragraphs[5], patchedTableCellText)
      : data,
}));
const patchedZip = readZip(createZip(patchedEntries));
const patchedParagraphs = extractTextNodes(patchedZip.get(sectionPaths[0]).toString("utf8"));
assert(patchedParagraphs[3] === patchedText, "Patched HWPX round-trip paragraph mismatch");
assert(patchedParagraphs[4] === expected.paragraphs[4], "Table cell paragraph changed unexpectedly during patch test");
assert(patchedParagraphs[5] === patchedTableCellText, "Patched HWPX table-cell round-trip mismatch");

console.log(`HWPX fixture OK: ${expected.fixture}`);
console.log(`Sections: ${sectionPaths.length}, paragraphs: ${paragraphs.length}, tables: ${tableCount}`);
console.log(`Doctor: score ${doctor.score}, status ${doctor.status}`);

function inspectFixturePackage({ entries, sectionPaths, styles, relationships, tableCount, paragraphs }) {
  const issues = [];
  const addIssue = (severity, id) => issues.push({ severity, id });
  const hasEntry = (name) => entries.has(name);

  if (!hasEntry("mimetype")) addIssue("warn", "missing-mimetype");
  if (!sectionPaths.length) addIssue("danger", "missing-sections");
  if (!styles.some((name) => hasEntry(name))) addIssue("warn", "missing-styles");
  if (!relationships.some((name) => hasEntry(name))) addIssue("warn", "missing-relationships");
  if (!paragraphs.length) addIssue("warn", "empty-text");
  if (tableCount) addIssue("info", "partial-table-editing");

  const penalty = issues.reduce((total, issue) => total + ({ danger: 30, warn: 12, info: 3 }[issue.severity] || 0), 0);
  const score = Math.max(0, 100 - penalty);
  return {
    score,
    status: score >= 90 ? "ready" : score >= 70 ? "review" : "risky",
    counts: {
      danger: issues.filter((issue) => issue.severity === "danger").length,
      warn: issues.filter((issue) => issue.severity === "warn").length,
      info: issues.filter((issue) => issue.severity === "info").length,
    },
    issues,
  };
}
