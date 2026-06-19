const RHWP_URL = "https://cdn.jsdelivr.net/npm/@rhwp/core@0.7.15/+esm";
const PROJECT_URL = "https://github.com/kevin9327/openhwp-studio";
const DEMO_URL = "https://kevin9327.github.io/openhwp-studio/";
const DEMO_SAMPLE_URL = `${DEMO_URL}?sample=doctor`;
const PROJECT_SHARE_TEXT =
  "OpenHWP Studio: 한컴 설치 없이 브라우저에서 HWPX/HWP 문서를 열고, 검사하고, 고치고, 변환하는 로컬 우선 오픈소스 작업대.";
const KOREAN_LAUNCH_POST = `한컴 설치 없이 브라우저에서 HWPX/HWP 문서를 열고, 검사하고, 고치고, 변환하는 오픈소스 작업대 OpenHWP Studio를 공개했습니다.

- 로컬 우선: 문서를 서버로 올리지 않음
- HWPX 문단/표 셀 편집
- 패키지 닥터: manifest, media, section, repair plan 검사
- broken HWPX 샘플에서 안전한 자동 복구본 다운로드
- 공개 synthetic HWPX fixture 3개와 CI 검증

Demo: ${DEMO_SAMPLE_URL}
GitHub: ${PROJECT_URL}

한국 HWPX 문서 도구가 필요하다고 느꼈다면 star로 신호를 주세요. 공개 가능한 샘플/호환성 리포트도 큰 도움이 됩니다.`;

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
  baselineTexts: new Map(),
  packageInfo: null,
  lastExportReport: null,
  lastRepairReport: null,
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
  mediaSampleButton: $("#mediaSampleButton"),
  diagnosticSampleButton: $("#diagnosticSampleButton"),
  newButton: $("#newButton"),
  exportHwpxButton: $("#exportHwpxButton"),
  exportTextButton: $("#exportTextButton"),
  printButton: $("#printButton"),
  copyLaunchPostButton: $("#copyLaunchPostButton"),
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
  changeCount: $("#changeCount"),
  changeList: $("#changeList"),
  compatScore: $("#compatScore"),
  compatList: $("#compatList"),
  healthScore: $("#healthScore"),
  healthList: $("#healthList"),
  packageBadge: $("#packageBadge"),
  packageSummary: $("#packageSummary"),
  packageViewSelect: $("#packageViewSelect"),
  packageExplorer: $("#packageExplorer"),
  autoRepairButton: $("#autoRepairButton"),
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
  els.mediaSampleButton.addEventListener("click", loadMediaSampleDocument);
  els.diagnosticSampleButton.addEventListener("click", loadDiagnosticSampleDocument);
  els.newButton.addEventListener("click", () => {
    if (confirmDiscardDirty()) createStarterDocument();
  });
  els.exportHwpxButton.addEventListener("click", exportHwpx);
  els.exportTextButton.addEventListener("click", () => downloadText("txt"));
  els.printButton.addEventListener("click", () => window.print());
  els.copyLaunchPostButton.addEventListener("click", copyLaunchPost);
  $$(".share-project-button").forEach((button) => button.addEventListener("click", shareProject));
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
  els.packageViewSelect.addEventListener("change", updatePackageExplorer);
  els.autoRepairButton.addEventListener("click", exportAutoRepairedHwpx);
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
  loadInitialSampleFromQuery();
  exposePublicApi();
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
  if ($(".paper-page")) captureBaselineFromBlocks(getEditorBlocks());
  state.isDirty = false;
  updateDirtyStatus();
}

function updateDirtyStatus() {
  els.fileNameLabel.textContent = `${state.fileName}${state.isDirty ? " (unsaved)" : ""}`;
  document.title = `${state.isDirty ? "* " : ""}OpenHWP Studio`;
}

function exposePublicApi() {
  globalThis.OpenHWPStudio = Object.freeze({
    exportHtml: () => toHtml(),
    exportJson: () => createJsonExportData(),
    exportMarkdown: () => toMarkdown(),
    exportText: () => toPlainText(),
    getBlocks: () => getSerializableBlocks(),
    getChanges: () => getSerializableChanges(),
    getState: () => ({
      fileName: state.fileName,
      sourceFormat: state.sourceFormat,
      isDirty: state.isDirty,
      packageInfo: state.packageInfo,
      packageDoctor: state.packageInfo?.validation || null,
      lastExportReport: state.lastExportReport,
      lastRepairReport: state.lastRepairReport,
    }),
  });
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
  await loadBundledSample("./samples/openhwp-basic.hwpx", "openhwp-basic.hwpx");
}

async function loadMediaSampleDocument() {
  await loadBundledSample("./samples/openhwp-media.hwpx", "openhwp-media.hwpx");
}

async function loadDiagnosticSampleDocument() {
  await loadBundledSample("./samples/openhwp-broken-rel.hwpx", "openhwp-broken-rel.hwpx");
}

function loadInitialSampleFromQuery() {
  const sample = new URLSearchParams(window.location.search).get("sample")?.toLowerCase();
  const loaders = {
    basic: loadSampleDocument,
    media: loadMediaSampleDocument,
    doctor: loadDiagnosticSampleDocument,
    diagnostic: loadDiagnosticSampleDocument,
    repair: loadDiagnosticSampleDocument,
  };
  const loader = loaders[sample];
  if (!sample) return;
  if (!loader) {
    els.engineStatus.textContent = "Unknown sample link";
    return;
  }
  els.engineStatus.textContent = `Loading ${sample} sample`;
  loader().catch((error) => {
    els.engineStatus.textContent = "Sample load failed";
    alert(error.message);
  });
}

async function loadBundledSample(url, fileName) {
  if (!confirmDiscardDirty()) return;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`샘플을 불러오지 못했습니다: HTTP ${response.status}`);
    const bytes = await response.arrayBuffer();
    const file = new File([bytes], fileName, { type: "application/hwp+zip" });
    await loadFile(file);
  } catch (error) {
    alert(error.message);
  }
}

