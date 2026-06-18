const RHWP_URL = "https://cdn.jsdelivr.net/npm/@rhwp/core@0.7.15/+esm";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const state = {
  fileName: "untitled.hwpx",
  sourceFormat: "HWPX",
  originalBytes: null,
  zip: null,
  sectionPaths: [],
  xmlByPath: new Map(),
  blocks: [],
  tableCount: 0,
  rhwp: null,
  lastRenderedBytes: null,
};

const els = {
  fileInput: $("#fileInput"),
  openButton: $("#openButton"),
  emptyOpenButton: $("#emptyOpenButton"),
  newButton: $("#newButton"),
  exportHwpxButton: $("#exportHwpxButton"),
  exportTextButton: $("#exportTextButton"),
  printButton: $("#printButton"),
  dropZone: $("#dropZone"),
  documentSurface: $("#documentSurface"),
  fileNameLabel: $("#fileNameLabel"),
  paraCount: $("#paraCount"),
  charCount: $("#charCount"),
  tableCount: $("#tableCount"),
  pageCount: $("#pageCount"),
  outlineList: $("#outlineList"),
  refreshOutline: $("#refreshOutline"),
  findInput: $("#findInput"),
  replaceInput: $("#replaceInput"),
  replaceButton: $("#replaceButton"),
  searchHits: $("#searchHits"),
  qualityScore: $("#qualityScore"),
  qualityList: $("#qualityList"),
  previewPane: $("#previewPane"),
  renderPreviewButton: $("#renderPreviewButton"),
  templateSelect: $("#templateSelect"),
  insertTableButton: $("#insertTableButton"),
  sourceFormat: $("#sourceFormat"),
  engineStatus: $("#engineStatus"),
  copyMarkdownButton: $("#copyMarkdownButton"),
  copyHtmlButton: $("#copyHtmlButton"),
  downloadJsonButton: $("#downloadJsonButton"),
  downloadHwpButton: $("#downloadHwpButton"),
};

boot();

function boot() {
  els.openButton.addEventListener("click", () => els.fileInput.click());
  els.emptyOpenButton.addEventListener("click", () => els.fileInput.click());
  els.fileInput.addEventListener("change", onFileInput);
  els.newButton.addEventListener("click", createStarterDocument);
  els.exportHwpxButton.addEventListener("click", exportHwpx);
  els.exportTextButton.addEventListener("click", () => downloadText("txt"));
  els.printButton.addEventListener("click", () => window.print());
  els.refreshOutline.addEventListener("click", updateAll);
  els.findInput.addEventListener("input", updateSearch);
  els.replaceButton.addEventListener("click", replaceAll);
  els.renderPreviewButton.addEventListener("click", renderAccuratePreview);
  els.templateSelect.addEventListener("change", applyParagraphTemplate);
  els.insertTableButton.addEventListener("click", insertEditableTable);
  els.copyMarkdownButton.addEventListener("click", () => copyText(toMarkdown()));
  els.copyHtmlButton.addEventListener("click", () => copyText(toHtml()));
  els.downloadJsonButton.addEventListener("click", downloadJson);
  els.downloadHwpButton.addEventListener("click", exportHwpWithRhwp);

  $$(".format-bar [data-command]").forEach((button) => {
    button.addEventListener("click", () => {
      document.execCommand(button.dataset.command, false, null);
      els.documentSurface.focus();
      scheduleUpdate();
    });
  });

  ["dragenter", "dragover"].forEach((name) => {
    window.addEventListener(name, (event) => {
      event.preventDefault();
      els.dropZone.classList.add("dragging");
    });
  });

  ["dragleave", "drop"].forEach((name) => {
    window.addEventListener(name, (event) => {
      event.preventDefault();
      els.dropZone.classList.remove("dragging");
    });
  });

  window.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      loadFile(file).catch((error) => {
        alert(`파일을 열 수 없습니다: ${error.message}`);
      });
    }
  });

  els.documentSurface.addEventListener("input", scheduleUpdate);
  els.previewPane.innerHTML = `<div class="preview-empty">No preview</div>`;

  if (window.lucide) window.lucide.createIcons();
  createStarterDocument();
}

function createId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

async function onFileInput(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    await loadFile(file);
  } catch (error) {
    alert(`파일을 열 수 없습니다: ${error.message}`);
  } finally {
    event.target.value = "";
  }
}

