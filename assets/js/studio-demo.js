/* VYRO MEDIA Prime Studio — browser demo only.
 * No Google OAuth, no cloud account, no Instagram publishing from this website.
 * Project data and uploaded blobs are scoped to a browser-local demo ID in IndexedDB.
 */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const DB_NAME = "vyro-media-demo-v2";
const DB_VERSION = 2;
const SESSION_KEY = "vyro-media-demo-id";
const DEMO_TTL_DAYS = 30;
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const MAX_EXPORT_BYTES = 12 * 1024 * 1024;
const MAX_PROXY_FILE_BYTES = 2.5 * 1024 * 1024;
const VYRO_LIME = "#B8FF00";

function createDemoId() {
  const value = globalThis.crypto?.randomUUID?.().replaceAll("-", "") || `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  return `VYRO-DEMO-${value.slice(0, 12).toUpperCase()}`;
}
const sessionId = (() => {
  let value = localStorage.getItem(SESSION_KEY);
  if (!value || !/^VYRO-DEMO-[A-F0-9]{8,40}$/i.test(value)) value = createDemoId();
  localStorage.setItem(SESSION_KEY, value);
  return value.toUpperCase();
})();

let db;
let assets = [];
let activeProject = null;
let photoImage = null;
let photoObjectUrl = null;
let videoObjectUrl = null;
let packageDraft = null;
let voiceArtifact = null;
let selectedVisualScene = 1;
let generatedAssetByScene = {};
let generatedVisualObjectUrl = null;

function uid(prefix = "vyro") {
  const uuid = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${uuid}`;
}
function contentId() { return `vyro-${uid("content").replace(/[^a-zA-Z0-9-]/g, "").slice(-32)}`; }
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function toast(message) {
  let node = $(".toast");
  if (!node) { node = document.createElement("div"); node.className = "toast"; document.body.append(node); }
  node.textContent = message;
  node.classList.add("show");
  window.setTimeout(() => node.classList.remove("show"), 2800);
}
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const current = request.result;
      if (!current.objectStoreNames.contains("projects")) current.createObjectStore("projects", { keyPath: "id" });
      if (!current.objectStoreNames.contains("uploads")) current.createObjectStore("uploads", { keyPath: "id" });
      if (!current.objectStoreNames.contains("meta")) current.createObjectStore("meta", { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Database demo sedang digunakan tab lain. Tutup tab VYRO lain lalu muat ulang."));
  });
}
function objectStore(name, mode = "readonly") { return db.transaction(name, mode).objectStore(name); }
function dbPut(name, value) {
  return new Promise((resolve, reject) => {
    const request = objectStore(name, "readwrite").put(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function dbGetAll(name) {
  return new Promise((resolve, reject) => {
    const request = objectStore(name).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}
function dbDelete(name, key) {
  return new Promise((resolve, reject) => {
    const request = objectStore(name, "readwrite").delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
function templates() { return assets.filter(asset => ["Template Foto", "Template Video"].includes(asset.category)); }
function assetById(assetId) { return assets.find(asset => asset.id === assetId) || null; }
function currentTemplate() { return assetById($("#projectTemplate")?.value); }
function isImageAsset(asset) { return asset && (asset.type === "photo" || asset.type === "logo" || /template foto|foto|gambar|copyright\s*&?\s*logo|identitas brand/i.test(asset.category || "") || /\.(png|jpe?g|webp)$/i.test(asset.download || "")); }
function isVideoAsset(asset) { return asset && (asset.type === "video" || /template video|video/i.test(asset.category || "")); }
function activeUploads() { return activeProject?.uploadIds || []; }

function installDemoNoticeAndProjectControls() {
  const studio = $("#demo-studio");
  if (!studio) return;
  if (!$("#vyroPrimeStudioStyles")) {
    const styles = document.createElement("link");
    styles.id = "vyroPrimeStudioStyles"; styles.rel = "stylesheet"; styles.href = "/assets/css/studio-prime.css";
    document.head.append(styles);
  }
  if (!$("#demoLocalNotice")) {
    const notice = document.createElement("div");
    notice.id = "demoLocalNotice";
    notice.className = "demo-local-notice";
    notice.innerHTML = `<strong>DEMO MODE — TANPA LOGIN GOOGLE</strong><span>Draft dan file berada di browser/perangkat ini saja. Demo ID bukan akun terverifikasi dan tidak dapat dipakai untuk sinkronisasi antarperangkat.</span>`;
    studio.insertBefore(notice, studio.children[1] || null);
  }
  // No account system is active in this release: replace login/register placeholders with a demo entry point.
  $$('a,button').filter(element => /masuk\s*\/\s*daftar|login|sign in/i.test(element.textContent || "")).forEach(element => {
    element.textContent = "Studio Demo";
    if (element.tagName === "A") element.setAttribute("href", "#demo-studio");
    element.setAttribute("aria-label", "Masuk ke Studio Demo tanpa login Google");
    element.addEventListener("click", event => { event.preventDefault(); studio.scrollIntoView({ behavior: "smooth" }); });
  });
  const projectPanel = $(".project-panel");
  if (projectPanel && !$("#projectActionBar")) {
    const actions = document.createElement("div");
    actions.id = "projectActionBar";
    actions.className = "project-action-bar";
    actions.innerHTML = `<button type="button" class="btn btn-outline btn-small" id="exportProject">Ekspor Draft</button><button type="button" class="btn btn-outline btn-small" id="importProject">Impor Draft</button><button type="button" class="btn btn-outline btn-small danger" id="deleteProject">Hapus Proyek</button><input id="importProjectFile" type="file" accept="application/json,.json" hidden>`;
    $("#createProject", projectPanel)?.insertAdjacentElement("afterend", actions);
  }
  const mediaPanel = $(".studio-main .studio-panel");
  const uploadZone = $("#projectUploads")?.closest(".upload-zone");
  if (uploadZone && !$("#assetRightsConfirmed")) {
    const consent = document.createElement("label");
    consent.className = "check-row upload-rights";
    consent.innerHTML = `<input id="assetRightsConfirmed" type="checkbox" /><span>Saya memiliki hak atau izin penggunaan file yang saya unggah untuk proyek ini.</span>`;
    uploadZone.insertAdjacentElement("beforebegin", consent);
  }
  const tabs = $(".editor-tabs");
  if (tabs && !$("[data-editor='visual']", tabs)) {
    const tab = document.createElement("button");
    tab.className = "editor-tab";
    tab.dataset.editor = "visual";
    tab.type = "button";
    tab.textContent = "AI Visual";
    tabs.insertBefore(tab, $("[data-editor='voice']", tabs) || null);
  }
  if (!$("#visualEditor")) {
    const panel = document.createElement("div");
    panel.id = "visualEditor";
    panel.className = "studio-panel editor-panel";
    panel.hidden = true;
    panel.innerHTML = `<div class="panel-heading"><div><h3>AI Image Studio</h3><p>Generate visual per scene memakai prompt dari Content Package. Hasilnya menjadi aset draft, bukan publikasi otomatis.</p></div><span class="local-pill">OPTIONAL AI</span></div><div class="visual-gen-layout"><div><label>Scene<select id="visualSceneSelect"><option value="1">Scene 01</option></select></label><label>Prompt visual<textarea id="visualPrompt" rows="6" maxlength="32000" placeholder="Prompt gambar sinematik sesuai visual direction..."></textarea></label><label>Rasio gambar<select id="visualSize"><option value="1024x1536">Portrait 2:3</option><option value="1024x1024">Square 1:1</option><option value="1536x1024">Landscape 3:2</option></select></label><button class="btn btn-lime" id="generateVisual">Generate AI Visual</button><p class="editor-warning">Fitur memerlukan IMAGE_API_KEY pada AI Content Engine; biaya dan kuota mengikuti provider yang dikonfigurasi.</p></div><div class="generated-visual-preview" id="generatedVisualPreview"><span>Belum ada visual dihasilkan.</span></div></div><div class="generated-visual-list" id="generatedVisualList"></div>`;
    $("#voiceEditor")?.insertAdjacentElement("beforebegin", panel);
  }
}

async function migrateLegacyRecords() {
  // Preserve drafts created by the previous Studio Demo version in this same browser profile.
  const [projects, uploads] = await Promise.all([dbGetAll("projects"), dbGetAll("uploads")]);
  const legacyProjectIds = new Set();
  for (const project of projects) {
    if (!project.owner && !project.demoId) {
      project.owner = sessionId; project.demoId = sessionId;
      project.uploadIds ||= []; project.assetPermissions ||= {}; project.selectedAssets ||= [];
      project.createdAt ||= new Date().toISOString(); project.updatedAt ||= project.createdAt;
      project.draft ||= { photo: {}, video: {}, voiceArtifact: null };
      await dbPut("projects", project); legacyProjectIds.add(project.id);
    }
  }
  for (const file of uploads) {
    if (!file.owner && (!file.projectId || legacyProjectIds.has(file.projectId))) {
      file.owner = sessionId; file.demoId = sessionId;
      await dbPut("uploads", file);
    }
  }
}

async function purgeExpiredDrafts() {
  const cutoff = Date.now() - DEMO_TTL_DAYS * 24 * 60 * 60 * 1000;
  const [projects, uploads] = await Promise.all([dbGetAll("projects"), dbGetAll("uploads")]);
  const liveProjectIds = new Set();
  const retainedUploadIds = new Set();
  for (const project of projects) {
    const updated = Date.parse(project.updatedAt || project.createdAt || 0);
    const expired = !Number.isFinite(updated) || updated < cutoff;
    if (expired) {
      // The database is browser-local: clean stale projects from old demo IDs too,
      // so resetting localStorage does not leave old demo blobs behind indefinitely.
      for (const uploadId of project.uploadIds || []) await dbDelete("uploads", uploadId);
      await dbDelete("projects", project.id);
      continue;
    }
    liveProjectIds.add(project.id);
    for (const uploadId of project.uploadIds || []) retainedUploadIds.add(uploadId);
  }
  for (const file of uploads) {
    const fileDate = Date.parse(file.createdAt || 0);
    const staleFile = Number.isFinite(fileDate) && fileDate < cutoff;
    if (!liveProjectIds.has(file.projectId) || !retainedUploadIds.has(file.id) || staleFile) {
      await dbDelete("uploads", file.id);
    }
  }
}

async function updateStorageNote() {
  const note = $("#storageNote");
  if (!note) return;
  if (navigator.storage?.estimate) {
    const estimate = await navigator.storage.estimate();
    const used = (estimate.usage || 0) / 1024 / 1024;
    const quota = (estimate.quota || 0) / 1024 / 1024;
    note.textContent = `Penyimpanan browser perkiraan: ${used.toFixed(1)} MB / ${quota.toFixed(0)} MB. Draft demo dapat dihapus oleh browser saat ruang penyimpanan dibersihkan.`;
  } else note.textContent = "Draft disimpan lokal pada browser ini. Kapasitas penyimpanan tidak dapat dihitung oleh browser.";
}

async function listProjects() {
  return (await dbGetAll("projects"))
    .filter(project => project.owner === sessionId)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}
async function saveActive() {
  if (!activeProject) { toast("Pilih atau buat proyek terlebih dahulu."); return; }
  const name = $("#projectName")?.value?.trim();
  if (name) activeProject.name = name;
  activeProject.updatedAt = new Date().toISOString();
  activeProject.demoId = sessionId;
  await dbPut("projects", activeProject);
  await renderProjects();
  $("#projectStatus").textContent = `Draft lokal tersimpan · ${new Date(activeProject.updatedAt).toLocaleString("id-ID")}`;
  await updateStorageNote();
}
async function renderProjects() {
  const host = $("#projectList");
  if (!host) return;
  const projects = await listProjects();
  host.innerHTML = projects.map(project => `<button type="button" class="project-item ${activeProject?.id === project.id ? "active" : ""}" data-project="${esc(project.id)}"><strong>${esc(project.name)}</strong><small>${new Date(project.updatedAt).toLocaleDateString("id-ID")} · ${(project.uploadIds || []).length} file</small></button>`).join("") || "<p class='muted-small'>Belum ada draft. Buat proyek pertama.</p>";
  $$('[data-project]').forEach(button => button.addEventListener("click", () => loadProject(button.dataset.project)));
}
async function createProject() {
  const name = $("#projectName")?.value?.trim() || "Untitled VYRO Project";
  const template = currentTemplate();
  activeProject = {
    id: uid("project"), owner: sessionId, demoId: sessionId, name,
    templateId: template?.id || null, selectedAssets: template ? [template.id] : [],
    assetPermissions: template ? { [template.id]: true } : {}, uploadIds: [],
    contentPackage: null, generatedByScene: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    draft: { photo: {}, video: {}, voiceArtifact: null }
  };
  packageDraft = null; voiceArtifact = null; generatedAssetByScene = {};
  await saveActive(); await renderAssetPermissions(); await renderUploads(); await renderGeneratedVisuals();
  toast("Project draft dibuat pada browser ini.");
}
async function loadProject(projectId) {
  const project = (await listProjects()).find(item => item.id === projectId);
  if (!project) return;
  activeProject = project;
  packageDraft = project.contentPackage || null;
  voiceArtifact = project.draft?.voiceArtifact || null;
  generatedAssetByScene = project.generatedByScene || {};
  $("#projectName").value = project.name || "";
  $("#projectTemplate").value = project.templateId || "";
  await renderAssetPermissions(); await renderUploads(); await renderGeneratedVisuals();
  if (project.draft?.photo) {
    $("#photoText").value = project.draft.photo.text || "";
    $("#photoBrightness").value = project.draft.photo.brightness ?? 100;
    $("#photoContrast").value = project.draft.photo.contrast ?? 100;
    $("#photoSaturation").value = project.draft.photo.saturation ?? 100;
    drawPhoto();
  }
  if (packageDraft) { updateVisualSceneOptions(); $("#scriptOutput").textContent = JSON.stringify(packageDraft, null, 2); }
  if (voiceArtifact) $("#voiceOutput").textContent = `Voice draft tersimpan: ${voiceArtifact.filename || "narration.wav"}`;
  const selected = assetById(project.templateId);
  if (selected) selected.type === "video" ? loadVideoFromUrl(selected.download) : loadPhotoFromUrl(selected.preview);
  renderProjects();
  $("#projectStatus").textContent = `Proyek aktif: ${project.name}`;
}
async function deleteActiveProject() {
  if (!activeProject) { toast("Tidak ada proyek aktif."); return; }
  if (!window.confirm(`Hapus draft “${activeProject.name}” dan semua file lokal terkait?`)) return;
  for (const uploadId of activeProject.uploadIds || []) await dbDelete("uploads", uploadId);
  await dbDelete("projects", activeProject.id);
  activeProject = null; packageDraft = null; voiceArtifact = null; generatedAssetByScene = {};
  $("#projectName").value = ""; $("#projectStatus").textContent = "Draft dihapus dari browser ini.";
  await renderProjects(); await renderAssetPermissions(); await renderUploads(); await renderGeneratedVisuals(); toast("Proyek dan upload lokal dihapus.");
}

async function renderAssetPermissions() {
  const host = $("#projectAssetList");
  if (!host) return;
  if (!activeProject) { host.innerHTML = "<p class='muted-small'>Buat atau buka proyek untuk mengatur aset yang diizinkan.</p>"; return; }
  const selected = new Set(activeProject.selectedAssets || []);
  host.innerHTML = assets.filter(asset => asset.type !== "document").map(asset => `<label class="permission-row"><input type="checkbox" data-library-asset="${esc(asset.id)}" ${selected.has(asset.id) ? "checked" : ""}/><img src="${esc(asset.preview)}" alt="" loading="lazy"/><span><strong>${esc(asset.title)}</strong><small>${esc(asset.category)} · ${esc(asset.format)}</small></span><em>${activeProject.assetPermissions?.[asset.id] === false ? "Diblokir" : selected.has(asset.id) ? "Dipilih" : "Tidak dipilih"}</em></label>`).join("");
  $$('[data-library-asset]').forEach(control => control.addEventListener("change", async () => {
    const assetId = control.dataset.libraryAsset;
    activeProject.assetPermissions ||= {}; activeProject.selectedAssets ||= [];
    activeProject.assetPermissions[assetId] = control.checked;
    if (control.checked && !activeProject.selectedAssets.includes(assetId)) activeProject.selectedAssets.push(assetId);
    if (!control.checked) activeProject.selectedAssets = activeProject.selectedAssets.filter(value => value !== assetId);
    await saveActive();
  }));
}
async function renderUploads() {
  const host = $("#uploadedList");
  if (!host) return;
  if (!activeProject) { host.innerHTML = ""; return; }
  const files = (await dbGetAll("uploads")).filter(file => file.owner === sessionId && file.projectId === activeProject.id && activeProject.uploadIds.includes(file.id));
  host.innerHTML = files.map(file => `<div class="uploaded-item"><span>${file.kind === "video" ? "▶" : file.kind === "audio" ? "♫" : "▧"}</span><strong>${esc(file.name)}</strong><small>${(file.size / 1024 / 1024).toFixed(2)} MB</small><button type="button" data-remove-upload="${esc(file.id)}" aria-label="Hapus">×</button></div>`).join("") || "<p class='muted-small'>Belum ada file di proyek ini.</p>";
  $$('[data-remove-upload]').forEach(button => button.addEventListener("click", async () => {
    await dbDelete("uploads", button.dataset.removeUpload);
    activeProject.uploadIds = activeProject.uploadIds.filter(id => id !== button.dataset.removeUpload);
    for (const [scene, uploadId] of Object.entries(activeProject.generatedByScene || {})) if (uploadId === button.dataset.removeUpload) delete activeProject.generatedByScene[scene];
    await saveActive(); await renderUploads(); await renderGeneratedVisuals();
  }));
}
async function addUploads(fileList) {
  if (!activeProject) { toast("Buat proyek terlebih dahulu."); return; }
  for (const file of fileList) {
    if (file.size > MAX_UPLOAD_BYTES) { toast(`${file.name} melebihi batas 100 MB.`); continue; }
    const kind = file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "image";
    const record = { id: uid("upload"), owner: sessionId, demoId: sessionId, projectId: activeProject.id, name: file.name, type: file.type, kind, size: file.size, blob: file, createdAt: new Date().toISOString(), source: "user_upload", rightsConfirmed: Boolean($("#assetRightsConfirmed")?.checked) };
    await dbPut("uploads", record); activeProject.uploadIds.push(record.id);
  }
  await saveActive(); await renderUploads(); toast("File disimpan lokal dalam IndexedDB browser.");
}
async function getProjectUpload(uploadId) {
  if (!activeProject || !activeProject.uploadIds.includes(uploadId)) return null;
  const file = (await dbGetAll("uploads")).find(item => item.id === uploadId && item.owner === sessionId && item.projectId === activeProject.id);
  return file || null;
}

function updateEditorTab(name) {
  $$(".editor-tab").forEach(button => button.classList.toggle("active", button.dataset.editor === name));
  ["photo", "video", "script", "visual", "voice", "render"].forEach(value => {
    const panel = $(`#${value}Editor`); if (panel) panel.hidden = value !== name;
  });
}
function fitImage(ctx, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale, sourceHeight = height / scale;
  ctx.drawImage(image, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight, 0, 0, width, height);
}
function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(/\s+/); let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) { ctx.fillText(line, x, y); line = word; y += lineHeight; }
    else line = test;
  }
  if (line) ctx.fillText(line, x, y);
}
function drawPhoto() {
  const canvas = $("#photoCanvas"); if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#101414"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (photoImage) {
    ctx.filter = `brightness(${$("#photoBrightness").value}%) contrast(${$("#photoContrast").value}%) saturate(${$("#photoSaturation").value}%)`;
    fitImage(ctx, photoImage, canvas.width, canvas.height); ctx.filter = "none";
  }
  const headline = $("#photoText").value.trim();
  if (headline) {
    ctx.fillStyle = "rgba(0,0,0,.56)"; ctx.fillRect(0, canvas.height - 275, canvas.width, 275);
    ctx.fillStyle = VYRO_LIME; ctx.font = "900 64px Inter, sans-serif"; ctx.textBaseline = "middle";
    wrapCanvasText(ctx, headline, 70, canvas.height - 210, canvas.width - 140, 78);
  }
}
function loadPhotoFromUrl(url) {
  if (photoObjectUrl && photoObjectUrl !== url) URL.revokeObjectURL(photoObjectUrl);
  photoObjectUrl = String(url).startsWith("blob:") ? url : null;
  const image = new Image(); image.crossOrigin = "anonymous";
  image.onload = () => { photoImage = image; drawPhoto(); };
  image.onerror = () => toast("Gambar gagal dimuat atau tidak dapat diproses oleh browser.");
  image.src = url;
}
function loadVideoFromUrl(url) {
  if (videoObjectUrl && videoObjectUrl.startsWith("blob:")) URL.revokeObjectURL(videoObjectUrl);
  videoObjectUrl = url; const video = $("#videoPreview"); if (video) { video.src = url; video.load(); }
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function fileAsBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob);
  });
}
async function rememberBlob(blob, name, kind, source = "generated") {
  if (!activeProject) throw new Error("Proyek belum aktif");
  const record = { id: uid("upload"), owner: sessionId, demoId: sessionId, projectId: activeProject.id, name, type: blob.type || "application/octet-stream", kind, size: blob.size, blob, createdAt: new Date().toISOString(), source, rightsConfirmed: source === "ai_generated" || source === "photo_editor_export" || source === "video_editor_export" };
  await dbPut("uploads", record); activeProject.uploadIds.push(record.id); return record;
}
async function exportPhoto() {
  drawPhoto();
  const blob = await new Promise(resolve => $("#photoCanvas").toBlob(resolve, "image/png"));
  if (!blob) { toast("Ekspor PNG gagal."); return; }
  downloadBlob(blob, `${activeProject?.id || "vyro-demo"}-photo.png`);
  if (activeProject) {
    await rememberBlob(blob, `${activeProject.id}-photo.png`, "image", "photo_editor_export");
    activeProject.draft.photo = { text: $("#photoText").value, brightness: $("#photoBrightness").value, contrast: $("#photoContrast").value, saturation: $("#photoSaturation").value };
    await saveActive(); await renderUploads();
  }
}
async function exportVideo() {
  const video = $("#videoPreview"), canvas = $("#videoCanvas");
  const ctx = canvas.getContext("2d");
  if (!video?.src || !video.videoWidth) { toast("Pilih atau unggah video terlebih dahulu."); return; }
  if (!window.MediaRecorder || !canvas.captureStream) { toast("Browser ini belum mendukung ekspor video."); return; }
  const start = Math.max(0, Number($("#videoStart").value) || 0);
  const end = Number($("#videoEnd").value) || video.duration;
  if (!Number.isFinite(end) || end <= start || end > video.duration + 0.1) { toast("Rentang trim tidak valid."); return; }
  if (Math.abs(video.currentTime - start) > 0.05) await new Promise(resolve => { video.addEventListener("seeked", resolve, { once: true }); video.currentTime = start; });
  const stream = canvas.captureStream(24);
  if (video.captureStream) { const source = video.captureStream(); source.getAudioTracks().forEach(track => stream.addTrack(track)); }
  const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find(type => MediaRecorder.isTypeSupported(type));
  if (!mimeType) { toast("Format WebM tidak didukung browser."); return; }
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
  const chunks = [];
  recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
  recorder.onerror = () => { stream.getTracks().forEach(track => track.stop()); toast("Browser gagal merekam video."); };
  recorder.onstop = async () => {
    const blob = new Blob(chunks, { type: mimeType });
    downloadBlob(blob, `${activeProject?.id || "vyro-demo"}-video.webm`);
    stream.getTracks().forEach(track => track.stop());
    if (activeProject) {
      await rememberBlob(blob, `${activeProject.id}-video.webm`, "video", "video_editor_export");
      activeProject.draft.video = { start, end, text: $("#videoText").value }; await saveActive(); await renderUploads();
    }
  };
  recorder.start(250);
  const draw = () => {
    if (recorder.state !== "recording") return;
    ctx.fillStyle = "#050709"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (video.videoWidth) fitImage(ctx, video, canvas.width, canvas.height);
    const overlay = $("#videoText").value.trim();
    if (overlay) { ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, canvas.height - 270, canvas.width, 270); ctx.fillStyle = VYRO_LIME; ctx.font = "900 56px Inter, sans-serif"; wrapCanvasText(ctx, overlay, 45, canvas.height - 180, canvas.width - 90, 68); }
    if (video.currentTime >= end || video.ended) { recorder.stop(); video.pause(); return; }
    requestAnimationFrame(draw);
  };
  video.play().then(draw).catch(() => { recorder.stop(); toast("Browser tidak dapat memutar sumber video."); });
}

async function postApi(path, payload, { method = "POST" } = {}) {
  const headers = { "content-type": "application/json", "x-vyro-demo-id": sessionId };
  const response = await fetch(path, { method, headers, body: method === "GET" ? undefined : JSON.stringify({ ...payload, demo_id: sessionId }) });
  const data = await response.json().catch(() => ({ error: "Respons API tidak valid" }));
  if (!response.ok) throw new Error(data.detail || data.error || `HTTP ${response.status}`);
  return data;
}
function makeBriefPayload() {
  const current = currentTemplate();
  const selectedAssets = (activeProject?.selectedAssets || []).map(id => assetById(id)).filter(Boolean);
  return {
    schema_version: "1.2", content_id: contentId(), title: $("#briefTitle").value.trim(),
    pillar: $("#briefPillar").value, objective: $("#briefObjective").value.trim(), audience: $("#briefAudience").value.trim(),
    language: "id-ID", platform: "instagram_reels", duration_seconds: Number($("#briefDuration").value),
    hook: $("#briefHook").value.trim(), narration: $("#briefNarration").value.trim(), call_to_action: $("#briefCta").value.trim(),
    caption: $("#briefCaption").value.trim() || null, hashtags: [], source_urls: [], claims_to_verify: [],
    assets: selectedAssets.filter(asset => isImageAsset(asset) || isVideoAsset(asset)).slice(0, 20).map(asset => ({
      asset_id: asset.id, path_or_url: asset.download, media_type: isVideoAsset(asset) ? "video" : "image",
      rights_confirmed: true, attribution: "VYRO MEDIA Library asset", source: "library"
    })),
    reference_asset_ids: selectedAssets.map(asset => asset.id), brand_voice: "Natural, singkat, tegas, profesional; gaya VYRO MEDIA.",
    visual_style: "VYRO MEDIA: black #050709, white #F7F9F6, neon lime #B8FF00; diagonal modern cinematic.",
    template_id: current?.id || activeProject?.templateId || null,
    paid_partnership: false, ai_generated_media: false, human_review_required: true,
    notes: "Created in VYRO MEDIA browser demo; review facts and asset permissions before use."
  };
}
async function generateScript() {
  const output = $("#scriptOutput");
  try {
    if (!activeProject) throw new Error("Buat atau buka proyek terlebih dahulu.");
    output.textContent = "Memvalidasi naskah melalui Script Intake…";
    const brief = makeBriefPayload();
    const normalized = await postApi("/api/v1/intake", brief);
    output.textContent = "Brief tervalidasi. AI Content Engine sedang membuat hooks, narration, storyboard, dan caption…";
    const packageResult = await postApi("/api/v1/content", normalized.brief || brief);
    packageDraft = packageResult; activeProject.contentPackage = packageResult;
    updateVisualSceneOptions(); await saveActive(); output.textContent = JSON.stringify(packageResult, null, 2);
    toast("Content Package dibuat. Review manusia tetap wajib.");
  } catch (error) { output.textContent = `Gagal: ${error.message}\nPeriksa service URL/key di Vercel dan status health komponen.`; }
}

function updateVisualSceneOptions() {
  const select = $("#visualSceneSelect");
  if (!select) return;
  const scenes = packageDraft?.scenes || [];
  select.innerHTML = scenes.map(scene => `<option value="${scene.scene_number}">Scene ${String(scene.scene_number).padStart(2, "0")} · ${esc(scene.on_screen_text || scene.visual_direction || "Visual")}</option>`).join("") || "<option value='1'>Buat Content Package terlebih dahulu</option>";
  selectedVisualScene = Number(select.value || 1);
  updateVisualPromptFromScene();
}
function updateVisualPromptFromScene() {
  const scene = packageDraft?.scenes?.find(item => Number(item.scene_number) === selectedVisualScene);
  if (!scene) { $("#visualPrompt").value = ""; return; }
  $("#visualPrompt").value = scene.visual_prompt || `${scene.visual_direction}. Visual style: ${scene.visual_style || packageDraft.visual_style || "VYRO MEDIA black, white, neon-lime"}. No watermarks, clean composition, readable negative space.`;
}
async function generateVisual() {
  const output = $("#generatedVisualPreview");
  try {
    if (!activeProject || !packageDraft) throw new Error("Buat Content Package terlebih dahulu.");
    const scene = packageDraft.scenes.find(item => Number(item.scene_number) === selectedVisualScene);
    if (!scene) throw new Error("Scene tidak ditemukan.");
    const prompt = $("#visualPrompt").value.trim();
    output.innerHTML = "<span>AI sedang menghasilkan visual…</span>";
    const result = await postApi("/api/v1/images", { content_id: packageDraft.content_id, prompt, size: $("#visualSize").value, output_format: "webp" });
    const response = await fetch(`/api/v1/image-file?demo_id=${encodeURIComponent(sessionId)}&asset_id=${encodeURIComponent(result.asset_id)}`, { headers: { "x-vyro-demo-id": sessionId } });
    if (!response.ok) throw new Error("File visual AI tidak dapat diambil dari sesi demo ini.");
    const blob = await response.blob();
    const record = await rememberBlob(blob, `scene-${String(selectedVisualScene).padStart(2, "0")}-ai-visual.${result.format || "png"}`, "image", "ai_generated");
    activeProject.generatedByScene ||= {}; activeProject.generatedByScene[String(selectedVisualScene)] = record.id;
    generatedAssetByScene[String(selectedVisualScene)] = record.id;
    scene.visual_prompt = prompt; await saveActive(); await renderUploads(); await renderGeneratedVisuals();
    if (generatedVisualObjectUrl) URL.revokeObjectURL(generatedVisualObjectUrl);
    generatedVisualObjectUrl = URL.createObjectURL(blob);
    output.innerHTML = `<img src="${generatedVisualObjectUrl}" alt="Generated scene visual"><small>AI visual disimpan sebagai draft lokal · SHA-256 ${esc(result.sha256 || "available")}</small>`;
    toast("AI visual dibuat dan disimpan di draft browser.");
  } catch (error) { output.textContent = `Gagal: ${error.message}`; }
}
async function renderGeneratedVisuals() {
  const host = $("#generatedVisualList"); if (!host) return;
  if (!activeProject) { host.innerHTML = ""; return; }
  const records = await dbGetAll("uploads");
  const items = Object.entries(activeProject.generatedByScene || {}).map(([scene, uploadId]) => records.find(record => record.id === uploadId && record.owner === sessionId && record.projectId === activeProject.id)).filter(Boolean);
  host.innerHTML = items.map(item => `<span class="generated-visual-tag">Scene asset · ${esc(item.name)}</span>`).join("");
}
async function generateVoice() {
  const output = $("#voiceOutput");
  try {
    if (!activeProject || !packageDraft) throw new Error("Buat Content Package terlebih dahulu.");
    if (!$("#voiceConsent").checked) throw new Error("Konfirmasi hak dan izin penggunaan suara wajib.");
    const profileId = $("#voiceProfileId").value.trim();
    if (!profileId) throw new Error("Voice Profile ID wajib diisi.");
    const text = $("#voiceText").value.trim() || packageDraft.narration;
    output.textContent = "AI Voice Studio sedang memproses…";
    const result = await postApi("/api/v1/voice", { content_id: packageDraft.content_id, text, voice_profile_id: profileId, consent_confirmation: true });
    const file = result.audio_files?.[0];
    if (!file) throw new Error("Voice Studio tidak mengembalikan file audio.");
    voiceArtifact = { demoId: sessionId, contentId: packageDraft.content_id, filename: file.filename, sha256: file.sha256 };
    activeProject.draft.voiceArtifact = voiceArtifact; await saveActive();
    output.textContent = JSON.stringify(result, null, 2);
    const audioUrl = `/api/v1/voice-file?demo_id=${encodeURIComponent(sessionId)}&content_id=${encodeURIComponent(packageDraft.content_id)}&filename=${encodeURIComponent(file.filename)}`;
    $("#voiceDownload").innerHTML = `<audio controls preload="none" src="${audioUrl}"></audio><a class="btn btn-outline btn-small" href="${audioUrl}">Unduh WAV</a>`;
    toast("Audio dibuat. Dengarkan seluruh hasil sebelum render.");
  } catch (error) { output.textContent = `Gagal: ${error.message}`; }
}
async function uploadBlobToRender(blob, filename) {
  if (blob.size > MAX_PROXY_FILE_BYTES) throw new Error(`${filename} melebihi batas demo 2.5 MiB. Kompres gambar atau pilih file lebih ringan.`);
  const data_base64 = await fileAsBase64(blob);
  return postApi("/api/v1/assets", { filename, data_base64 });
}
async function resolveLibraryAsset(asset) {
  const response = await fetch(asset.download, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Asset library tidak dapat diakses: ${asset.title}`);
  return response.blob();
}
async function renderFinal() {
  const output = $("#renderOutput");
  try {
    if (!activeProject || !packageDraft) throw new Error("Buat Content Package terlebih dahulu.");
    if (!$("#renderApproved").checked) throw new Error("Setujui Content Package secara manual sebelum render.");
    output.textContent = "Menyiapkan aset yang diizinkan untuk proyek…";
    const packageToRender = JSON.parse(JSON.stringify(packageDraft));
    packageToRender.human_review_required = true;
    packageToRender.review_approved = true; // Explicit user checkbox above is the approval action.
    const uploadRecords = (await dbGetAll("uploads")).filter(file => file.owner === sessionId && file.projectId === activeProject.id);
    const librarySelected = (activeProject.selectedAssets || []).filter(assetId => activeProject.assetPermissions?.[assetId] !== false).map(assetById).filter(isImageAsset);
    const serverRefs = [];
    for (const asset of librarySelected) {
      try { serverRefs.push((await uploadBlobToRender(await resolveLibraryAsset(asset), asset.download.split("/").pop() || "library-image.png")).asset_ref); }
      catch (error) { console.warn(error); }
    }
    const imageUploads = uploadRecords.filter(file => file.kind === "image");
    const unapprovedUploads = imageUploads.filter(file => !file.rightsConfirmed && file.source === "user_upload");
    if (unapprovedUploads.length) throw new Error(`Konfirmasi hak penggunaan file ini sebelum render: ${unapprovedUploads.map(file => file.name).join(", ")}`);
    const uploadRefs = new Map();
    for (const file of imageUploads) {
      try { const saved = await uploadBlobToRender(file.blob, file.name); uploadRefs.set(file.id, saved.asset_ref); }
      catch (error) { console.warn(error); }
    }
    const localRefs = [...uploadRefs.values()];
    const availableRefs = [...localRefs, ...serverRefs];
    for (const scene of packageToRender.scenes) {
      const generatedId = activeProject.generatedByScene?.[String(scene.scene_number)];
      if (generatedId && uploadRefs.has(generatedId)) scene.asset_hint = uploadRefs.get(generatedId);
      else scene.asset_hint = availableRefs.length ? availableRefs[(scene.scene_number - 1) % availableRefs.length] : null;
    }
    let voiceover_asset = null;
    if (voiceArtifact) {
      const audioResponse = await fetch(`/api/v1/voice-file?demo_id=${encodeURIComponent(sessionId)}&content_id=${encodeURIComponent(voiceArtifact.contentId)}&filename=${encodeURIComponent(voiceArtifact.filename)}`, { headers: { "x-vyro-demo-id": sessionId } });
      if (!audioResponse.ok) throw new Error("Voiceover tidak tersedia atau sesi demo tidak sesuai.");
      voiceover_asset = (await uploadBlobToRender(await audioResponse.blob(), voiceArtifact.filename)).asset_ref;
    }
    output.textContent = "Render Engine sedang membuat MP4 master…";
    const result = await postApi("/api/v1/render", { content_package: packageToRender, voiceover_asset });
    activeProject.lastRender = { renderId: result.render_id, status: result.status, createdAt: new Date().toISOString() };
    await saveActive(); output.textContent = JSON.stringify(result, null, 2);
    $("#renderDownload").innerHTML = `<a class="btn btn-lime btn-small" href="/api/v1/render-file?demo_id=${encodeURIComponent(sessionId)}&render_id=${encodeURIComponent(result.render_id)}" download>Unduh MP4 Master</a>`;
    toast("Render selesai. Periksa file sebelum digunakan.");
  } catch (error) { output.textContent = `Gagal: ${error.message}`; }
}

function toBase64(blob) { return fileAsBase64(blob); }
async function exportProject() {
  if (!activeProject) { toast("Pilih proyek terlebih dahulu."); return; }
  const files = (await dbGetAll("uploads")).filter(file => file.owner === sessionId && file.projectId === activeProject.id);
  const attachments = []; let total = 0;
  for (const file of files) {
    total += file.size;
    if (total > MAX_EXPORT_BYTES) throw new Error("Jumlah file mentah melebihi 12 MiB. Hapus file besar atau ekspor draft tanpa lampiran.");
    attachments.push({ id: file.id, name: file.name, type: file.type, kind: file.kind, source: file.source, data_base64: await toBase64(file.blob) });
  }
  const bundle = { format: "vyro-demo-project", schema_version: "1.0", exported_at: new Date().toISOString(), project: activeProject, attachments };
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  downloadBlob(blob, `${(activeProject.name || "vyro-project").replace(/[^a-z0-9_-]+/gi, "-").toLowerCase()}.vyro.json`);
}
async function importProject(file) {
  if (file.size > MAX_EXPORT_BYTES + 2 * 1024 * 1024) throw new Error("File draft melebihi batas impor 20 MiB.");
  const bundle = JSON.parse(await file.text());
  if (bundle.format !== "vyro-demo-project" || !bundle.project || !Array.isArray(bundle.attachments)) throw new Error("Format file bukan VYRO demo project.");
  const project = bundle.project;
  const idMap = new Map(); const uploadIds = [];
  for (const item of bundle.attachments) {
    const blob = await (async () => {
      const raw = atob(item.data_base64 || ""); const bytes = Uint8Array.from(raw, char => char.charCodeAt(0));
      return new Blob([bytes], { type: item.type || "application/octet-stream" });
    })();
    const record = { id: uid("upload"), owner: sessionId, demoId: sessionId, projectId: "pending", name: item.name || "imported-file", type: item.type || blob.type, kind: item.kind || "image", size: blob.size, blob, createdAt: new Date().toISOString(), source: item.source || "imported" };
    idMap.set(item.id, record.id); uploadIds.push(record);
  }
  const newProjectId = uid("project");
  for (const record of uploadIds) { record.projectId = newProjectId; await dbPut("uploads", record); }
  const generatedByScene = {};
  for (const [scene, oldId] of Object.entries(project.generatedByScene || {})) if (idMap.has(oldId)) generatedByScene[scene] = idMap.get(oldId);
  activeProject = { ...project, id: newProjectId, owner: sessionId, demoId: sessionId, uploadIds: uploadIds.map(record => record.id), generatedByScene, importedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (activeProject.draft?.voiceArtifact) activeProject.draft.voiceArtifact = null; // demo ID-scoped server artifacts cannot be imported across sessions.
  voiceArtifact = null; packageDraft = activeProject.contentPackage || null;
  await dbPut("projects", activeProject); await loadProject(newProjectId); toast("Draft berhasil diimpor ke browser ini.");
}

async function init() {
  if (!$("#demo-studio")) return;
  installDemoNoticeAndProjectControls();
  $("#demoUserId").textContent = sessionId;
  db = await openDb();
  await migrateLegacyRecords();
  const response = await fetch("/data/library.json", { cache: "no-cache" });
  if (!response.ok) throw new Error("Library manifest tidak dapat dimuat.");
  const library = await response.json(); assets = library.assets || [];
  await purgeExpiredDrafts();
  const allTemplates = templates();
  $("#projectTemplate").innerHTML = `<option value="">Pilih template dari library</option>${allTemplates.map(asset => `<option value="${esc(asset.id)}">${esc(asset.title)} (${esc(asset.type)})</option>`).join("")}`;
  $("#photoSource").innerHTML = `<option value="">Pilih template / upload</option>${allTemplates.filter(asset => !isVideoAsset(asset)).map(asset => `<option value="${esc(asset.id)}">${esc(asset.title)}</option>`).join("")}`;
  $("#videoSource").innerHTML = `<option value="">Pilih template video</option>${allTemplates.filter(isVideoAsset).map(asset => `<option value="${esc(asset.id)}">${esc(asset.title)}</option>`).join("")}`;
  await renderProjects(); await renderAssetPermissions(); await renderUploads(); await renderGeneratedVisuals(); await updateStorageNote(); drawPhoto();

  $("#createProject")?.addEventListener("click", createProject);
  $("#saveProject")?.addEventListener("click", saveActive);
  $("#projectUploads")?.addEventListener("change", event => addUploads([...event.target.files]));
  $("#copyDemoId")?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(sessionId); toast("Demo ID disalin."); } catch { toast(sessionId); } });
  $("#exportProject")?.addEventListener("click", () => exportProject().catch(error => toast(error.message)));
  $("#importProject")?.addEventListener("click", () => $("#importProjectFile").click());
  $("#importProjectFile")?.addEventListener("change", event => { if (event.target.files[0]) importProject(event.target.files[0]).catch(error => toast(error.message)); event.target.value = ""; });
  $("#deleteProject")?.addEventListener("click", deleteActiveProject);
  $$(".editor-tab").forEach(button => button.addEventListener("click", () => updateEditorTab(button.dataset.editor)));
  ["photoBrightness", "photoContrast", "photoSaturation", "photoText"].forEach(id => $(`#${id}`)?.addEventListener("input", drawPhoto));
  $("#photoSource")?.addEventListener("change", event => { const asset = assetById(event.target.value); if (asset) loadPhotoFromUrl(asset.preview); });
  $("#photoUpload")?.addEventListener("change", event => { const file = event.target.files[0]; if (!file) return; if (photoObjectUrl) URL.revokeObjectURL(photoObjectUrl); photoObjectUrl = URL.createObjectURL(file); loadPhotoFromUrl(photoObjectUrl); if (activeProject) addUploads([file]).catch(error => toast(error.message)); });
  $("#exportPhoto")?.addEventListener("click", () => exportPhoto().catch(error => toast(error.message)));
  $("#videoUpload")?.addEventListener("change", event => { const file = event.target.files[0]; if (!file) return; const url = URL.createObjectURL(file); loadVideoFromUrl(url); if (activeProject) addUploads([file]).catch(error => toast(error.message)); });
  $("#videoSource")?.addEventListener("change", event => { const asset = assetById(event.target.value); if (asset) loadVideoFromUrl(asset.download); });
  $("#exportVideo")?.addEventListener("click", exportVideo);
  $("#generateScript")?.addEventListener("click", generateScript);
  $("#visualSceneSelect")?.addEventListener("change", event => { selectedVisualScene = Number(event.target.value); updateVisualPromptFromScene(); });
  $("#generateVisual")?.addEventListener("click", generateVisual);
  $("#generateVoice")?.addEventListener("click", generateVoice);
  $("#renderProject")?.addEventListener("click", renderFinal);
  document.addEventListener("vyro:use-template", event => {
    const asset = assetById(event.detail.id); if (!asset) return;
    if (asset.type === "video") { updateEditorTab("video"); $("#videoSource").value = asset.id; loadVideoFromUrl(asset.download); }
    else { updateEditorTab("photo"); $("#photoSource").value = asset.id; loadPhotoFromUrl(asset.preview); }
    if (activeProject) { activeProject.templateId = asset.id; $("#projectTemplate").value = asset.id; activeProject.selectedAssets ||= []; if (!activeProject.selectedAssets.includes(asset.id)) activeProject.selectedAssets.push(asset.id); activeProject.assetPermissions ||= {}; activeProject.assetPermissions[asset.id] = true; saveActive(); renderAssetPermissions(); }
    $("#demo-studio").scrollIntoView({ behavior: "smooth" });
  });
}

init().catch(error => {
  console.error("VYRO Prime Studio init failed", error);
  const status = $("#projectStatus"); if (status) status.textContent = "Demo storage tidak tersedia pada browser ini.";
  toast("Studio Demo belum dapat diinisialisasi pada browser ini.");
});
