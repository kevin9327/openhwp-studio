const fs = require("node:fs");
const path = require("node:path");
const { createZip } = require("./hwpx-fixture-utils");

const root = path.resolve(__dirname, "..");
const samplesDir = path.join(root, "samples");
const fixtureName = "openhwp-basic.hwpx";
const fixturePath = path.join(samplesDir, fixtureName);
const expectedPath = path.join(samplesDir, "openhwp-basic.expected.json");

const paragraphs = [
  "OpenHWP Studio 샘플 문서",
  "작성일: 2026. 6. 19.",
  "1. HWPX 열기와 편집",
  "브라우저에서 로컬 HWPX 문서를 열고 문단을 수정합니다.",
  "표 항목",
  "검증 값",
];

const sectionXml = `<?xml version="1.0" encoding="UTF-8"?>
<hs:sec xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">
  <hp:p id="p0"><hp:run><hp:t>${paragraphs[0]}</hp:t></hp:run></hp:p>
  <hp:p id="p1"><hp:run><hp:t>${paragraphs[1]}</hp:t></hp:run></hp:p>
  <hp:p id="p2"><hp:run><hp:t>${paragraphs[2]}</hp:t></hp:run></hp:p>
  <hp:p id="p3"><hp:run><hp:t>${paragraphs[3]}</hp:t></hp:run></hp:p>
  <hp:tbl id="table0">
    <hp:tr>
      <hp:tc><hp:p id="p4"><hp:run><hp:t>${paragraphs[4]}</hp:t></hp:run></hp:p></hp:tc>
      <hp:tc><hp:p id="p5"><hp:run><hp:t>${paragraphs[5]}</hp:t></hp:run></hp:p></hp:tc>
    </hp:tr>
  </hp:tbl>
</hs:sec>
`;

const entries = [
  {
    name: "mimetype",
    data: "application/hwp+zip",
    store: true,
  },
  {
    name: "Contents/content.hpf",
    data: `<?xml version="1.0" encoding="UTF-8"?>
<opf:package xmlns:opf="http://www.idpf.org/2007/opf" version="1.0">
  <opf:metadata>
    <opf:title>OpenHWP Studio basic fixture</opf:title>
    <opf:language>ko</opf:language>
  </opf:metadata>
  <opf:manifest>
    <opf:item id="section0" href="section0.xml" media-type="application/xml"/>
    <opf:item id="styles" href="styles.xml" media-type="application/xml"/>
  </opf:manifest>
</opf:package>
`,
  },
  {
    name: "Contents/styles.xml",
    data: `<?xml version="1.0" encoding="UTF-8"?>
<hh:styles xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head">
  <hh:style id="normal" name="바탕글"/>
  <hh:style id="title" name="제목"/>
</hh:styles>
`,
  },
  {
    name: "Contents/section0.xml",
    data: sectionXml,
  },
];

fs.mkdirSync(samplesDir, { recursive: true });
fs.writeFileSync(fixturePath, createZip(entries));
fs.writeFileSync(
  expectedPath,
  `${JSON.stringify(
    {
      fixture: fixtureName,
      generatedBy: "scripts/create-sample-hwpx.js",
      entries: entries.map((entry) => entry.name),
      sections: ["Contents/section0.xml"],
      styles: ["Contents/styles.xml"],
      relationships: ["Contents/content.hpf"],
      tableCount: 1,
      doctor: {
        score: 97,
        status: "ready",
        counts: { danger: 0, warn: 0, info: 1 },
        issues: [{ id: "partial-table-editing", severity: "info" }],
        repairModes: { auto: 0, manual: 0, blocked: 0, verify: 1 },
      },
      inspector: {
        entryKinds: { manifest: 1, mimetype: 1, section: 1, style: 1 },
        manifestItems: 2,
        missingTargets: 0,
      },
      paragraphs,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${path.relative(root, fixturePath)}`);
console.log(`Wrote ${path.relative(root, expectedPath)}`);

const brokenFixtureName = "openhwp-broken-rel.hwpx";
const brokenFixturePath = path.join(samplesDir, brokenFixtureName);
const brokenExpectedPath = path.join(samplesDir, "openhwp-broken-rel.expected.json");
const brokenEntries = [
  {
    name: "Contents/content.hpf",
    data: `<?xml version="1.0" encoding="UTF-8"?>
<opf:package xmlns:opf="http://www.idpf.org/2007/opf" version="1.0">
  <opf:metadata>
    <opf:title>OpenHWP Studio broken relationship fixture</opf:title>
    <opf:language>ko</opf:language>
  </opf:metadata>
  <opf:manifest>
    <opf:item id="section0" href="section0.xml" media-type="application/xml"/>
    <opf:item id="missingSection" href="missing-section1.xml" media-type="application/xml"/>
    <opf:item id="styles" href="styles.xml" media-type="application/xml"/>
  </opf:manifest>
</opf:package>
`,
  },
  {
    name: "Contents/styles.xml",
    data: entries.find((entry) => entry.name === "Contents/styles.xml").data,
  },
  {
    name: "Contents/section0.xml",
    data: sectionXml,
  },
];