async function loadFile(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  state.fileName = file.name;
  state.sourceFormat = ext === "hwp" ? "HWP" : "HWPX";
  state.originalBytes = bytes;
  state.lastRenderedBytes = bytes;
  state.zip = null;
  state.xmlByPath = new Map();
  state.blocks = [];
  state.tableCount = 0;

  els.fileNameLabel.textContent = file.name;
  els.sourceFormat.textContent = state.sourceFormat;

  if (ext === "hwpx") {
    await loadHwpx(bytes);
  } else if (ext === "hwp") {
    await loadHwpPreviewOnly(bytes);
  } else {
    alert("HWPX 또는 HWP 파일을 선택해 주세요.");
  }
}

async function loadHwpx(bytes) {
  await waitForJsZip();
  const zip = await JSZip.loadAsync(bytes);
  const sectionPaths = Object.keys(zip.files)
    .filter((path) => /^Contents\/section\d+\.xml$/i.test(path))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (!sectionPaths.length) {
    throw new Error("Contents/section*.xml을 찾지 못했습니다.");
  }

  state.zip = zip;
  state.sectionPaths = sectionPaths;
  state.blocks = [];
  state.tableCount = 0;

  for (const path of sectionPaths) {
    const xmlText = await zip.file(path).async("string");
    const xml = new DOMParser().parseFromString(xmlText, "application/xml");
    state.xmlByPath.set(path, xml);
    state.tableCount += xml.getElementsByTagNameNS("*", "tbl").length;
    state.blocks.push(...extractBlocks(path, xml));
  }

  renderBlocks();
  renderAccuratePreview().catch(() => {});
}

async function loadHwpPreviewOnly(bytes) {
  state.blocks = [
    {
      id: createId(),
      path: null,
      paraIndex: 0,
      text: "HWP 바이너리는 정확 미리보기로 열렸습니다. 편집 저장은 HWPX 파일에서 지원합니다.",
      kind: "title",
    },
    {
      id: createId(),
      path: null,
      paraIndex: 1,
      text: "오른쪽 미리보기에서 렌더링을 확인하고, HWPX로 변환이 필요하면 rhwp 엔진 연동 경로를 사용하세요.",
      kind: "normal",
    },
  ];
  renderBlocks();
  await renderAccuratePreview();
}

function extractBlocks(path, xml) {
  const paragraphs = Array.from(xml.getElementsByTagNameNS("*", "p"));
  return paragraphs.map((paragraph, paraIndex) => {
    const text = Array.from(paragraph.getElementsByTagNameNS("*", "t"))
      .map((node) => node.textContent || "")
      .join("");
    return {
      id: createId(),
      path,
      paraIndex,
      text,
      kind: classifyParagraph(text),
    };
  });
}

function classifyParagraph(text) {
  const clean = text.trim();
  if (!clean) return "normal";
  if (clean.length <= 35 && /[제목보고서계획서공문안내]$/.test(clean)) return "title";
  if (/^(수신|참조|제목|일시|장소)\s*[:：]/.test(clean)) return "notice";
  if (/^\d+[\.)]\s+/.test(clean)) return "report";
  return "normal";
}

function renderBlocks() {
  els.dropZone.classList.add("hidden");
  els.documentSurface.classList.add("active");
  els.documentSurface.innerHTML = "";

  const page = document.createElement("section");
  page.className = "paper-page";

  const blocks = state.blocks.length ? state.blocks : [{ id: createId(), text: "", kind: "normal" }];
  for (const block of blocks) {
    const paragraph = document.createElement("div");
    paragraph.className = `paragraph ${block.kind || "normal"}`;
    paragraph.contentEditable = "true";
    paragraph.dataset.id = block.id;
    paragraph.dataset.path = block.path || "";
    paragraph.dataset.paraIndex = String(block.paraIndex ?? "");
    paragraph.textContent = block.text || "";
    page.appendChild(paragraph);
  }

  els.documentSurface.appendChild(page);
  updateAll();
}

