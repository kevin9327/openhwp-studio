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
      },
      paragraphs,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${path.relative(root, fixturePath)}`);
console.log(`Wrote ${path.relative(root, expectedPath)}`);
