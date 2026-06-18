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
  packageInfo: null,
  lastExportReport: null,
  rhwp: null,
  lastRenderedBytes: null,
  previewPage: 0,
  previewPages: 0,
  previewZoom: 100,
  isDirty: false,
  pendingFileSelection: false,
};

const els = {
  fileInput: $("#fileInput"),
  openButton: $("#openButton"),
  emptyOpenButton: $("#emptyOpenButton"),
  sampleOpenButton: $("#sampleOpenButton"),
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
  compatScore: $("#compatScore"),
  compatList: $("#compatList"),
  packageBadge: $("#packageBadge"),
  packageSummary: $("#packageSummary"),
  previewPane: $("#previewPane"),
  renderPreviewButton: $("#renderPreviewButton"),
  previewPrevButton: $("#previewPrevButton"),
  previewNextButton: $("#previewNextButton"),
  previewPageLabel: $("#previewPageLabel"),
  previewZoomInput: $("#previewZoomInput"),
  previewZoomLabel: $("#previewZoomLabel"),
  templateSelect: $("#templateSelect"),
  insertTableButton: $("#insertTableButton"),
  sourceFormat: $("#sourceFormat"),
  engineStatus: $("#engineStatus"),
  copyMarkdownButton: $("#copyMarkdownButton"),
  copyHtmlButton: $("#copyHtmlButton"),
  downloadJsonButton: $("#downloadJsonButton"),
  downloadReportButton: $("#downloadReportButton"),
  downloadHwpButton: $("#downloadHwpButton"),
};

boot();