function createStarterDocument() {
  state.fileName = "untitled.hwpx";
  state.sourceFormat = "HWPX";
  state.originalBytes = null;
  state.lastRenderedBytes = null;
  state.zip = null;
  state.xmlByPath = new Map();
  state.sectionPaths = [];
  state.tableCount = 0;
  state.blocks = [
    { id: createId(), path: null, paraIndex: 0, text: "새 한글 문서", kind: "title" },
    { id: createId(), path: null, paraIndex: 1, text: "작성일: " + new Date().toLocaleDateString("ko-KR"), kind: "notice" },
    { id: createId(), path: null, paraIndex: 2, text: "1. 핵심 내용", kind: "report" },
    { id: createId(), path: null, paraIndex: 3, text: "본문을 입력하세요.", kind: "normal" },
  ];
  els.fileNameLabel.textContent = state.fileName;
  els.sourceFormat.textContent = state.sourceFormat;
  els.previewPane.innerHTML = `<div class="preview-empty">No preview</div>`;
  renderBlocks();
}

function getEditorParagraphs() {
  return $$(".paragraph").map((node, index) => ({
    node,
    index,
    id: node.dataset.id,
    path: node.dataset.path || null,
    paraIndex: Number(node.dataset.paraIndex),
    text: node.innerText.replace(/\u00a0/g, " "),
    kind: Array.from(node.classList).find((name) => ["title", "notice", "report"].includes(name)) || "normal",
  }));
}

function updateAll() {
  updateStats();
  updateOutline();
  updateQuality();
  updateSearch();
}

let updateTimer = null;
function scheduleUpdate() {
  clearTimeout(updateTimer);
  updateTimer = setTimeout(updateAll, 120);
}

function updateStats() {
  const paragraphs = getEditorParagraphs();
  const text = paragraphs.map((p) => p.text).join("\n");
  els.paraCount.textContent = String(paragraphs.length);
  els.charCount.textContent = String(text.replace(/\s/g, "").length);
  els.tableCount.textContent = String(state.tableCount + $$(".inline-table").length);
}

function updateOutline() {
  const paragraphs = getEditorParagraphs();
  const candidates = paragraphs
    .filter((p) => p.text.trim())
    .filter((p) => p.kind === "title" || p.kind === "report" || p.text.trim().length < 38)
    .slice(0, 24);

  els.outlineList.innerHTML = "";
  if (!candidates.length) {
    els.outlineList.innerHTML = `<div class="small-note">No outline</div>`;
    return;
  }

  for (const item of candidates) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.text.trim();
    button.addEventListener("click", () => item.node.scrollIntoView({ behavior: "smooth", block: "center" }));
    els.outlineList.appendChild(button);
  }
}

function updateQuality() {
  const paragraphs = getEditorParagraphs();
  const text = paragraphs.map((p) => p.text).join("\n");
  const warnings = [];

  if (!paragraphs.some((p) => p.kind === "title" && p.text.trim())) {
    warnings.push(["danger", "문서 제목이 비어 있습니다."]);
  }
  if (paragraphs.some((p) => p.text.length > 220)) {
    warnings.push(["warn", "긴 문단이 있습니다. 180자 안팎으로 나누면 공문 가독성이 좋아집니다."]);
  }
  if ((text.match(/\?/g) || []).length > 4) {
    warnings.push(["warn", "물음표가 많습니다. 확정 문장과 확인 항목을 분리해 보세요."]);
  }
  if (/(합니다|됩니다|드립니다)[.。]?\s*\1/.test(text)) {
    warnings.push(["warn", "반복 어미가 가까이 붙어 있습니다."]);
  }
  if (!warnings.length) {
    warnings.push(["ok", "문서 구조가 안정적입니다."]);
  }

  const score = Math.max(0, 100 - warnings.filter((w) => w[0] !== "ok").length * 18);
  els.qualityScore.textContent = String(score);
  els.qualityList.innerHTML = "";

  for (const [level, message] of warnings) {
    const item = document.createElement("div");
    item.className = `quality-item ${level}`;
    item.innerHTML = `<i></i><span></span>`;
    item.querySelector("span").textContent = message;
    els.qualityList.appendChild(item);
  }
}

function updateSearch() {
  clearSearchMarks();
  const query = els.findInput.value.trim();
  if (!query) {
    els.searchHits.textContent = "0 matches";
    return;
  }

  let hits = 0;
  for (const paragraph of $$(".paragraph")) {
    const text = paragraph.textContent || "";
    if (!text.includes(query)) continue;
    hits += text.split(query).length - 1;
    const parts = text.split(query);
    paragraph.innerHTML = "";
    parts.forEach((part, index) => {
      paragraph.append(document.createTextNode(part));
      if (index < parts.length - 1) {
        const mark = document.createElement("mark");
        mark.className = "search-hit";
        mark.textContent = query;
        paragraph.append(mark);
      }
    });
  }
  els.searchHits.textContent = `${hits} matches`;
}

