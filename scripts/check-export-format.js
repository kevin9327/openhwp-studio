const exporters = require("../export-format-utils");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const blocks = [
  {
    type: "paragraph",
    paragraph: { kind: "title", text: "OpenHWP Studio 샘플 문서" },
  },
  {
    type: "paragraph",
    paragraph: { kind: "report", text: "1. HWPX 열기와 편집" },
  },
  {
    type: "table",
    rows: [
      {
        cells: [
          { text: "표 항목" },
          { text: "검증 값" },
        ],
      },
      {
        cells: [
          { text: "파이프 | 문자" },
          { text: "여러 줄\n값" },
        ],
      },
    ],
  },
];

const markdown = exporters.blocksToMarkdown(blocks);
assert(markdown.includes("# OpenHWP Studio 샘플 문서"), "Markdown title export failed");
assert(markdown.includes("## 1. HWPX 열기와 편집"), "Markdown report export failed");
assert(markdown.includes("| 표 항목 | 검증 값 |"), "Markdown table header export failed");
assert(markdown.includes("| --- | --- |"), "Markdown table divider export failed");
assert(markdown.includes("| 파이프 \\| 문자 | 여러 줄 값 |"), "Markdown table escaping/normalization failed");

const html = exporters.blocksToHtmlDocument(blocks, "fixture.hwpx");
assert(html.includes("<table><tr><td>표 항목</td><td>검증 값</td></tr>"), "HTML table export failed");
assert(html.includes("<td>파이프 | 문자</td><td>여러 줄\n값</td>"), "HTML cell text export failed");

const text = exporters.blocksToPlainText(blocks);
assert(text.includes("표 항목\t검증 값"), "Plain text table export failed");
assert(text.includes("파이프 | 문자\t여러 줄 값"), "Plain text table normalization failed");

console.log("Export format contract OK");