async function shareProject() {
  const text = `${PROJECT_SHARE_TEXT}\n\nDemo: ${DEMO_SAMPLE_URL}\nGitHub: ${PROJECT_URL}`;
  try {
    if (navigator.share) {
      await navigator.share({
        title: "OpenHWP Studio",
        text: PROJECT_SHARE_TEXT,
        url: DEMO_SAMPLE_URL,
      });
      els.engineStatus.textContent = "Share ready";
      return;
    }
    await copyText(text);
    els.engineStatus.textContent = "Share text copied";
  } catch (error) {
    if (error.name === "AbortError") {
      els.engineStatus.textContent = "Share canceled";
      return;
    }
    await copyText(text);
    els.engineStatus.textContent = "Share text copied";
  }
}

async function copyLaunchPost() {
  await copyText(KOREAN_LAUNCH_POST);
  els.engineStatus.textContent = "Launch post copied";
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
  state.baselineTexts = new Map();
  state.packageInfo = null;
  state.lastExportReport = null;
  state.lastRepairReport = null;
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
  state.lastRepairReport = null;

  for (const path of sectionPaths) {
    const xmlText = await zip.file(path).async("string");
    const xml = new DOMParser().parseFromString(xmlText, "application/xml");
    state.xmlByPath.set(path, xml);
    state.tableCount += xml.getElementsByTagNameNS("*", "tbl").length;
    state.blocks.push(...extractBlocks(path, xml));
  }

  captureBaselineFromBlocks(state.blocks);
  renderBlocks();
  renderAccuratePreview().catch(() => {});
}

async function loadHwpPreviewOnly(bytes) {
  state.packageInfo = {
    format: "HWP",
    entryCount: 0,
    entryDetails: [],
    sections: 0,
    media: [],
    mediaDetails: [],
    styles: [],
    relationships: [],
    relationshipDetails: [],
    tables: 0,
    controls: { images: 0, footnotes: 0, headers: 0, footers: 0, shapes: 0 },
    validation: null,
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
  captureBaselineFromBlocks(state.blocks);
  renderBlocks();
  await renderAccuratePreview();
}

async function inspectHwpxPackage(zip, sectionPaths) {
  const entries = Object.keys(zip.files).filter((path) => !zip.files[path].dir);
  const entryDetails = createEntryDetails(zip, entries);
  const media = entries.filter((path) => /(^BinData\/|^Contents\/media\/|\.(bmp|gif|jpe?g|png|svg|webp|wmf|emf)$)/i.test(path));
  const styles = entries.filter((path) => /(styles?|font|settings|theme|version)\.xml$/i.test(path));
  const relationships = entries.filter((path) => /(\.rels$|manifest\.xml$|content\.hpf$)/i.test(path));
  const manifestPaths = entries.filter((path) => /(content\.hpf|manifest\.xml|\.rels)$/i.test(path));
  const manifestTexts = await readPackageTexts(zip, manifestPaths);
  const relationshipDetails = createRelationshipDetails(manifestTexts, entries);
  const controls = { images: 0, footnotes: 0, headers: 0, footers: 0, shapes: 0 };
  let tables = 0;
  let paragraphCount = 0;
  const parseIssues = [];
  const sectionTexts = [];

  for (const path of sectionPaths) {
    const xmlText = await zip.file(path).async("string");
    sectionTexts.push({ path, text: xmlText });
    const xml = parseXml(xmlText);
    const parserError = getXmlParseError(xml);
    if (parserError) parseIssues.push({ path, message: parserError });
    tables += countLocalNames(xml, ["tbl"]);
    paragraphCount += countLocalNames(xml, ["p"]);
    controls.images += countLocalNames(xml, ["pic", "img", "image"]);
    controls.footnotes += countLocalNames(xml, ["footNote", "endNote", "footnote", "endnote"]);
    controls.headers += countLocalNames(xml, ["header"]);
    controls.footers += countLocalNames(xml, ["footer"]);
    controls.shapes += countLocalNames(xml, ["shapeObject", "line", "rect", "ellipse", "arc"]);
  }

  const referenceCorpus = [...sectionTexts.map((item) => item.text), ...manifestTexts.map((item) => item.text)].join("\n");
  const mediaDetails = media.map((path) => createMediaDetail(zip, path, referenceCorpus));
  const validation = createHwpxValidation({
    entries,
    sectionPaths,
    styles,
    relationships,
    relationshipDetails,
    manifestPaths,
    mediaDetails,
    controls,
    tables,
    paragraphCount,
    parseIssues,
  });
  const warnings = validation.issues.filter((issue) => issue.severity !== "info").map((issue) => issue.title);

  return {
    format: "HWPX",
    entryCount: entries.length,
    entryDetails,
    sections: sectionPaths.length,
    media,
    mediaDetails,
    styles,
    relationships,
    relationshipDetails,
    tables,
    controls,
    validation,
    warnings,
  };
}

function parseXml(xmlText) {
  return new DOMParser().parseFromString(xmlText, "application/xml");
}

function getXmlParseError(xml) {
  const parserError = xml.getElementsByTagName("parsererror")[0];
  return parserError?.textContent?.replace(/\s+/g, " ").trim().slice(0, 220) || "";
}

function createEntryDetails(zip, entries) {
  return entries
    .slice()
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((path) => ({
      path,
      kind: classifyPackageEntry(path),
      extension: extensionFromPath(path),
      size: estimateZipEntrySize(zip, path),
    }));
}

function classifyPackageEntry(path) {
  if (/^mimetype$/i.test(path)) return "mimetype";
  if (/^Contents\/section\d+\.xml$/i.test(path)) return "section";
  if (/(content\.hpf|manifest\.xml|\.rels)$/i.test(path)) return "manifest";
  if (/(styles?|font|settings|theme|version)\.xml$/i.test(path)) return "style";
  if (/(^BinData\/|^Contents\/media\/|\.(bmp|gif|jpe?g|png|svg|webp|wmf|emf)$)/i.test(path)) return "media";
  if (/\.xml$/i.test(path)) return "xml";
  return "other";
}

function extensionFromPath(path) {
  const fileName = path.split("/").pop() || "";
  return fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "";
}

async function readPackageTexts(zip, paths) {
  const texts = [];
  for (const path of paths.slice(0, 12)) {
    const file = zip.file(path);
    if (!file) continue;
    try {
      texts.push({ path, text: await file.async("string") });
    } catch {
      texts.push({ path, text: "" });
    }
  }
  return texts;
}

function createRelationshipDetails(manifestTexts, entries) {
  const entrySet = new Set(entries);
  const details = [];

  for (const item of manifestTexts) {
    const xml = parseXml(item.text);
    const parserError = getXmlParseError(xml);
    if (parserError) {
      details.push({
        sourcePath: item.path,
        kind: "parse-error",
        id: "",
        target: "",
        targetPath: "",
        mediaType: "",
        relationType: "",
        exists: false,
        parserError,
      });
      continue;
    }

    for (const node of Array.from(xml.getElementsByTagName("*"))) {
      const localName = String(node.localName || node.nodeName || "").split(":").pop();
      let target = "";
      let kind = "";
      if (localName === "item") {
        target = node.getAttribute("href") || "";
        kind = "manifest-item";
      } else if (localName === "Relationship") {
        target = node.getAttribute("Target") || "";
        kind = "relationship";
      } else if (localName === "file-entry") {
        target = node.getAttribute("full-path") || "";
        kind = "manifest-file";
      }
      if (!target || target === "/") continue;

      const resolved = resolvePackageTarget(item.path, target, kind);
      details.push({
        sourcePath: item.path,
        kind,
        id: node.getAttribute("id") || node.getAttribute("Id") || "",
        target,
        targetPath: resolved.path,
        mediaType: node.getAttribute("media-type") || node.getAttribute("mediaType") || "",
        relationType: node.getAttribute("Type") || "",
        external: resolved.external,
        exists: resolved.external || entrySet.has(resolved.path),
      });
    }
  }

  return details;
}

function resolvePackageTarget(sourcePath, target, kind) {
  const clean = String(target || "").replace(/\\/g, "/").split("#")[0];
  if (/^(https?:|urn:|data:|mailto:)/i.test(clean)) return { path: clean, external: true };
  if (clean.startsWith("/")) return { path: normalizePackagePath("", clean.slice(1)), external: false };
  let base = packageDir(sourcePath);
  if (kind === "relationship" && base.endsWith("/_rels")) base = base.slice(0, -"/_rels".length);
  if (kind === "relationship" && base === "_rels") base = "";
  return { path: normalizePackagePath(base, clean), external: false };
}

function packageDir(path) {
  const parts = String(path || "").replace(/\\/g, "/").split("/");
  parts.pop();
  return parts.join("/");
}

function normalizePackagePath(base, target) {
  const parts = `${base ? `${base}/` : ""}${target}`.split("/");
  const normalized = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") normalized.pop();
    else normalized.push(part);
  }
  return normalized.join("/");
}