function clearSearchMarks() {
  $$(".paragraph mark.search-hit").forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
    parent.normalize();
  });
}

function replaceAll() {
  const from = els.findInput.value;
  const to = els.replaceInput.value;
  if (!from) return;
  clearSearchMarks();
  for (const paragraph of $$(".paragraph")) {
    paragraph.textContent = (paragraph.textContent || "").split(from).join(to);
  }
  updateAll();
}

function applyParagraphTemplate() {
  const selection = window.getSelection();
  const node = selection?.anchorNode?.parentElement?.closest?.(".paragraph");
  if (!node) return;
  node.classList.remove("title", "notice", "report", "normal");
  node.classList.add(els.templateSelect.value);
  updateAll();
}

function insertEditableTable() {
  const table = document.createElement("table");
  table.className = "inline-table";
  table.innerHTML = "<tbody><tr><td contenteditable=\"true\">항목</td><td contenteditable=\"true\">내용</td></tr><tr><td contenteditable=\"true\"></td><td contenteditable=\"true\"></td></tr></tbody>";
  const page = $(".paper-page");
  const active = document.activeElement?.closest?.(".paragraph");
  if (active && active.parentElement === page) {
    active.insertAdjacentElement("afterend", table);
  } else {
    page.appendChild(table);
  }
  updateAll();
}

async function exportHwpx() {
  try {
    clearSearchMarks();
    if (state.sourceFormat === "HWP" && !state.zip) {
      alert("HWP 바이너리에서 HWPX로 직접 저장하는 기능은 아직 안전하게 지원하지 않습니다. 원본 HWP 미리보기/변환 또는 텍스트/HTML 내보내기를 사용해 주세요.");
      return;
    }

    if (state.zip && state.xmlByPath.size) {
      if ($$(".inline-table").length) {
        alert("삽입한 표는 현재 HWPX 구조 보존 저장에 포함되지 않습니다. 표까지 보존하려면 HTML/Markdown 내보내기를 사용해 주세요.");
        return;
      }

      const bytes = await generateEditedSourceHwpxBytes();
      const blob = new Blob([bytes], { type: "application/hwpx" });
      downloadBlob(blob, renameExtension(state.fileName, "edited.hwpx"));
      state.lastRenderedBytes = bytes;
      return;
    }

    const bytes = await createRhwpHwpxFromEditor();
    if (!bytes) {
      alert("HWPX 생성 엔진을 불러오지 못했습니다. HTML/TXT 내보내기를 별도로 선택해 주세요.");
      return;
    }
    const blob = new Blob([bytes], { type: "application/hwpx" });
    downloadBlob(blob, renameExtension(state.fileName, "hwpx"));
    state.lastRenderedBytes = bytes;
  } catch (error) {
    alert(`HWPX 저장 실패: ${error.message}`);
  }
}