fs.writeFileSync(brokenFixturePath, createZip(brokenEntries));
fs.writeFileSync(
  brokenExpectedPath,
  `${JSON.stringify(
    {
      fixture: brokenFixtureName,
      generatedBy: "scripts/create-sample-hwpx.js",
      entries: brokenEntries.map((entry) => entry.name),
      sections: ["Contents/section0.xml"],
      styles: ["Contents/styles.xml"],
      relationships: ["Contents/content.hpf"],
      tableCount: 1,
      doctor: {
        score: 73,
        status: "review",
        counts: { danger: 0, warn: 2, info: 1 },
        issues: [
          { id: "missing-mimetype", severity: "warn" },
          { id: "missing-relationship-target", severity: "warn" },
          { id: "partial-table-editing", severity: "info" },
        ],
        repairModes: { auto: 1, manual: 1, blocked: 0, verify: 1 },
      },
      inspector: {
        entryKinds: { manifest: 1, section: 1, style: 1 },
        manifestItems: 3,
        missingTargets: 1,
      },
      paragraphs,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${path.relative(root, brokenFixturePath)}`);
console.log(`Wrote ${path.relative(root, brokenExpectedPath)}`);

const mediaFixtureName = "openhwp-media.hwpx";
const mediaFixturePath = path.join(samplesDir, mediaFixtureName);
const mediaExpectedPath = path.join(samplesDir, "openhwp-media.expected.json");
const mediaParagraphs = [
  "OpenHWP Studio media fixture",
  "Section 1 verifies regular paragraph extraction.",
  "The package includes one referenced BinData SVG asset.",
  "Section 2 verifies multi-section ordering.",
  "Image content is preserved but not edited in the app.",
  "Use Package Explorer > Media to audit the reference.",
];
const mediaSection0Xml = `<?xml version="1.0" encoding="UTF-8"?>
<hs:sec xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">
  <hp:p id="m0"><hp:run><hp:t>${mediaParagraphs[0]}</hp:t></hp:run></hp:p>
  <hp:p id="m1"><hp:run><hp:t>${mediaParagraphs[1]}</hp:t></hp:run></hp:p>
  <hp:p id="m2"><hp:run><hp:t>${mediaParagraphs[2]}</hp:t></hp:run></hp:p>
  <hp:pic id="image0" href="../BinData/preview.svg"/>
</hs:sec>
`;
const mediaSection1Xml = `<?xml version="1.0" encoding="UTF-8"?>
<hs:sec xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">
  <hp:p id="m3"><hp:run><hp:t>${mediaParagraphs[3]}</hp:t></hp:run></hp:p>
  <hp:p id="m4"><hp:run><hp:t>${mediaParagraphs[4]}</hp:t></hp:run></hp:p>
  <hp:p id="m5"><hp:run><hp:t>${mediaParagraphs[5]}</hp:t></hp:run></hp:p>
</hs:sec>
`;
const mediaEntries = [
  {
    name: "mimetype",
    data: "application/hwp+zip",
    store: true,
  },
  {
    name: "Contents/content.hpf",
    data: `<?xml version="1.0" encoding="UTF-8"?>
<opf:package xmlns:opf="http://www.idpf.org/2007/opf" version="1.0">
  <opf:metadata>
    <opf:title>OpenHWP Studio media fixture</opf:title>
    <opf:language>ko</opf:language>
  </opf:metadata>
  <opf:manifest>
    <opf:item id="section0" href="section0.xml" media-type="application/xml"/>
    <opf:item id="section1" href="section1.xml" media-type="application/xml"/>
    <opf:item id="styles" href="styles.xml" media-type="application/xml"/>
    <opf:item id="preview" href="../BinData/preview.svg" media-type="image/svg+xml"/>
  </opf:manifest>
</opf:package>
`,
  },
  {
    name: "Contents/styles.xml",
    data: entries.find((entry) => entry.name === "Contents/styles.xml").data,
  },
  {
    name: "Contents/section0.xml",
    data: mediaSection0Xml,
  },
  {
    name: "Contents/section1.xml",
    data: mediaSection1Xml,
  },
  {
    name: "BinData/preview.svg",
    data: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="120" viewBox="0 0 320 120">
  <rect width="320" height="120" rx="12" fill="#f8fafc"/>
  <rect x="18" y="18" width="92" height="84" rx="8" fill="#0f766e"/>
  <circle cx="64" cy="56" r="24" fill="#ffffff" opacity="0.9"/>
  <path d="M130 38h150M130 60h120M130 82h88" stroke="#2563eb" stroke-width="10" stroke-linecap="round"/>
</svg>
`,
  },
];

fs.writeFileSync(mediaFixturePath, createZip(mediaEntries));
fs.writeFileSync(
  mediaExpectedPath,
  `${JSON.stringify(
    {
      fixture: mediaFixtureName,
      generatedBy: "scripts/create-sample-hwpx.js",
      entries: mediaEntries.map((entry) => entry.name),
      sections: ["Contents/section0.xml", "Contents/section1.xml"],
      styles: ["Contents/styles.xml"],
      relationships: ["Contents/content.hpf"],
      tableCount: 0,
      doctor: {
        score: 85,
        status: "review",
        counts: { danger: 0, warn: 1, info: 1 },
        issues: [
          { id: "media-preserved", severity: "info" },
          { id: "unsupported-controls", severity: "warn" },
        ],
        repairModes: { auto: 0, manual: 1, blocked: 0, verify: 1 },
      },
      inspector: {
        entryKinds: { manifest: 1, media: 1, mimetype: 1, section: 2, style: 1 },
        manifestItems: 4,
        missingTargets: 0,
      },
      paragraphs: mediaParagraphs,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${path.relative(root, mediaFixturePath)}`);
console.log(`Wrote ${path.relative(root, mediaExpectedPath)}`);