function createMediaDetail(zip, path, referenceCorpus) {
  const lowerCorpus = referenceCorpus.toLowerCase();
  const fileName = path.split("/").pop() || path;
  const lowerPath = path.toLowerCase();
  const lowerName = fileName.toLowerCase();
  const extension = lowerName.includes(".") ? lowerName.split(".").pop() : "bin";
  return {
    path,
    fileName,
    extension,
    size: estimateZipEntrySize(zip, path),
    referenced: lowerCorpus.includes(lowerPath) || lowerCorpus.includes(lowerName),
  };
}

function estimateZipEntrySize(zip, path) {
  const rawSize = zip.file(path)?._data?.uncompressedSize ?? zip.file(path)?._data?.compressedSize;
  return Number.isFinite(rawSize) ? rawSize : null;
}

function createHwpxValidation(input) {
  const {
    entries,
    sectionPaths,
    styles,
    relationships,
    relationshipDetails,
    manifestPaths,
    mediaDetails,
    controls,
    tables,
    paragraphCount,
    parseIssues,
  } = input;
  const issues = [];
  const hasEntry = (pattern) => entries.some((path) => pattern.test(path));
  const addIssue = (severity, id, title, detail, action, repair = {}) => {
    issues.push({ severity, id, title, detail, action, repair: createRepairAction(id, repair) });
  };

  if (!hasEntry(/^mimetype$/i)) {
    addIssue("warn", "missing-mimetype", "mimetype entry is missing", "Some strict HWPX readers expect a package mimetype entry.", "Add mimetype when regenerating the package.", {
      mode: "auto",
      title: "Add package mimetype",
      preview: "A safe repair can add a root mimetype entry with application/hwp+zip while preserving existing entries.",
    });
  }
  if (!manifestPaths.length) {
    addIssue("warn", "missing-manifest", "Package manifest is missing", "No content.hpf, manifest.xml, or .rels metadata was found.", "Open and resave in a full HWPX editor or regenerate the package manifest.", {
      mode: "manual",
      title: "Regenerate manifest metadata",
      preview: "Manifest repair needs document intent and should be regenerated by a full editor or a future builder flow.",
    });
  }
  if (!sectionPaths.length) {
    addIssue("danger", "missing-sections", "No HWPX sections found", "The package has no Contents/section*.xml file.", "Recover or regenerate the section XML before editing.", {
      mode: "blocked",
      title: "Recover section XML",
      preview: "No editable document body was found. Automatic text repair is blocked until a section XML file is recovered.",
    });
  }
  if (!styles.length) {
    addIssue("warn", "missing-styles", "Style metadata is missing", "styles.xml or equivalent style metadata was not found.", "Keep a source backup and verify layout after export.", {
      mode: "manual",
      title: "Review style fallback",
      preview: "Text may be editable, but layout fidelity needs style metadata or a full-editor resave.",
    });
  }
  if (!relationships.length) {
    addIssue("warn", "missing-relationships", "Relationship metadata is missing", "The package has no relationship metadata entry.", "Regenerate relationship metadata before strict distribution.", {
      mode: "manual",
      title: "Regenerate relationship metadata",
      preview: "Relationship metadata can affect strict readers. Review package contents before distribution.",
    });
  }
  if (parseIssues.length) {
    addIssue("danger", "xml-parse-error", "Section XML parse error", `${parseIssues.length} section file(s) failed XML parsing.`, "Repair XML before source-preserving export.", {
      mode: "blocked",
      title: "Repair invalid XML",
      preview: parseIssues.map((item) => `${item.path}: ${item.message}`).join(" | "),
    });
  }
  const missingTargets = relationshipDetails.filter((item) => !item.external && !item.exists);
  if (missingTargets.length) {
    addIssue("warn", "missing-relationship-target", "Manifest target is missing", `${missingTargets.length} manifest or relationship target(s) are not present in the package.`, "Open Package Explorer > Manifest and repair or remove missing targets.", {
      mode: "manual",
      title: "Remove or restore missing targets",
      preview: missingTargets.map((item) => `${item.sourcePath} -> ${item.targetPath || item.target}`).join(" | "),
      targets: missingTargets.map(({ sourcePath, targetPath, target }) => ({ sourcePath, targetPath, target })),
    });
  }
  if (!paragraphCount) {
    addIssue("warn", "empty-text", "No editable paragraph text found", "The document may be image-only, control-heavy, or damaged.", "Use accurate preview and package report before editing.", {
      mode: "manual",
      title: "Inspect image/control-only content",
      preview: "No paragraph text nodes were found. Use preview and package explorer before editing.",
    });
  }

  const orphanMedia = mediaDetails.filter((item) => !item.referenced);
  if (orphanMedia.length) {
    addIssue("warn", "orphan-media", "Unreferenced media detected", `${orphanMedia.length} media file(s) were not referenced by visible XML or manifest text.`, "Check BinData/manifest references before publishing.", {
      mode: "manual",
      title: "Review unreferenced media",
      preview: orphanMedia.map((item) => item.path).join(" | "),
    });
  }
  if (mediaDetails.length) {
    addIssue("info", "media-preserved", "Media is preserved, not edited", `${mediaDetails.length} media file(s) will stay in source-preserving export.`, "Use the package report to verify each asset path.", {
      mode: "verify",
      title: "Verify preserved media",
      preview: "Source-preserving export keeps media entries in the package; editing is not modeled yet.",
    });
  }
  if (tables) {
    addIssue("info", "partial-table-editing", "Table structure editing is partial", `${tables} table(s) were detected. Cell text is editable and verified.`, "For merged cells or geometry changes, verify in Hancom Office after export.", {
      mode: "verify",
      title: "Verify table geometry",
      preview: "Cell paragraph text is round-trip checked; merged cells and geometry still need visual verification.",
    });
  }
  if (controls.images || controls.footnotes || controls.headers || controls.footers || controls.shapes) {
    addIssue(
      "warn",
      "unsupported-controls",
      "Advanced controls need review",
      `images ${controls.images}, footnotes ${controls.footnotes}, headers ${controls.headers}, footers ${controls.footers}, shapes ${controls.shapes}`,
      "Source export preserves these structures, but app-side editing is limited.",
      {
        mode: "manual",
        title: "Review advanced controls",
        preview: "Source export preserves advanced controls, but direct editing is limited in the browser workspace.",
      },
    );
  }
  if (entries.some((path) => path.includes("..") || path.includes("\\"))) {
    addIssue("danger", "unsafe-entry-path", "Unsafe ZIP entry path", "One or more package entries contain traversal-like path segments.", "Do not distribute this package until paths are normalized.", {
      mode: "blocked",
      title: "Normalize unsafe package paths",
      preview: "Unsafe paths can escape package boundaries. Treat the file as unsafe until rebuilt.",
    });
  }
  if (entries.length > 300) {
    addIssue("info", "large-package", "Large package", `${entries.length} files were found in the package.`, "Use report export for audit trails on large documents.", {
      mode: "verify",
      title: "Use report audit",
      preview: "Large packages should be audited with Report JSON before distribution.",
    });
  }

  const penalty = issues.reduce((total, issue) => total + ({ danger: 30, warn: 12, info: 3 }[issue.severity] || 0), 0);
  const score = Math.max(0, 100 - penalty);
  return {
    score,
    status: score >= 90 ? "ready" : score >= 70 ? "review" : "risky",
    issueCount: issues.length,
    counts: {
      danger: issues.filter((issue) => issue.severity === "danger").length,
      warn: issues.filter((issue) => issue.severity === "warn").length,
      info: issues.filter((issue) => issue.severity === "info").length,
    },
    issues,
    repairPlan: issues.map(({ severity, id, title, detail, action, repair }) => ({ severity, id, title, detail, action, ...repair })),
  };
}