function boot() {
  els.openButton.addEventListener("click", openFilePicker);
  els.emptyOpenButton.addEventListener("click", openFilePicker);
  els.fileInput.addEventListener("change", onFileInput);
  els.sampleOpenButton.addEventListener("click", loadSampleDocument);
  els.newButton.addEventListener("click", () => {
    if (confirmDiscardDirty()) createStarterDocument();
  });
  els.exportHwpxButton.addEventListener("click", exportHwpx);
  els.exportTextButton.addEventListener("click", () => downloadText("txt"));
  els.printButton.addEventListener("click", () => window.print());
  els.refreshOutline.addEventListener("click", updateAll);
  els.findInput.addEventListener("input", updateSearch);
  els.replaceButton.addEventListener("click", replaceAll);
  els.renderPreviewButton.addEventListener("click", renderAccuratePreview);
  els.previewPrevButton.addEventListener("click", () => changePreviewPage(-1));
  els.previewNextButton.addEventListener("click", () => changePreviewPage(1));
  els.previewZoomInput.addEventListener("input", () => {
    state.previewZoom = Number(els.previewZoomInput.value) || 100;
    updatePreviewControls();
    applyPreviewZoom();
  });
  els.templateSelect.addEventListener("change", applyParagraphTemplate);
  els.insertTableButton.addEventListener("click", insertEditableTable);
  els.copyMarkdownButton.addEventListener("click", () => copyText(toMarkdown()));
  els.copyHtmlButton.addEventListener("click", () => copyText(toHtml()));
  els.downloadJsonButton.addEventListener("click", downloadJson);
  els.downloadReportButton.addEventListener("click", downloadReport);
  els.downloadHwpButton.addEventListener("click", exportHwpWithRhwp);

  $$(".format-bar [data-command]").forEach((button) => {
    button.addEventListener("click", () => {
      document.execCommand(button.dataset.command, false, null);
      els.documentSurface.focus();
      markDirty();
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
    if (file && confirmDiscardDirty()) {
      loadFile(file).catch((error) => {
        alert(`파일을 열 수 없습니다: ${error.message}`);
      });
    }
  });

  window.addEventListener("beforeunload", (event) => {
    if (!state.isDirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  els.documentSurface.addEventListener("input", () => {
    markDirty();
    scheduleUpdate();
  });
  els.previewPane.innerHTML = `<div class="preview-empty">No preview</div>`;
  updatePreviewControls();

  if (window.lucide) window.lucide.createIcons();
  createStarterDocument();
}

function createId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function markDirty() {
  if (state.isDirty) return;
  state.isDirty = true;
  updateDirtyStatus();
}

function markClean() {
  state.isDirty = false;
  updateDirtyStatus();
}

function updateDirtyStatus() {
  els.fileNameLabel.textContent = `${state.fileName}${state.isDirty ? " (unsaved)" : ""}`;
  document.title = `${state.isDirty ? "* " : ""}OpenHWP Studio`;
}

function confirmDiscardDirty() {
  if (!state.isDirty) return true;
  return window.confirm("저장하지 않은 변경이 있습니다. 현재 문서를 닫고 계속할까요?");
}

function openFilePicker() {
  if (!confirmDiscardDirty()) return;
  state.pendingFileSelection = true;
  els.fileInput.click();
}

async function onFileInput(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!state.pendingFileSelection && !confirmDiscardDirty()) {
    event.target.value = "";
    return;
  }
  try {
    await loadFile(file);
  } catch (error) {
    alert(`파일을 열 수 없습니다: ${error.message}`);
  } finally {
    state.pendingFileSelection = false;
    event.target.value = "";
  }
}

async function loadSampleDocument() {
  if (!confirmDiscardDirty()) return;
  try {
    const response = await fetch("./samples/openhwp-basic.hwpx");
    if (!response.ok) throw new Error(`샘플을 불러오지 못했습니다: HTTP ${response.status}`);
    const bytes = await response.arrayBuffer();
    const file = new File([bytes], "openhwp-basic.hwpx", { type: "application/hwp+zip" });
    await loadFile(file);
  } catch (error) {
    alert(error.message);
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
  state.packageInfo = null;
  state.lastExportReport = null;
  state.previewPage = 0;
  state.previewPages = 0;
  state.isDirty = false;

  els.fileNameLabel.textContent = file.name;
  els.sourceFormat.textContent = state.sourceFormat;
  updateDirtyStatus();
  updatePreviewControls();

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
  state.packageInfo = await inspectHwpxPackage(zip, sectionPaths);
  state.lastExportReport = null;

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
  state.packageInfo = {
    format: "HWP",
    entryCount: 0,
    sections: 0,
    media: [],
    styles: [],
    relationships: [],
    tables: 0,
    controls: { images: 0, footnotes: 0, headers: 0, footers: 0, shapes: 0 },
    warnings: ["HWP binary editing is preview-only in the browser alpha."],
  };
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

async function inspectHwpxPackage(zip, sectionPaths) {
  const entries = Object.keys(zip.files).filter((path) => !zip.files[path].dir);
  const media = entries.filter((path) => /(^BinData\/|^Contents\/media\/|\.(bmp|gif|jpe?g|png|svg|webp|wmf|emf)$)/i.test(path));
  const styles = entries.filter((path) => /(styles?|font|settings|theme|version)\.xml$/i.test(path));
  const relationships = entries.filter((path) => /(\.rels$|manifest\.xml$|content\.hpf$)/i.test(path));
  const controls = { images: 0, footnotes: 0, headers: 0, footers: 0, shapes: 0 };
  let tables = 0;

  for (const path of sectionPaths) {
    const xmlText = await zip.file(path).async("string");
    const xml = new DOMParser().parseFromString(xmlText, "application/xml");
    tables += countLocalNames(xml, ["tbl"]);
    controls.images += countLocalNames(xml, ["pic", "img", "image"]);
    controls.footnotes += countLocalNames(xml, ["footNote", "endNote", "footnote", "endnote"]);
    controls.headers += countLocalNames(xml, ["header"]);
    controls.footers += countLocalNames(xml, ["footer"]);
    controls.shapes += countLocalNames(xml, ["shapeObject", "line", "rect", "ellipse", "arc"]);
  }

  const warnings = [];
  if (!relationships.length) warnings.push("Package relationship metadata was not found.");
  if (media.length) warnings.push("Images/media are preserved in source export but not editable yet.");
  if (tables) warnings.push("Table text is readable, but structural table editing is partial.");
  if (controls.footnotes) warnings.push("Footnotes/endnotes are detected but not editable yet.");
  if (controls.headers || controls.footers) warnings.push("Headers/footers are detected but not editable yet.");
  if (controls.shapes) warnings.push("Drawing objects are detected but not editable yet.");

  return {
    format: "HWPX",
    entryCount: entries.length,
    sections: sectionPaths.length,
    media,
    styles,
    relationships,
    tables,
    controls,
    warnings,
  };
}

function countLocalNames(xml, names) {
  return names.reduce((total, name) => total + xml.getElementsByTagNameNS("*", name).length, 0);
}

function extractBlocks(path, xml) {
  const paragraphs = Array.from(xml.getElementsByTagNameNS("*", "p"));
  const paraIndexByNode = new Map(paragraphs.map((paragraph, index) => [paragraph, index]));
  const seenParagraphs = new Set();
  const blocks = [];

  const visit = (node) => {
    if (!node || node.nodeType !== 1) return;
    if (hasLocalName(node, "tbl")) {
      blocks.push(extractTableBlock(path, node, paraIndexByNode));
      for (const paragraph of Array.from(node.getElementsByTagNameNS("*", "p"))) {
        seenParagraphs.add(paragraph);
      }
      return;
    }
    if (hasLocalName(node, "p")) {
      if (!seenParagraphs.has(node)) {
        blocks.push(createParagraphBlock(path, node, paraIndexByNode.get(node)));
        seenParagraphs.add(node);
      }
      return;
    }
    for (const child of Array.from(node.children || [])) visit(child);
  };

  for (const child of Array.from(xml.documentElement?.children || [])) visit(child);
  for (const paragraph of paragraphs) {
    if (!seenParagraphs.has(paragraph)) {
      blocks.push(createParagraphBlock(path, paragraph, paraIndexByNode.get(paragraph)));
    }
  }
  return blocks;
}

function extractTableBlock(path, table, paraIndexByNode) {
  const rows = directChildrenByLocalName(table, "tr").map((row) => ({
    cells: directChildrenByLocalName(row, "tc").map((cell) => {
      const paragraphs = Array.from(cell.getElementsByTagNameNS("*", "p")).map((paragraph) =>
        createParagraphBlock(path, paragraph, paraIndexByNode.get(paragraph)),
      );
      return { id: createId(), paragraphs };
    }),
  }));

  return {
    type: "table",
    id: createId(),
    path,
    rows,
  };
}

function directChildrenByLocalName(node, localName) {
  const direct = Array.from(node.children || []).filter((child) => hasLocalName(child, localName));
  return direct.length ? direct : Array.from(node.getElementsByTagNameNS("*", localName));
}

function createParagraphBlock(path, paragraph, paraIndex) {
  const text = readParagraphText(paragraph);
  return {
    type: "paragraph",
    id: createId(),
    path,
    paraIndex,
    text,
    kind: classifyParagraph(text),
  };
}

function hasLocalName(node, localName) {
  return String(node.localName || node.nodeName || "").split(":").pop() === localName;
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
    page.appendChild(block.type === "table" ? renderTableBlock(block) : renderParagraphBlock(block));
  }

  els.documentSurface.appendChild(page);
  updateAll();
}

function renderParagraphBlock(block) {
  const paragraph = document.createElement("div");
  paragraph.className = `paragraph ${block.kind || "normal"}`;
  paragraph.contentEditable = "true";
  paragraph.dataset.id = block.id;
  paragraph.dataset.path = block.path || "";
  paragraph.dataset.paraIndex = String(block.paraIndex ?? "");
  paragraph.textContent = block.text || "";
  return paragraph;
}

function renderTableBlock(block) {
  const table = document.createElement("table");
  table.className = "inline-table source-table";
  table.dataset.id = block.id;
  table.dataset.path = block.path || "";
  const tbody = document.createElement("tbody");

  for (const row of block.rows) {
    const tr = document.createElement("tr");
    for (const cell of row.cells) {
      const td = document.createElement("td");
      td.dataset.id = cell.id;
      const paragraphs = cell.paragraphs.length ? cell.paragraphs : [{ id: createId(), text: "", kind: "normal" }];
      for (const paragraph of paragraphs) td.appendChild(renderParagraphBlock(paragraph));
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  return table;
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
  state.packageInfo = null;
  state.lastExportReport = null;
  state.previewPage = 0;
  state.previewPages = 0;
  state.isDirty = false;
  state.blocks = [
    { id: createId(), path: null, paraIndex: 0, text: "새 한글 문서", kind: "title" },
    { id: createId(), path: null, paraIndex: 1, text: "작성일: " + new Date().toLocaleDateString("ko-KR"), kind: "notice" },
    { id: createId(), path: null, paraIndex: 2, text: "1. 핵심 내용", kind: "report" },
    { id: createId(), path: null, paraIndex: 3, text: "본문을 입력하세요.", kind: "normal" },
  ];
  els.fileNameLabel.textContent = state.fileName;
  els.sourceFormat.textContent = state.sourceFormat;
  els.previewPane.innerHTML = `<div class="preview-empty">No preview</div>`;
  updateDirtyStatus();
  updatePreviewControls();
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
  updateCompatibility();
  updatePackageSummary();
  updateSearch();
}

let updateTimer = null;
function scheduleUpdate() {
  clearTimeout(updateTimer);
  updateTimer = setTimeout(updateAll, 120);
}

function changePreviewPage(delta) {
  if (!state.previewPages) return;
  const next = Math.min(Math.max(state.previewPage + delta, 0), state.previewPages - 1);
  if (next === state.previewPage) return;
  state.previewPage = next;
  renderAccuratePreview();
}

function updatePreviewControls() {
  const hasPages = state.previewPages > 0;
  els.previewPageLabel.textContent = hasPages ? `${state.previewPage + 1} / ${state.previewPages}` : "- / -";
  els.previewPrevButton.disabled = !hasPages || state.previewPage <= 0;
  els.previewNextButton.disabled = !hasPages || state.previewPage >= state.previewPages - 1;
  els.previewZoomInput.value = String(state.previewZoom);
  els.previewZoomLabel.textContent = `${state.previewZoom}%`;
}

function applyPreviewZoom() {
  const svg = els.previewPane.querySelector("svg");
  if (!svg) return;
  svg.style.width = `${state.previewZoom}%`;
  svg.style.maxWidth = "none";
}

function updateStats() {
  const paragraphs = getEditorParagraphs();
  const text = paragraphs.map((p) => p.text).join("\n");
  els.paraCount.textContent = String(paragraphs.length);
  els.charCount.textContent = String(text.replace(/\s/g, "").length);
  els.tableCount.textContent = String(state.tableCount + getInsertedTables().length);
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

function updateCompatibility() {
  const info = state.packageInfo;
  const items = [];
  let penalty = 0;

  if (state.sourceFormat === "HWP" && !state.zip) {
    items.push(["warn", "HWP 바이너리는 rhwp 미리보기/변환 경로로 열립니다. 직접 편집 보장은 HWPX보다 낮습니다."]);
    penalty += 25;
  } else if (state.zip && state.xmlByPath.size) {
    items.push(["ok", "HWPX 패키지를 로컬에서 열었고, 원본 ZIP 구조 보존 export 경로를 사용할 수 있습니다."]);
  } else {
    items.push(["ok", "새 HWPX 문서는 rhwp 생성 경로와 텍스트/HTML/Markdown/JSON export를 사용할 수 있습니다."]);
  }

  if (info?.media?.length) {
    items.push(["warn", `미디어 ${info.media.length}개는 보존 대상이지만 앱 안 편집은 아직 지원하지 않습니다.`]);
    penalty += 12;
  }
  if (info?.tables) {
    items.push(["ok", `표 ${info.tables}개를 감지했습니다. 셀 문단 텍스트는 원본 HWPX export 검증 대상입니다.`]);
    penalty += 4;
  }
  if (info?.controls?.footnotes || info?.controls?.headers || info?.controls?.footers) {
    items.push(["warn", "각주/머리말/꼬리말 계열 구조가 있어 export 후 수동 확인이 필요합니다."]);
    penalty += 12;
  }
  if (getInsertedTables().length) {
    items.push(["warn", "브라우저에서 새로 삽입한 HTML 표는 HWPX 원본 구조 export에서 skipped로 보고됩니다."]);
    penalty += 10;
  }
  if (state.lastExportReport) {
    const report = state.lastExportReport;
    if (report.verification?.ok) {
      items.push(["ok", `마지막 HWPX export 검증 통과: ${report.verification.checked}개 문단 라운드트립 확인.`]);
    } else if (report.verification) {
      items.push(["danger", `마지막 HWPX export 검증 실패: ${report.verification.mismatches.length}개 문단 불일치.`]);
      penalty += 35;
    }
    if (report.skipped.length) {
      items.push(["warn", `${report.skipped.length}개 항목을 안전하게 건너뛰고 리포트에 남겼습니다.`]);
      penalty += 8;
    }
  }
  if (items.length === 1) items.push(["ok", "문단 편집, 찾기/바꾸기, 텍스트 계열 export 경로가 준비되어 있습니다."]);

  els.compatScore.textContent = String(Math.max(0, 100 - penalty));
  renderStatusList(els.compatList, items);
}

function updatePackageSummary() {
  const info = state.packageInfo;
  els.packageSummary.innerHTML = "";

  if (!info) {
    els.packageBadge.textContent = "New";
    appendPackageItem("작성 중", "아직 외부 HWPX/HWP 패키지를 열지 않았습니다.", "ok");
    return;
  }

  els.packageBadge.textContent = info.format;
  appendPackageItem("엔트리", `${info.entryCount || 0} files, ${info.sections || 0} section(s)`, "ok");
  if (info.styles?.length) appendPackageItem("스타일", summarizePaths(info.styles), "ok");
  if (info.relationships?.length) appendPackageItem("관계", summarizePaths(info.relationships), "ok");
  if (info.media?.length) appendPackageItem("미디어", summarizePaths(info.media), "warn");
  if (info.tables || info.controls?.images || info.controls?.footnotes || info.controls?.shapes) {
    appendPackageItem(
      "구조",
      `tables ${info.tables || 0}, images ${info.controls?.images || 0}, footnotes ${info.controls?.footnotes || 0}, shapes ${info.controls?.shapes || 0}`,
      "warn",
    );
  }
  for (const warning of info.warnings || []) appendPackageItem("주의", warning, "warn");
}

function renderStatusList(container, items) {
  container.innerHTML = "";
  for (const [level, message] of items) {
    const item = document.createElement("div");
    item.className = `quality-item ${level}`;
    item.innerHTML = `<i></i><span></span>`;
    item.querySelector("span").textContent = message;
    container.appendChild(item);
  }
}

function appendPackageItem(title, detail, level = "ok") {
  const item = document.createElement("div");
  item.className = `package-item ${level}`;
  item.innerHTML = `<i></i><div><strong></strong><span></span></div>`;
  item.querySelector("strong").textContent = title;
  item.querySelector("span").textContent = detail;
  els.packageSummary.appendChild(item);
}

function summarizePaths(paths, limit = 3) {
  const shown = paths.slice(0, limit).join(", ");
  const extra = paths.length > limit ? ` 외 ${paths.length - limit}개` : "";
  return `${shown}${extra}`;
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
  let changed = false;
  for (const paragraph of $$(".paragraph")) {
    const next = (paragraph.textContent || "").split(from).join(to);
    if (next !== paragraph.textContent) changed = true;
    paragraph.textContent = next;
  }
  if (changed) markDirty();
  updateAll();
}

function applyParagraphTemplate() {
  const selection = window.getSelection();
  const node = selection?.anchorNode?.parentElement?.closest?.(".paragraph");
  if (!node) return;
  node.classList.remove("title", "notice", "report", "normal");
  node.classList.add(els.templateSelect.value);
  markDirty();
  updateAll();
}

function insertEditableTable() {
  const table = document.createElement("table");
  table.className = "inline-table inserted-table";
  table.innerHTML = "<tbody><tr><td contenteditable=\"true\">항목</td><td contenteditable=\"true\">내용</td></tr><tr><td contenteditable=\"true\"></td><td contenteditable=\"true\"></td></tr></tbody>";
  const page = $(".paper-page");
  const active = document.activeElement?.closest?.(".paragraph");
  if (active && active.parentElement === page) {
    active.insertAdjacentElement("afterend", table);
  } else {
    page.appendChild(table);
  }
  markDirty();
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
      const { bytes, report } = await generateEditedSourceHwpxBytes({ verify: true, updateReport: true });
      const blob = new Blob([bytes], { type: "application/hwpx" });
      downloadBlob(blob, renameExtension(state.fileName, "edited.hwpx"));
      state.lastRenderedBytes = bytes;
      if (shouldMarkExportClean(report)) markClean();
      updateAll();
      if (report.skipped.length) {
        alert(`HWPX 저장은 완료했지만 ${report.skipped.length}개 항목은 안전하게 건너뛰고 Report에 남겼습니다.`);
      }
      return;
    }

    const bytes = await createRhwpHwpxFromEditor();
    if (!bytes) {
      alert("HWPX 생성 엔진을 불러오지 못했습니다. HTML/TXT 내보내기를 별도로 선택해 주세요.");
      return;
    }
    state.lastExportReport = await createGeneratedExportReport(bytes);
    const blob = new Blob([bytes], { type: "application/hwpx" });
    downloadBlob(blob, renameExtension(state.fileName, "hwpx"));
    state.lastRenderedBytes = bytes;
    if (shouldMarkExportClean(state.lastExportReport)) markClean();
    updateAll();
  } catch (error) {
    alert(`HWPX 저장 실패: ${error.message}`);
  }
}

async function generateEditedSourceHwpxBytes(options = {}) {
  const { verify = false, updateReport = false } = options;
  await waitForJsZip();
  const report = createExportReport("source-preserving-hwpx");
  const paragraphs = getEditorParagraphs().filter((p) => p.path);
  const byPath = new Map();
  for (const item of paragraphs) {
    if (!byPath.has(item.path)) byPath.set(item.path, []);
    byPath.get(item.path).push(item);
  }

  const exportZip = await JSZip.loadAsync(state.originalBytes || (await state.zip.generateAsync({ type: "uint8array" })));
  for (const [path, items] of byPath) {
    const sourceXml = state.xmlByPath.get(path);
    if (!sourceXml) {
      for (const item of items) report.skipped.push({ reason: "missing-section", path, index: item.index, text: item.text });
      continue;
    }
    const xml = new DOMParser().parseFromString(new XMLSerializer().serializeToString(sourceXml), "application/xml");
    const xmlParagraphs = Array.from(xml.getElementsByTagNameNS("*", "p"));
    for (const item of items) {
      const paragraph = xmlParagraphs[item.paraIndex];
      if (!paragraph) {
        report.skipped.push({ reason: "missing-paragraph", path, index: item.index, paraIndex: item.paraIndex, text: item.text });
        continue;
      }
      const runCount = paragraph.getElementsByTagNameNS("*", "t").length;
      if (!writeParagraphText(paragraph, item.text)) {
        report.skipped.push({ reason: "paragraph-has-no-text-node", path, index: item.index, paraIndex: item.paraIndex, text: item.text });
        continue;
      }
      report.applied.push({ path, index: item.index, paraIndex: item.paraIndex, runCount, text: item.text });
    }
    exportZip.file(path, new XMLSerializer().serializeToString(xml));
  }

  for (const [index, table] of getInsertedTables().entries()) {
    report.skipped.push({
      reason: "inserted-html-table-not-hwpx-roundtripped",
      index,
      text: table.textContent.trim(),
    });
  }

  const bytes = await exportZip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  if (verify) report.verification = await verifySourceHwpxExport(bytes, report.applied);
  if (updateReport) state.lastExportReport = report;
  return { bytes, report };
}

function writeParagraphText(paragraph, text) {
  const textNodes = Array.from(paragraph.getElementsByTagNameNS("*", "t"));
  if (!textNodes.length) return false;
  if (textNodes.length === 1) {
    textNodes[0].textContent = text;
    return true;
  }

  let remaining = text;
  const originalLengths = textNodes.map((node) => (node.textContent || "").length);
  textNodes.forEach((node, index) => {
    if (index === textNodes.length - 1) {
      node.textContent = remaining;
      return;
    }
    const length = Math.min(remaining.length, originalLengths[index]);
    node.textContent = remaining.slice(0, length);
    remaining = remaining.slice(length);
  });
  return true;
}

function createExportReport(mode) {
  return {
    mode,
    fileName: state.fileName,
    sourceFormat: state.sourceFormat,
    createdAt: new Date().toISOString(),
    applied: [],
    skipped: [],
    warnings: [...(state.packageInfo?.warnings || [])],
    verification: null,
  };
}

async function createGeneratedExportReport(bytes) {
  const report = createExportReport("generated-hwpx");
  report.applied = getEditorParagraphs().map(({ index, kind, text }) => ({ index, kind, text }));
  for (const [index, table] of getInsertedTables().entries()) {
    report.skipped.push({
      reason: "inserted-html-table-not-rhwp-generated",
      index,
      text: table.textContent.trim(),
    });
  }
  report.verification = await verifyGeneratedHwpxExport(bytes, report.applied);
  return report;
}

async function verifySourceHwpxExport(bytes, applied) {
  const result = { ok: true, checked: 0, mismatches: [] };
  try {
    await waitForJsZip();
    const zip = await JSZip.loadAsync(bytes);
    const xmlCache = new Map();
    for (const item of applied) {
      if (!xmlCache.has(item.path)) {
        const file = zip.file(item.path);
        if (!file) {
          result.mismatches.push({ ...item, actual: null, reason: "missing-section-after-export" });
          continue;
        }
        xmlCache.set(item.path, new DOMParser().parseFromString(await file.async("string"), "application/xml"));
      }
      const xml = xmlCache.get(item.path);
      const paragraph = Array.from(xml.getElementsByTagNameNS("*", "p"))[item.paraIndex];
      const actual = paragraph ? readParagraphText(paragraph) : null;
      result.checked += 1;
      if (normalizeText(actual) !== normalizeText(item.text)) {
        result.mismatches.push({ ...item, actual, reason: "text-mismatch" });
      }
    }
  } catch (error) {
    result.mismatches.push({ reason: "verification-error", message: error.message });
  }
  result.ok = result.mismatches.length === 0;
  return result;
}

async function verifyGeneratedHwpxExport(bytes, expectedItems) {
  const result = { ok: true, checked: 0, mismatches: [] };
  try {
    await waitForJsZip();
    const zip = await JSZip.loadAsync(bytes);
    const sectionPaths = Object.keys(zip.files)
      .filter((path) => /^Contents\/section\d+\.xml$/i.test(path))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const actualTexts = [];
    for (const path of sectionPaths) {
      const xml = new DOMParser().parseFromString(await zip.file(path).async("string"), "application/xml");
      for (const paragraph of Array.from(xml.getElementsByTagNameNS("*", "p"))) {
        actualTexts.push(readParagraphText(paragraph));
      }
    }
    const actualJoined = normalizeText(actualTexts.join("\n"));
    for (const item of expectedItems) {
      if (!normalizeText(item.text)) continue;
      result.checked += 1;
      if (!actualJoined.includes(normalizeText(item.text))) {
        result.mismatches.push({ index: item.index, expected: item.text, reason: "text-not-found-after-export" });
      }
    }
  } catch (error) {
    result.mismatches.push({ reason: "verification-error", message: error.message });
  }
  result.ok = result.mismatches.length === 0;
  return result;
}

function readParagraphText(paragraph) {
  return Array.from(paragraph.getElementsByTagNameNS("*", "t"))
    .map((node) => node.textContent || "")
    .join("");
}

function getInsertedTables() {
  return $$(".inline-table:not(.source-table)");
}

function normalizeText(value) {
  return String(value || "").replace(/\r\n/g, "\n").replace(/\u00a0/g, " ").trim();
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
      const { bytes, report } = await generateEditedSourceHwpxBytes({ verify: true, updateReport: true });
      state.lastRenderedBytes = bytes;
      updateAll();
      if (report.skipped.length) {
        alert(`HWP 변환 전 ${report.skipped.length}개 항목을 안전하게 건너뛰었습니다. Report를 확인하세요.`);
      }
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
    if (!state.lastExportReport || shouldMarkExportClean(state.lastExportReport)) markClean();
  } catch (error) {
    alert(`HWP 변환 실패: ${error.message}`);
  }
}

function shouldMarkExportClean(report) {
  if (!report) return true;
  if (report.skipped.length) return false;
  if (report.verification && !report.verification.ok) return false;
  return true;
}

async function renderAccuratePreview() {
  if (state.zip && state.xmlByPath.size) {
    const { bytes } = await generateEditedSourceHwpxBytes({ verify: false, updateReport: false });
    state.lastRenderedBytes = bytes;
  }

  if (!state.lastRenderedBytes && !state.originalBytes) {
    els.previewPane.innerHTML = `<div class="preview-empty">No preview</div>`;
    state.previewPages = 0;
    state.previewPage = 0;
    updatePreviewControls();
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
      state.previewPages = pages || 0;
      if (state.previewPages) {
        state.previewPage = Math.min(Math.max(state.previewPage, 0), state.previewPages - 1);
      } else {
        state.previewPage = 0;
      }
      els.pageCount.textContent = String(state.previewPages || "-");
      const svg = state.previewPages ? viewer.renderPageSvg(state.previewPage) : "";
      els.previewPane.innerHTML = svg || `<div class="preview-empty">No page</div>`;
      applyPreviewZoom();
      updatePreviewControls();
    } finally {
      viewer?.free?.();
      doc?.free?.();
    }
    els.engineStatus.textContent = `rhwp ${rhwp.version()}`;
  } catch (error) {
    els.previewPane.innerHTML = `<div class="preview-empty">${escapeHtml(error.message)}</div>`;
    state.previewPages = 0;
    state.previewPage = 0;
    updatePreviewControls();
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
    packageInfo: state.packageInfo,
    lastExportReport: state.lastExportReport,
    paragraphs: getEditorParagraphs().map(({ index, text, kind }) => ({ index, kind, text })),
  };
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" }), renameExtension(state.fileName, "json"));
}

function downloadReport() {
  const data = {
    product: "OpenHWP Studio",
    generatedAt: new Date().toISOString(),
    fileName: state.fileName,
    sourceFormat: state.sourceFormat,
    packageInfo: state.packageInfo,
    lastExportReport: state.lastExportReport,
    compatibility: collectCompatibilitySnapshot(),
    document: {
      paragraphs: getEditorParagraphs().map(({ index, text, kind, path, paraIndex }) => ({ index, kind, path, paraIndex, text })),
      insertedHtmlTables: getInsertedTables().map((table, index) => ({ index, text: table.textContent.trim() })),
    },
  };
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" }), renameExtension(state.fileName, "report.json"));
}

function collectCompatibilitySnapshot() {
  return {
    score: els.compatScore.textContent,
    messages: $$("#compatList .quality-item span").map((node) => node.textContent),
  };
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
