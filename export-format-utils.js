(function attachExporters(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.OpenHWPExporters = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createExporters() {
  function blocksToPlainText(blocks) {
    return blocks
      .map((block) => {
        if (block.type === "paragraph") return block.paragraph.text;
        return block.rows.map((row) => row.cells.map((cell) => normalizeTableCell(cell.text)).join("\t")).join("\n");
      })
      .join("\n");
  }

  function blocksToMarkdown(blocks) {
    return blocks
      .map((block) => {
        if (block.type === "table") return tableToMarkdown(block);
        const text = block.paragraph.text.trimEnd();
        if (block.paragraph.kind === "title") return `# ${text}`;
        if (block.paragraph.kind === "report") return `## ${text}`;
        return text;
      })
      .join("\n\n");
  }

  function blocksToHtmlDocument(blocks, title) {
    const body = blocks
      .map((block) => {
        if (block.type === "table") return tableToHtml(block);
        return `<p class="${block.paragraph.kind}">${escapeHtml(block.paragraph.text)}</p>`;
      })
      .join("\n");
    return `<!doctype html><html lang="ko"><meta charset="utf-8"><title>${escapeHtml(title)}</title><body>${body}</body></html>`;
  }

  function tableToMarkdown(block) {
    const rows = block.rows.map((row) => row.cells.map((cell) => normalizeTableCell(cell.text)));
    if (!rows.length) return "";
    const columnCount = Math.max(...rows.map((row) => row.length));
    const normalizedRows = rows.map((row) => [...row, ...Array(Math.max(0, columnCount - row.length)).fill("")]);
    const header = normalizedRows[0];
    const divider = Array(columnCount).fill("---");
    const body = normalizedRows.slice(1);
    return [header, divider, ...body].map((row) => `| ${row.map(escapeMarkdownTableCell).join(" | ")} |`).join("\n");
  }

  function tableToHtml(block) {
    const rows = block.rows
      .map((row) => `<tr>${row.cells.map((cell) => `<td>${escapeHtml(cell.text)}</td>`).join("")}</tr>`)
      .join("");
    return `<table>${rows}</table>`;
  }

  function normalizeTableCell(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function escapeMarkdownTableCell(value) {
    return normalizeTableCell(value).replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  return {
    blocksToHtmlDocument,
    blocksToMarkdown,
    blocksToPlainText,
    tableToHtml,
    tableToMarkdown,
  };
});
