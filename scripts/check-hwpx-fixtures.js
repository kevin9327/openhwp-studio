const fs = require("node:fs");
const path = require("node:path");
const { createZip, extractTextNodes, inspectZipHeaders, readZip } = require("./hwpx-fixture-utils");

const root = path.resolve(__dirname, "..");
const samplesDir = path.join(root, "samples");
const expectedFiles = fs
  .readdirSync(samplesDir)
  .filter((name) => name.endsWith(".expected.json"))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const expectedFile of expectedFiles) {
  checkFixture(JSON.parse(fs.readFileSync(path.join(samplesDir, expectedFile), "utf8")));
}

function checkFixture(expected) {
  const fixturePath = path.join(samplesDir, expected.fixture);
  const fixture = fs.readFileSync(fixturePath);
  const entries = readZip(fixture);

  for (const name of expected.entries) {
    assert(entries.has(name), `Missing expected ZIP entry in ${expected.fixture}: ${name}`);
  }

  const sectionPaths = [...entries.keys()]
    .filter((name) => /^Contents\/section\d+\.xml$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  assert(JSON.stringify(sectionPaths) === JSON.stringify(expected.sections), `Unexpected sections in ${expected.fixture}: ${sectionPaths.join(", ")}`);

  const sectionXml = entries.get(sectionPaths[0]).toString("utf8");
  const paragraphs = extractTextNodes(sectionXml);
  assert(JSON.stringify(paragraphs) === JSON.stringify(expected.paragraphs), `Fixture paragraph extraction mismatch in ${expected.fixture}`);

  const tableCount = (sectionXml.match(/<(?!\/)[^:>]*:?tbl\b/g) || []).length;
  assert(tableCount === expected.tableCount, `Expected ${expected.tableCount} table(s), found ${tableCount} in ${expected.fixture}`);

  for (const name of expected.styles) {
    assert(entries.has(name), `Missing expected style entry in ${expected.fixture}: ${name}`);
  }
  for (const name of expected.relationships) {
    assert(entries.has(name), `Missing expected relationship entry in ${expected.fixture}: ${name}`);
  }

  const inspector = inspectFixtureInspector(entries);
  assert(JSON.stringify(inspector.entryKinds) === JSON.stringify(expected.inspector.entryKinds), `Inspector entry kind counts mismatch in ${expected.fixture}`);
  assert(inspector.manifestItems === expected.inspector.manifestItems, `Expected ${expected.inspector.manifestItems} manifest items, found ${inspector.manifestItems} in ${expected.fixture}`);
  assert(inspector.missingTargets === expected.inspector.missingTargets, `Expected ${expected.inspector.missingTargets} missing targets, found ${inspector.missingTargets} in ${expected.fixture}`);

  const doctor = inspectFixturePackage({ entries, sectionPaths, styles: expected.styles, relationships: expected.relationships, tableCount, paragraphs, inspector });
  assert(doctor.score === expected.doctor.score, `Expected doctor score ${expected.doctor.score}, found ${doctor.score} in ${expected.fixture}`);
  assert(doctor.status === expected.doctor.status, `Expected doctor status ${expected.doctor.status}, found ${doctor.status} in ${expected.fixture}`);
  assert(JSON.stringify(doctor.counts) === JSON.stringify(expected.doctor.counts), `Doctor issue counts mismatch in ${expected.fixture}`);
  assert(JSON.stringify(doctor.repairModes) === JSON.stringify(expected.doctor.repairModes), `Doctor repair modes mismatch in ${expected.fixture}`);
  assert(
    JSON.stringify(doctor.issues.map(({ id, severity }) => ({ id, severity }))) === JSON.stringify(expected.doctor.issues),
    `Doctor issue list mismatch in ${expected.fixture}`,
  );

  if (doctor.repairModes.auto) {
    const repaired = applyFixtureAutoRepair(entries);
    const repairedZip = createZip(repaired);
    const repairedEntries = readZip(repairedZip);
    const repairedHeaders = inspectZipHeaders(repairedZip);
    const missingOriginal = [...entries.keys()].filter((name) => !repairedEntries.has(name));
    assert(missingOriginal.length === 0, `Auto repair dropped original entries in ${expected.fixture}: ${missingOriginal.join(", ")}`);
    assert(repairedEntries.has("mimetype"), `Auto repair did not add mimetype in ${expected.fixture}`);
    assert(repairedEntries.get("mimetype").toString("utf8") === "application/hwp+zip", `Auto repair wrote unexpected mimetype in ${expected.fixture}`);
    assert(repairedHeaders[0]?.name === "mimetype", `Auto repair did not write mimetype as the first entry in ${expected.fixture}`);
    assert(repairedHeaders[0]?.method === 0, `Auto repair did not STORE mimetype in ${expected.fixture}`);
  }

  const patchedText = "OpenHWP Studio patched paragraph";
  const patchedTableCellText = "Patched table cell";
  const patchedEntries = [...entries].map(([name, data]) => ({
    name,
    data:
      name === sectionPaths[0]
        ? data.toString("utf8").replace(expected.paragraphs[3], patchedText).replace(expected.paragraphs[5], patchedTableCellText)
        : data,
  }));
  const patchedZip = readZip(createZip(patchedEntries));
  const patchedParagraphs = extractTextNodes(patchedZip.get(sectionPaths[0]).toString("utf8"));
  assert(patchedParagraphs[3] === patchedText, `Patched HWPX round-trip paragraph mismatch in ${expected.fixture}`);
  assert(patchedParagraphs[4] === expected.paragraphs[4], `Table cell paragraph changed unexpectedly during patch test in ${expected.fixture}`);
  assert(patchedParagraphs[5] === patchedTableCellText, `Patched HWPX table-cell round-trip mismatch in ${expected.fixture}`);

  console.log(`HWPX fixture OK: ${expected.fixture}`);
  console.log(`Sections: ${sectionPaths.length}, paragraphs: ${paragraphs.length}, tables: ${tableCount}`);
  console.log(`Doctor: score ${doctor.score}, status ${doctor.status}, repair ${JSON.stringify(doctor.repairModes)}`);
  console.log(`Inspector: ${inspector.manifestItems} manifest items, ${inspector.missingTargets} missing target(s)`);
}

function applyFixtureAutoRepair(entries) {
  const repaired = [...entries].map(([name, data]) => ({ name, data }));
  if (!entries.has("mimetype")) repaired.unshift({ name: "mimetype", data: "application/hwp+zip", store: true });
  return repaired;
}

function inspectFixtureInspector(entries) {
  const entryNames = [...entries.keys()];
  const entryKinds = {};
  for (const name of entryNames) {
    const kind = classifyFixtureEntry(name);
    entryKinds[kind] = (entryKinds[kind] || 0) + 1;
  }

  const manifestItems = [];
  for (const name of entryNames.filter((entry) => /(content\.hpf|manifest\.xml|\.rels)$/i.test(entry))) {
    const xml = entries.get(name).toString("utf8");
    for (const match of xml.matchAll(/\b(?:href|Target|full-path)="([^"]+)"/g)) {
      const target = match[1];
      if (!target || target === "/") continue;
      const path = resolveFixtureTarget(name, target);
      manifestItems.push({ source: name, target, path, exists: /^https?:|^urn:|^data:/i.test(target) || entries.has(path) });
    }
  }

  return {
    entryKinds: Object.fromEntries(Object.entries(entryKinds).sort(([a], [b]) => a.localeCompare(b))),
    manifestItems: manifestItems.length,
    missingTargets: manifestItems.filter((item) => !item.exists).length,
  };
}