async function generateEditedSourceHwpxBytes() {
  const paragraphs = getEditorParagraphs().filter((p) => p.path);
  const byPath = new Map();
  for (const item of paragraphs) {
    if (!byPath.has(item.path)) byPath.set(item.path, []);
    byPath.get(item.path).push(item);
  }

  for (const [path, items] of byPath) {
    const xml = state.xmlByPath.get(path);
    const xmlParagraphs = Array.from(xml.getElementsByTagNameNS("*", "p"));
    for (const item of items) {
      const paragraph = xmlParagraphs[item.paraIndex];
      if (!paragraph) continue;
      writeParagraphText(paragraph, item.text);
    }
    state.zip.file(path, new XMLSerializer().serializeToString(xml));
  }

  return state.zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

function writeParagraphText(paragraph, text) {
  const textNodes = Array.from(paragraph.getElementsByTagNameNS("*", "t"));
  if (!textNodes.length) return;
  textNodes[0].textContent = text;
  for (const node of textNodes.slice(1)) node.textContent = "";
}

async function createRhwpHwpxFromEditor() {
  try {
    const rhwp = await loadRhwp();
    const doc = rhwp.HwpDocument.createEmpty();
    doc.createBlankDocument();
    const text = getEditorParagraphs().map((p) => p.text).join("\n");
    doc.insertText(0, 0, 0, text);
    const bytes = doc.exportHwpx();
    doc.free();
    return bytes;
  } catch (error) {
    console.warn(error);
    return null;
  }
}

async function exportHwpWithRhwp() {
  try {
    const rhwp = await loadRhwp();
    let doc;
    if (state.zip && state.xmlByPath.size) {
      const bytes = await generateEditedSourceHwpxBytes();
      state.lastRenderedBytes = bytes;
      doc = new rhwp.HwpDocument(bytes);
    } else if (state.lastRenderedBytes) {
      doc = new rhwp.HwpDocument(state.lastRenderedBytes);
    } else {
      doc = rhwp.HwpDocument.createEmpty();
      doc.createBlankDocument();
      doc.insertText(0, 0, 0, getEditorParagraphs().map((p) => p.text).join("\n"));
    }
    const bytes = doc.exportHwp();
    doc.free();
    downloadBlob(new Blob([bytes], { type: "application/x-hwp" }), renameExtension(state.fileName, "hwp"));
  } catch (error) {
    alert(`HWP 변환 실패: ${error.message}`);
  }
}

async function renderAccuratePreview() {
  if (state.zip && state.xmlByPath.size) {
    state.lastRenderedBytes = await generateEditedSourceHwpxBytes();
  }

  if (!state.lastRenderedBytes && !state.originalBytes) {
    els.previewPane.innerHTML = `<div class="preview-empty">No preview</div>`;
    return;
  }

  try {
    els.engineStatus.textContent = "Loading rhwp";
    const rhwp = await loadRhwp();
    const bytes = state.lastRenderedBytes || state.originalBytes;
    let doc;
    let viewer;
    try {
      doc = new rhwp.HwpDocument(bytes);
      viewer = new rhwp.HwpViewer(doc);
      const pages = viewer.pageCount();
      els.pageCount.textContent = String(pages || "-");
      const svg = pages ? viewer.renderPageSvg(0) : "";
      els.previewPane.innerHTML = svg || `<div class="preview-empty">No page</div>`;
    } finally {
      viewer?.free?.();
      doc?.free?.();
    }
    els.engineStatus.textContent = `rhwp ${rhwp.version()}`;
  } catch (error) {
    els.previewPane.innerHTML = `<div class="preview-empty">${escapeHtml(error.message)}</div>`;
    els.engineStatus.textContent = "HWPX ready";
  }
}

async function loadRhwp() {
  if (state.rhwp) return state.rhwp;
  const rhwp = await import(RHWP_URL);
  await rhwp.default();
  rhwp.init_panic_hook();
  state.rhwp = rhwp;
  return rhwp;
}

async function waitForJsZip() {
  for (let i = 0; i < 50; i += 1) {
    if (window.JSZip) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("JSZip을 불러오지 못했습니다.");
}

function toPlainText() {
  return getEditorParagraphs().map((p) => p.text).join("\n");
}

function toMarkdown() {
  return getEditorParagraphs()
    .map((p) => {
      const text = p.text.trimEnd();
      if (p.kind === "title") return `# ${text}`;
      if (p.kind === "report") return `## ${text}`;
      return text;
    })
    .join("\n\n");
}

function toHtml() {
  const body = getEditorParagraphs()
    .map((p) => `<p class="${p.kind}">${escapeHtml(p.text)}</p>`)
    .join("\n");
  return `<!doctype html><html lang="ko"><meta charset="utf-8"><title>${escapeHtml(state.fileName)}</title><body>${body}</body></html>`;
}

function downloadText(kind) {
  const ext = kind === "html" ? "html" : "txt";
  const content = kind === "html" ? toHtml() : toPlainText();
  downloadBlob(new Blob([content], { type: kind === "html" ? "text/html;charset=utf-8" : "text/plain;charset=utf-8" }), renameExtension(state.fileName, ext));
}

function downloadJson() {
  const data = {
    fileName: state.fileName,
    sourceFormat: state.sourceFormat,
    exportedAt: new Date().toISOString(),
    paragraphs: getEditorParagraphs().map(({ index, text, kind }) => ({ index, kind, text })),
  };
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" }), renameExtension(state.fileName, "json"));
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function renameExtension(name, ext) {
  const clean = name.replace(/\.(hwp|hwpx|txt|html|json)$/i, "");
  if (ext.includes(".")) return `${clean}.${ext}`;
  return `${clean}.${ext}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