function createRepairAction(id, repair) {
  return {
    id,
    mode: repair.mode || "manual",
    title: repair.title || "Review issue",
    preview: repair.preview || repair.action || "",
    targets: repair.targets || [],
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

function captureBaselineFromBlocks(blocks) {
  state.baselineTexts = new Map();
  for (const paragraph of flattenBlockParagraphs(blocks)) {
    state.baselineTexts.set(paragraphKey(paragraph), paragraph.text || "");
  }
}

function flattenBlockParagraphs(blocks) {
  return blocks.flatMap((block) => {
    if (block.type === "table") {
      return block.rows.flatMap((row) => row.cells.flatMap((cell) => cell.paragraphs));
    }
    if (block.type === "paragraph" && block.paragraph) return [block.paragraph];
    return [block];
  });
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
  state.baselineTexts = new Map();
  state.packageInfo = null;
  state.lastExportReport = null;
  state.lastRepairReport = null;
  state.previewPage = 0;
  state.previewPages = 0;
  state.isDirty = false;
  state.blocks = [
    { id: createId(), path: null, paraIndex: 0, text: "새 한글 문서", kind: "title" },
    { id: createId(), path: null, paraIndex: 1, text: "작성일: " + new Date().toLocaleDateString("ko-KR"), kind: "notice" },
    { id: createId(), path: null, paraIndex: 2, text: "1. 핵심 내용", kind: "report" },
    { id: createId(), path: null, paraIndex: 3, text: "본문을 입력하세요.", kind: "normal" },
  ];
  captureBaselineFromBlocks(state.blocks);
  els.fileNameLabel.textContent = state.fileName;
  els.sourceFormat.textContent = state.sourceFormat;
  els.previewPane.innerHTML = `<div class="preview-empty">No preview</div>`;
  updateDirtyStatus();
  updatePreviewControls();
  renderBlocks();
}

function getEditorParagraphs() {
  return getEditorBlocks().flatMap((block) => {
    if (block.type === "paragraph") return [block.paragraph];
    return block.rows.flatMap((row) => row.cells.flatMap((cell) => cell.paragraphs));
  }).map((paragraph, index) => ({ ...paragraph, index }));
}

function getEditorBlocks() {
  const page = $(".paper-page");
  if (!page) return [];
  const blocks = [];

  for (const node of Array.from(page.children)) {
    if (node.matches?.("table.inline-table")) {
      blocks.push(readTableBlockFromDom(node));
    } else if (node.matches?.(".paragraph")) {
      blocks.push({ type: "paragraph", paragraph: readParagraphFromDom(node) });
    }
  }

  return blocks;
}

function readTableBlockFromDom(table) {
  return {
    type: "table",
    id: table.dataset.id || "",
    source: table.classList.contains("source-table") ? "source" : "inserted",
    path: table.dataset.path || null,
    rows: Array.from(table.rows).map((row) => ({
      cells: Array.from(row.cells).map((cell) => ({
        id: cell.dataset.id || "",
        paragraphs: Array.from(cell.querySelectorAll(".paragraph")).map(readParagraphFromDom),
        text: cell.innerText.replace(/\u00a0/g, " ").trim(),
      })),
    })),
  };
}

function readParagraphFromDom(node) {
  const table = node.closest("table.inline-table");
  return {
    node,
    id: node.dataset.id,
    path: node.dataset.path || null,
    paraIndex: Number(node.dataset.paraIndex),
    text: node.innerText.replace(/\u00a0/g, " "),
    kind: Array.from(node.classList).find((name) => ["title", "notice", "report"].includes(name)) || "normal",
    inTable: !!table,
    tableSource: table?.classList.contains("source-table") ? "source" : table ? "inserted" : null,
  };
}

function updateAll() {
  updateStats();
  updateOutline();
  updateQuality();
  updateChanges();
  updateCompatibility();
  updateHealth();
  updatePackageSummary();
  updatePackageExplorer();
  updateAutoRepairButton();
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

function updateChanges() {
  const changes = collectChanges();
  els.changeCount.textContent = String(changes.length);
  els.changeList.innerHTML = "";

  if (!changes.length) {
    els.changeList.innerHTML = `<div class="small-note">No changes</div>`;
    return;
  }

  for (const change of changes.slice(0, 12)) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "change-item";
    item.innerHTML = `<strong></strong><span></span>`;
    item.querySelector("strong").textContent = change.label;
    item.querySelector("span").textContent = summarizeChange(change);
    item.addEventListener("click", () => change.node?.scrollIntoView({ behavior: "smooth", block: "center" }));
    els.changeList.appendChild(item);
  }

  if (changes.length > 12) {
    const rest = document.createElement("div");
    rest.className = "small-note";
    rest.textContent = `+${changes.length - 12} more changes`;
    els.changeList.appendChild(rest);
  }
}

function collectChanges() {
  const changes = [];
  const seen = new Set();
  for (const paragraph of getEditorParagraphs()) {
    const key = paragraphKey(paragraph);
    seen.add(key);
    const before = state.baselineTexts.get(key);
    const after = paragraph.text || "";
    if (before === undefined && normalizeText(after)) {
      changes.push({ type: "added", key, before: "", after, label: changeLabel(paragraph, "Added"), ...paragraph });
    } else if (before !== undefined && before !== after) {
      changes.push({ type: "modified", key, before, after, label: changeLabel(paragraph, "Changed"), ...paragraph });
    }
  }

  for (const [key, before] of state.baselineTexts.entries()) {
    if (!seen.has(key) && normalizeText(before)) {
      changes.push({ type: "deleted", key, before, after: "", text: "", kind: "normal", inTable: false, label: "Deleted paragraph" });
    }
  }
  return changes;
}

function changeLabel(paragraph, prefix) {
  const target = paragraph.inTable ? "table cell" : "paragraph";
  const index = Number.isFinite(Number(paragraph.paraIndex)) ? ` ${paragraph.paraIndex}` : "";
  return `${prefix} ${target}${index}`;
}

function paragraphKey(paragraph) {
  if (paragraph.path && Number.isFinite(Number(paragraph.paraIndex))) return `${paragraph.path}#${paragraph.paraIndex}`;
  return `id:${paragraph.id || paragraph.index || ""}`;
}

function summarizeChange(change) {
  const before = normalizeText(change.before);
  const after = normalizeText(change.after);
  if (change.type === "added") return after.slice(0, 80);
  if (change.type === "deleted") return before.slice(0, 80);
  return `${before.slice(0, 42)} -> ${after.slice(0, 42)}`;
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

  if (info?.validation?.counts?.danger) {
    items.push(["danger", `패키지 닥터가 치명 이슈 ${info.validation.counts.danger}개를 찾았습니다. Report의 repairPlan을 먼저 확인하세요.`]);
    penalty += 25;
  } else if (info?.validation?.counts?.warn) {
    items.push(["warn", `패키지 닥터가 주의 이슈 ${info.validation.counts.warn}개를 찾았습니다. 원본 보존 export 전 확인이 필요합니다.`]);
    penalty += 8;
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

function updateHealth() {
  const validation = state.packageInfo?.validation;
  if (!validation) {
    els.healthScore.textContent = state.sourceFormat === "HWP" ? "HWP" : "-";
    renderStatusList(els.healthList, [
      state.sourceFormat === "HWP"
        ? ["warn", "HWP binary files use preview/conversion checks. Full package doctor runs on HWPX."]
        : ["ok", "Open an HWPX file to run package validation."],
    ]);
    return;
  }

  els.healthScore.textContent = String(validation.score);
  const items = validation.issues.slice(0, 8).map((issue) => [issue.severity, `${issue.title}: ${issue.action}`]);
  if (!items.length) items.push(["ok", "Package structure looks healthy for source-preserving HWPX editing."]);
  renderStatusList(els.healthList, items);
  if (validation.issues.length > items.length) {
    const rest = document.createElement("div");
    rest.className = "small-note";
    rest.textContent = `+${validation.issues.length - items.length} more doctor notes`;
    els.healthList.appendChild(rest);
  }
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
  if (info.validation) {
    appendPackageItem(
      "검증",
      `score ${info.validation.score}, danger ${info.validation.counts.danger}, warn ${info.validation.counts.warn}, info ${info.validation.counts.info}`,
      info.validation.counts.danger ? "danger" : info.validation.counts.warn ? "warn" : "ok",
    );
  }
  if (info.styles?.length) appendPackageItem("스타일", summarizePaths(info.styles), "ok");
  if (info.relationships?.length) appendPackageItem("관계", summarizePaths(info.relationships), "ok");
  if (info.mediaDetails?.length) appendPackageItem("미디어", summarizeMediaDetails(info.mediaDetails), "warn");
  else if (info.media?.length) appendPackageItem("미디어", summarizePaths(info.media), "warn");
  if (info.tables || info.controls?.images || info.controls?.footnotes || info.controls?.shapes) {
    appendPackageItem(
      "구조",
      `tables ${info.tables || 0}, images ${info.controls?.images || 0}, footnotes ${info.controls?.footnotes || 0}, shapes ${info.controls?.shapes || 0}`,
      "warn",
    );
  }
  for (const warning of info.warnings || []) appendPackageItem("주의", warning, "warn");
  if (state.lastRepairReport) {
    appendPackageItem(
      "자동 수리",
      `${state.lastRepairReport.verification?.ok ? "verified" : "needs review"}, applied ${state.lastRepairReport.applied.length}, skipped ${state.lastRepairReport.skipped.length}`,
      state.lastRepairReport.verification?.ok ? "ok" : "warn",
    );
  }
}

function updatePackageExplorer() {
  const info = state.packageInfo;
  els.packageExplorer.innerHTML = "";

  if (!info) {
    els.packageViewSelect.disabled = true;
    els.packageExplorer.innerHTML = `<div class="small-note">No package loaded</div>`;
    return;
  }

  els.packageViewSelect.disabled = false;
  const rows = getPackageExplorerRows(info, els.packageViewSelect.value);
  if (!rows.length) {
    els.packageExplorer.innerHTML = `<div class="small-note">No items in this view</div>`;
    return;
  }

  const limit = 40;
  for (const row of rows.slice(0, limit)) {
    const item = document.createElement("div");
    item.className = `explorer-row ${row.level || "ok"}`;
    item.innerHTML = `<i></i><div><strong></strong><span></span></div>`;
    item.querySelector("strong").textContent = row.title;
    item.querySelector("span").textContent = row.detail;
    els.packageExplorer.appendChild(item);
  }

  if (rows.length > limit) {
    const rest = document.createElement("div");
    rest.className = "small-note";
    rest.textContent = `+${rows.length - limit} more package items`;
    els.packageExplorer.appendChild(rest);
  }
}

function updateAutoRepairButton() {
  const autoItems = getAutoRepairItems();
  const canRepair = !!state.zip && autoItems.length > 0;
  els.autoRepairButton.disabled = !canRepair;
  els.autoRepairButton.title = canRepair ? `${autoItems.length} automatic repair(s) available` : "No safe automatic repair available";
}

function getAutoRepairItems() {
  return (state.packageInfo?.validation?.repairPlan || []).filter((item) => item.mode === "auto");
}

function getPackageExplorerRows(info, view) {
  if (view === "manifest") {
    return (info.relationshipDetails || []).map((item) => ({
      level: item.exists ? "ok" : "danger",
      title: item.id || item.target || item.kind,
      detail: `${item.sourcePath} -> ${item.targetPath || item.target}${item.mediaType ? ` (${item.mediaType})` : ""}${item.external ? " external" : item.exists ? "" : " missing"}`,
    }));
  }

  if (view === "media") {
    return (info.mediaDetails || []).map((item) => ({
      level: item.referenced ? "ok" : "warn",
      title: item.fileName,
      detail: `${item.path}${item.size ? `, ${formatBytes(item.size)}` : ""}, ${item.extension || "bin"}, ${item.referenced ? "referenced" : "unreferenced"}`,
    }));
  }

  if (view === "issues") {
    return (info.validation?.issues || []).map((issue) => ({
      level: issue.severity,
      title: issue.title,
      detail: `${issue.id}${issue.repair?.mode ? `, ${issue.repair.mode}` : ""}: ${issue.action || issue.detail || ""}`,
    }));
  }

  if (view === "repair") {
    return (info.validation?.repairPlan || []).map((item) => ({
      level: item.mode === "blocked" ? "danger" : item.mode === "auto" ? "ok" : item.severity,
      title: `${repairModeLabel(item.mode)}: ${item.title}`,
      detail: `${item.id}: ${item.preview || item.action || item.detail || ""}`,
    }));
  }

  return (info.entryDetails || []).map((item) => ({
    level: item.kind === "media" ? "warn" : "ok",
    title: item.path,
    detail: `${item.kind}${item.extension ? `, .${item.extension}` : ""}${item.size ? `, ${formatBytes(item.size)}` : ""}`,
  }));
}

function repairModeLabel(mode) {
  if (mode === "auto") return "Auto";
  if (mode === "blocked") return "Blocked";
  if (mode === "verify") return "Verify";
  return "Manual";
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

function summarizeMediaDetails(mediaDetails, limit = 3) {
  const shown = mediaDetails
    .slice(0, limit)
    .map((item) => `${item.fileName}${item.size ? ` ${formatBytes(item.size)}` : ""}${item.referenced ? "" : " unreferenced"}`)
    .join(", ");
  const extra = mediaDetails.length > limit ? ` 외 ${mediaDetails.length - limit}개` : "";
  return `${shown}${extra}`;
}

function formatBytes(value) {
  if (!Number.isFinite(value)) return "";
  if (value < 1024) return `${value}B`;
  if (value < 1024 * 1024) return `${Math.round(value / 102.4) / 10}KB`;
  return `${Math.round(value / 104857.6) / 10}MB`;
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
    packageValidation: state.packageInfo?.validation || null,
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
  const result = { ok: true, checked: 0, mismatches: [], package: null };
  try {
    await waitForJsZip();
    const zip = await JSZip.loadAsync(bytes);
    result.package = comparePackageEntries(zip);
    if (!result.package.preserved) {
      result.mismatches.push({
        reason: "package-entry-mismatch",
        missingEntries: result.package.missingEntries,
        addedEntries: result.package.addedEntries,
      });
    }
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

function comparePackageEntries(exportedZip) {
  const originalEntries = state.zip
    ? Object.keys(state.zip.files).filter((path) => !state.zip.files[path].dir).sort()
    : [];
  const exportedEntries = Object.keys(exportedZip.files).filter((path) => !exportedZip.files[path].dir).sort();
  const exportedSet = new Set(exportedEntries);
  const originalSet = new Set(originalEntries);
  const missingEntries = originalEntries.filter((path) => !exportedSet.has(path));
  const addedEntries = exportedEntries.filter((path) => originalEntries.length && !originalSet.has(path));
  return {
    originalEntryCount: originalEntries.length,
    exportedEntryCount: exportedEntries.length,
    preserved: missingEntries.length === 0 && addedEntries.length === 0,
    missingEntries,
    addedEntries,
  };
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

async function exportAutoRepairedHwpx() {
  try {
    const autoItems = getAutoRepairItems();
    if (!state.zip || !autoItems.length) {
      alert("No safe automatic HWPX repair is available for this package.");
      return;
    }

    els.engineStatus.textContent = "Repairing HWPX";
    const { bytes, report } = await generateAutoRepairedHwpxBytes(autoItems);
    state.lastRepairReport = report;
    downloadBlob(new Blob([bytes], { type: "application/hwp+zip" }), renameExtension(state.fileName, "repaired.hwpx"));
    els.engineStatus.textContent = report.verification?.ok ? "Repair ready" : "Repair needs review";
    updateAll();
  } catch (error) {
    alert(`HWPX repair failed: ${error.message}`);
  }
}

async function generateAutoRepairedHwpxBytes(autoItems) {
  await waitForJsZip();
  const sourceZip = await JSZip.loadAsync(state.originalBytes || (await state.zip.generateAsync({ type: "uint8array" })));
  let repairZip = sourceZip;
  const report = createRepairReport(autoItems);

  for (const item of autoItems) {
    if (item.id === "missing-mimetype") {
      if (repairZip.file("mimetype")) {
        report.skipped.push({ id: item.id, reason: "already-present", path: "mimetype" });
      } else {
        repairZip = await cloneZipWithRootMimetype(sourceZip);
        report.applied.push({ id: item.id, path: "mimetype", value: "application/hwp+zip" });
      }
      continue;
    }
    report.skipped.push({ id: item.id, reason: "unsupported-auto-repair" });
  }

  const bytes = await repairZip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  report.verification = await verifyAutoRepair(bytes, report.applied);
  return { bytes, report };
}

async function cloneZipWithRootMimetype(sourceZip) {
  const repairedZip = new JSZip();
  repairedZip.file("mimetype", "application/hwp+zip", { compression: "STORE" });
  for (const path of Object.keys(sourceZip.files)) {
    const sourceEntry = sourceZip.files[path];
    if (sourceEntry.dir) {
      repairedZip.folder(path.replace(/\/$/, ""));
      continue;
    }
    const data = await sourceEntry.async("uint8array");
    repairedZip.file(path, data, { binary: true, date: sourceEntry.date || new Date(0) });
  }
  return repairedZip;
}

function createRepairReport(autoItems) {
  return {
    mode: "auto-repair-hwpx",
    fileName: state.fileName,
    sourceFormat: state.sourceFormat,
    createdAt: new Date().toISOString(),
    requested: autoItems.map(({ id, title, mode, preview }) => ({ id, title, mode, preview })),
    applied: [],
    skipped: [],
    verification: null,
  };
}

async function verifyAutoRepair(bytes, applied) {
  const result = { ok: true, checks: [], mismatches: [], package: null };
  try {
    await waitForJsZip();
    const repairedZip = await JSZip.loadAsync(bytes);
    const headers = inspectZipEntryHeaders(bytes);
    result.package = compareRepairPackageEntries(repairedZip, applied);
    if (!result.package.preservedOriginalEntries) {
      result.mismatches.push({ reason: "original-entry-missing", missingEntries: result.package.missingOriginalEntries });
    }
    if (result.package.unexpectedAddedEntries.length) {
      result.mismatches.push({ reason: "unexpected-added-entry", addedEntries: result.package.unexpectedAddedEntries });
    }

    for (const item of applied) {
      if (item.id !== "missing-mimetype") continue;
      const file = repairedZip.file("mimetype");
      const value = file ? await file.async("string") : "";
      const ok = value === "application/hwp+zip";
      result.checks.push({ id: item.id, path: "mimetype", ok });
      if (!ok) result.mismatches.push({ id: item.id, path: "mimetype", expected: "application/hwp+zip", actual: value || null });

      const header = headers.find((entry) => entry.name === "mimetype");
      const isFirst = headers[0]?.name === "mimetype";
      const isStored = header?.method === 0;
      result.checks.push({ id: "mimetype-first-entry", path: "mimetype", ok: isFirst });
      result.checks.push({ id: "mimetype-store-compression", path: "mimetype", ok: isStored });
      if (!isFirst) result.mismatches.push({ id: "mimetype-first-entry", expected: "first local ZIP entry", actual: headers[0]?.name || null });
      if (!isStored) result.mismatches.push({ id: "mimetype-store-compression", expected: "STORE", actual: header ? `method-${header.method}` : null });
    }
  } catch (error) {
    result.mismatches.push({ reason: "repair-verification-error", message: error.message });
  }
  result.ok = result.mismatches.length === 0;
  return result;
}

function inspectZipEntryHeaders(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const decoder = new TextDecoder();
  const entries = [];
  let offset = 0;
  while (offset + 30 <= data.length && view.getUint32(offset, true) === 0x04034b50) {
    const flags = view.getUint16(offset + 6, true);
    const method = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    if (dataStart > data.length) break;
    const name = decoder.decode(data.subarray(nameStart, nameStart + nameLength));
    entries.push({ name, method });
    if (flags & 0x0008) break;
    const nextOffset = dataStart + compressedSize;
    if (nextOffset <= offset) break;
    offset = nextOffset;
  }
  return entries;
}

function compareRepairPackageEntries(repairedZip, applied) {
  const originalEntries = state.zip ? Object.keys(state.zip.files).filter((path) => !state.zip.files[path].dir).sort() : [];
  const repairedEntries = Object.keys(repairedZip.files).filter((path) => !repairedZip.files[path].dir).sort();
  const repairedSet = new Set(repairedEntries);
  const originalSet = new Set(originalEntries);
  const expectedAdded = new Set(applied.map((item) => item.path).filter(Boolean));
  const missingOriginalEntries = originalEntries.filter((path) => !repairedSet.has(path));
  const addedEntries = repairedEntries.filter((path) => originalEntries.length && !originalSet.has(path));
  const unexpectedAddedEntries = addedEntries.filter((path) => !expectedAdded.has(path));
  return {
    originalEntryCount: originalEntries.length,
    repairedEntryCount: repairedEntries.length,
    preservedOriginalEntries: missingOriginalEntries.length === 0,
    missingOriginalEntries,
    addedEntries,
    expectedAddedEntries: [...expectedAdded],
    unexpectedAddedEntries,
  };
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
  return OpenHWPExporters.blocksToPlainText(getEditorBlocks());
}

function toMarkdown() {
  return OpenHWPExporters.blocksToMarkdown(getEditorBlocks());
}

function toHtml() {
  return OpenHWPExporters.blocksToHtmlDocument(getEditorBlocks(), state.fileName);
}

function downloadText(kind) {
  const ext = kind === "html" ? "html" : "txt";
  const content = kind === "html" ? toHtml() : toPlainText();
  downloadBlob(new Blob([content], { type: kind === "html" ? "text/html;charset=utf-8" : "text/plain;charset=utf-8" }), renameExtension(state.fileName, ext));
}

function downloadJson() {
  downloadBlob(new Blob([JSON.stringify(createJsonExportData(), null, 2)], { type: "application/json;charset=utf-8" }), renameExtension(state.fileName, "json"));
}

function createJsonExportData() {
  return {
    fileName: state.fileName,
    sourceFormat: state.sourceFormat,
    exportedAt: new Date().toISOString(),
    packageInfo: state.packageInfo,
    lastExportReport: state.lastExportReport,
    lastRepairReport: state.lastRepairReport,
    changes: getSerializableChanges(),
    blocks: getSerializableBlocks(),
    paragraphs: getEditorParagraphs().map(({ index, text, kind }) => ({ index, kind, text })),
  };
}

async function downloadReport() {
  try {
    clearSearchMarks();
    if (state.zip && state.xmlByPath.size) {
      els.engineStatus.textContent = "Verifying report";
      await generateEditedSourceHwpxBytes({ verify: true, updateReport: true });
      updateAll();
    }
    downloadBlob(new Blob([JSON.stringify(createReportData(), null, 2)], { type: "application/json;charset=utf-8" }), renameExtension(state.fileName, "report.json"));
    els.engineStatus.textContent = "Report ready";
  } catch (error) {
    alert(`Report export failed: ${error.message}`);
  }
}

function createReportData() {
  return {
    product: "OpenHWP Studio",
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    fileName: state.fileName,
    sourceFormat: state.sourceFormat,
    summary: createReportSummary(),
    packageInfo: state.packageInfo,
    packageDoctor: state.packageInfo?.validation || null,
    lastExportReport: state.lastExportReport,
    lastRepairReport: state.lastRepairReport,
    compatibility: collectCompatibilitySnapshot(),
    changes: getSerializableChanges(),
    document: {
      blocks: getSerializableBlocks(),
      paragraphs: getEditorParagraphs().map(({ index, text, kind, path, paraIndex }) => ({ index, kind, path, paraIndex, text })),
      insertedHtmlTables: getInsertedTables().map((table, index) => ({ index, text: table.textContent.trim() })),
    },
  };
}

function createReportSummary() {
  const changes = collectChanges();
  const validation = state.packageInfo?.validation;
  return {
    healthScore: validation?.score ?? null,
    healthStatus: validation?.status ?? null,
    doctorIssues: validation?.counts || null,
    repairModes: countRepairModes(validation?.repairPlan || []),
    repairVerification: state.lastRepairReport?.verification
      ? {
          ok: state.lastRepairReport.verification.ok,
          checks: state.lastRepairReport.verification.checks.length,
          mismatches: state.lastRepairReport.verification.mismatches.length,
          addedEntries: state.lastRepairReport.verification.package?.addedEntries || [],
        }
      : null,
    exportVerification: state.lastExportReport?.verification
      ? {
          ok: state.lastExportReport.verification.ok,
          checked: state.lastExportReport.verification.checked,
          mismatches: state.lastExportReport.verification.mismatches.length,
          packagePreserved: state.lastExportReport.verification.package?.preserved ?? null,
        }
      : null,
    appliedEdits: state.lastExportReport?.applied?.length || 0,
    skippedItems: state.lastExportReport?.skipped?.length || 0,
    changes: changes.length,
    insertedHtmlTables: getInsertedTables().length,
  };
}

function countRepairModes(repairPlan) {
  return repairPlan.reduce(
    (counts, item) => {
      const mode = item.mode || "manual";
      counts[mode] = (counts[mode] || 0) + 1;
      return counts;
    },
    { auto: 0, manual: 0, blocked: 0, verify: 0 },
  );
}

function getSerializableChanges() {
  return collectChanges().map(({ node, ...change }) => change);
}

function getSerializableBlocks() {
  return getEditorBlocks().map((block, index) => {
    if (block.type === "paragraph") {
      const { node, ...paragraph } = block.paragraph;
      return { type: "paragraph", index, paragraph };
    }
    return {
      type: "table",
      index,
      source: block.source,
      path: block.path,
      rows: block.rows.map((row) => ({
        cells: row.cells.map((cell) => ({
          text: cell.text,
          paragraphs: cell.paragraphs.map(({ node, ...paragraph }) => paragraph),
        })),
      })),
    };
  });
}

function collectCompatibilitySnapshot() {
  return {
    score: els.compatScore.textContent,
    messages: $$("#compatList .quality-item span").map((node) => node.textContent),
  };
}

async function copyText(text) {
  if (copyTextWithSelection(text)) return;
  try {
    await navigator.clipboard.writeText(text);
    els.engineStatus.textContent = "Copied";
  } catch {
    els.engineStatus.textContent = "Copy unavailable";
  }
}

function copyTextWithSelection(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    const ok = document.execCommand("copy");
    if (ok) els.engineStatus.textContent = "Copied";
    return ok;
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
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