function classifyFixtureEntry(name) {
  if (/^mimetype$/i.test(name)) return "mimetype";
  if (/^Contents\/section\d+\.xml$/i.test(name)) return "section";
  if (/(content\.hpf|manifest\.xml|\.rels)$/i.test(name)) return "manifest";
  if (/(styles?|font|settings|theme|version)\.xml$/i.test(name)) return "style";
  if (/(^BinData\/|^Contents\/media\/|\.(bmp|gif|jpe?g|png|svg|webp|wmf|emf)$)/i.test(name)) return "media";
  if (/\.xml$/i.test(name)) return "xml";
  return "other";
}

function resolveFixtureTarget(source, target) {
  const clean = target.replace(/\\/g, "/").split("#")[0];
  if (/^(https?:|urn:|data:|mailto:)/i.test(clean)) return clean;
  if (clean.startsWith("/")) return normalizeFixturePath("", clean.slice(1));
  const parts = source.split("/");
  parts.pop();
  return normalizeFixturePath(parts.join("/"), clean);
}

function normalizeFixturePath(base, target) {
  const parts = `${base ? `${base}/` : ""}${target}`.split("/");
  const normalized = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") normalized.pop();
    else normalized.push(part);
  }
  return normalized.join("/");
}

function inspectFixturePackage({ entries, sectionPaths, styles, relationships, tableCount, paragraphs, inspector }) {
  const issues = [];
  const repairModes = { auto: 0, manual: 0, blocked: 0, verify: 0 };
  const addIssue = (severity, id, mode) => {
    issues.push({ severity, id });
    repairModes[mode] = (repairModes[mode] || 0) + 1;
  };
  const hasEntry = (name) => entries.has(name);

  if (!hasEntry("mimetype")) addIssue("warn", "missing-mimetype", "auto");
  if (!sectionPaths.length) addIssue("danger", "missing-sections", "blocked");
  if (!styles.some((name) => hasEntry(name))) addIssue("warn", "missing-styles", "manual");
  if (!relationships.some((name) => hasEntry(name))) addIssue("warn", "missing-relationships", "manual");
  if (inspector.missingTargets) addIssue("warn", "missing-relationship-target", "manual");
  if (!paragraphs.length) addIssue("warn", "empty-text", "manual");
  if (tableCount) addIssue("info", "partial-table-editing", "verify");

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
    repairModes,
    issues,
  };
}
