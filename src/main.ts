import { bookmarkClearQuality, migrateBookmarkQuality } from './bookmark-clarity';
import { updateBookmarkSummary, setBookmarkSummaryLogo, reloadBookmarkSummaryLogo, bookmarkResultIcon, refreshBookmarkResultIcons } from './bookmark-summary';
import { setBookmarkStartupMode, reloadBookmarkStartupMode, bookmarkStartupReady, openingModeForPage, markDailyOpeningShown, type OpeningMode } from './bookmark-startup';
import { bookmarkDisplayTitle } from './bookmark-data';
import { bookmarkColumnColor } from './bookmark-colors';
import { createRollingClock } from "./rolling-clock";
import { InspectionOverlay } from "./inspection-overlay";
import { DocumentDecryption } from "./document-decryption";
import "./document-decryption.css";
import "./decryption.css";
import { escapeHtml } from "./html";
import { DEFAULT_USER_NAME, USER_NAME_KEY, USER_NAME_BOOT_TIME, readUserName, writeUserName, normalizeUserName, type UserNameProfile } from './user-name';
import './user-name.css';
import { normalizeQuality, qualityPresets, type QualityPreset, type RenderQuality } from "./render-quality";
import { qualityMarkup, syncQualityUI } from "./quality-settings";
import { superPerformanceQuality, wallpaperQuality } from "./wallpaper-quality";
import "@kitlangton/rolling-number/styles.css";
import "./style.css";
import "./quality-settings.css";
import "./responsive.css";
import { viewportLayout, openingLayout } from "./viewport-layout";
import { assetUrl } from "./asset-url";
import { initPwa, pwaSettingsMarkup } from "./pwa";
import { isExtension, isChromeStore } from './platform';
import { RenderCadence, normalizeRenderPace, renderFrameLimit, renderCadenceMarkup, normalizeIdleMotion, idleBreathingSeconds, idleMotionMarkup, SETTLED_FRAME_LIMIT, type RenderPace, type IdleMotion } from './render-cadence';
import { mountBookmarkUI, bookmarkSettingsMarkup, setSearchEngine, focusBookmarkSearch, updateBookmarkFolderPosition } from './bookmark-ui';
import { saveCoverPreference, reloadCoverPreferences } from './bookmark-covers';
import { setIncludeOtherBookmarks, reloadBookmarkScope } from './bookmark-scope';
import { reloadSearchEngine } from '@search-provider';
import { openBookmarkDestination, setBookmarkOpenMode, setNavigationNotice, reloadBookmarkOpenMode } from './bookmark-navigation';
import './bookmarks.css';
import { createRollingNumber, createRollingText } from "@kitlangton/rolling-number";
import { ArchiveScene } from "./scene";
import { ModelViewer } from "./model-viewer";
import { ContentTransition, SurfaceTransition } from "./ui-transitions";
import { BootSequence } from "./boot";
import { loadBootWebfonts } from "./boot-lettering";
import { wrap, type ArchiveNavigation } from "./archive-loop";
import {
  records,
  categories,
  archiveColumns,
  columnFiles,
  fileLocation,
} from "./data";
import { TerminalAudio } from "./audio";
import { audioSettingsMarkup } from "./audio-settings";
import { StartupGate } from "./startup";
import { preparedBootTime, yieldPreparation } from "./presentation-preparation";
import { isWallpaper, wallpaperHost, wallpaperFrame, type WallpaperProperties } from "./wallpaper";
import "./startup.css";
import "./wallpaper.css";
import { Workbench } from "./workbench";
let workbench: Workbench | undefined;
import { ArchivePlayground } from "./archive-playground";
import { ARRAY_OPENING_END, openingShowsDetail } from "./wallpaper-opening";
import { paintTheme, themeSettingsMarkup } from "./theme-ui";
let playground: ArchivePlayground | undefined;
import { WallpaperEffects } from "./wallpaper-effects";
import { WallpaperBackground } from "./wallpaper-background";
let wallpaperEffects: WallpaperEffects | undefined;

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
import { logo, brandHeading } from "./brand";
function loadUserName(): UserNameProfile {
  try { return readUserName(localStorage); }
  catch { return { name: DEFAULT_USER_NAME, confirmed: false }; }
}
let userNameProfile = isExtension ? loadUserName() : { name: DEFAULT_USER_NAME, confirmed: true };

$("#stage").innerHTML = `
  <div id="three-scene" class="three-scene"></div>
  <div class="scene-atmosphere archive-atmosphere"></div>
  <div id="boot-background" class="boot-background"><svg viewBox="0 0 1920 1080" preserveAspectRatio="none"><g fill="none" stroke="#fff" stroke-width="3"><path d="M-210 705C-45 705 182 704 247 567C337 377 99 306 4 435S27 680 169 631C309 584 227 314 279 111S568-113 568-113"/><path d="M1560-80C1374 114 1671 168 1601 323S1371 367 1431 480S1692 666 1559 787S1329 886 1498 1130"/><circle cx="1450" cy="648" r="346"/><circle cx="1450" cy="648" r="348"/></g></svg></div>
  <header class="brand">${brandHeading}</header>
  <nav class="system-nav" aria-label="系统导航">
    <button data-action="search"><span class="nav-glyph">⌕</span> ARCHIVE INDEX <span class="key">/</span></button>
    <button data-action="saved" aria-label="查看收藏档案" title="收藏档案">＋ SAVED <span id="saved-count">00</span></button>
    ${isExtension ? `<button class="sound-button" data-action="toggle-sound" data-muted="true" aria-label="开启声音" title="开启声音"><span class="sound-glyph" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3.5 9.25h3.75L12.5 5v14l-5.25-4.25H3.5z"/><path class="sound-wave" d="M15.6 9.2a4 4 0 0 1 0 5.6M18.2 6.6a7.6 7.6 0 0 1 0 10.8"/><path class="sound-off" d="M15.5 9.5l5 5M20.5 9.5l-5 5"/></svg></span><span class="settings-label">静音</span></button>` : ""}
    <button class="settings-button" data-action="settings" aria-label="系统设置" title="系统设置"><span class="settings-glyph" aria-hidden="true">◷</span><span class="settings-label">设置</span></button>
  </nav>
  <button id="skip" class="skip" data-action="skip">ENTER SYSTEM <span>↗</span></button>
  <section id="boot" class="boot" aria-label="系统启动">
    <div class="access-text">ACCESS</div>
    <div class="boot-logo">${logo}</div>
    <div class="auth-status"><span>▪</span> <span id="auth-message"></span>${isExtension ? `<form id="user-name-prompt" class="user-name-prompt" hidden><input id="boot-user-name" type="text" placeholder="${DEFAULT_USER_NAME}" aria-label="显示名称" aria-describedby="user-name-help" autocomplete="off" spellcheck="false" enterkeyhint="done"/><span id="user-name-help" class="user-name-help">首次设置显示名称 · 留空使用默认名称</span><button type="submit">ENTER ↵ 确认</button></form>` : ''}<i></i></div>
    <div class="scan"><svg viewBox="0 0 1920 1080" aria-hidden="true"><g fill="none" stroke="#080a08" stroke-width="2" stroke-linecap="round"><path/><path stroke="#fff"/><path/><path/><path/><path/><circle class="orbit-dot" r="8" fill="#ed821b" stroke="none"/><circle class="orbit-dot" r="8" fill="#ed821b" stroke="none"/><circle class="scan-core" cx="960" cy="540" r="5" fill="#080a08" stroke="none"/></g></svg><span>PERMISSION AUTHORIZED</span></div>
    <div class="welcome"><div class="welcome-panel"></div><div class="welcome-heading">WELCOME TO</div><div class="welcome-company"><strong>RHINE LAB.LLC.</strong><strong class="welcome-highlight" aria-hidden="true">RHINE LAB.LLC.</strong></div><div class="welcome-database">INTERNAL DATABASE</div><div class="welcome-logo">${logo}</div></div>
  </section>
  <svg id="inspection-marks" viewBox="0 0 1920 1080" aria-hidden="true"><path id="inspection-lines"/><g id="inspection-corners"></g><circle id="inspection-point" r="1.8"/></svg>
  <div id="inspection-text" aria-hidden="true">CONFIDENTIALITY:<strong>GENERAL BUSINESS USE</strong></div>
  <section id="archive-ui" class="archive-ui" aria-label="档案选择">
    <div class="archive-callout"><div class="eyebrow">INTERNAL DATABASE <span>／</span> <span id="archive-category">机构档案</span></div><button class="file-title" data-action="open">FILE NUMBER: <span id="selected-id">X-<span id="selected-code">001</span></span><span class="file-open">↗</span></button><div class="callout-rule"><i></i></div><div class="file-summary"><span id="selected-title">莱茵生命</span><span id="selected-clearance">BUSINESS AREA</span></div><button class="read-file" data-action="open">ACCESS FILE <span>→</span></button></div>
    <div id="hover-label" class="hover-label" hidden>X-<span id="hover-code">001</span> / <span id="hover-title"></span></div>
    <div class="archive-counter"><span class="tiny-label">ARCHIVE / SELECT</span><div><span id="selected-number">01</span><i>/</i><span class="count-total">12</span></div></div>
    <div class="archive-navigation"><button data-action="prev" aria-label="上一个档案">↑</button><div id="file-ticks" class="file-ticks"></div><button data-action="next" aria-label="下一个档案">↓</button></div>
    <div class="column-navigation"><button data-action="column-prev" aria-label="上一列">←</button><div><span id="column-number">COLUMN <span id="column-index">03</span> / <span id="column-total">05</span></span><strong id="column-name">机构档案</strong></div><button data-action="column-next" aria-label="下一列">→</button></div>
    <div class="archive-hint"><kbd>←</kbd> <kbd>→</kbd> 切换列 <span>／</span> <kbd>↑</kbd> <kbd>↓</kbd> 前后档案 <span>／</span> <kbd>ENTER</kbd> 读取</div>
  </section>
  <section id="detail-ui" class="detail-ui" aria-label="档案内容" hidden>
    <button class="back-button" data-action="back">← <span>ARCHIVE OVERVIEW</span><small>ESC</small></button>
    <div class="object-caption"><span id="object-id">NO.001</span><div>INTERNAL DATABASE</div><small>DRAG TO INSPECT <span>↔</span></small><button class="viewer-open" data-action="model-viewer">360° 查看文档模型 <span>↗</span></button></div>
    <article id="detail-content" class="detail-content"></article>
  </section>
  <div class="powered">POWERED BY <b>RHINE LAB</b><i></i></div>
  <footer class="system-footer"><span><i class="status-light"></i> SESSION AUTHORIZED${isWallpaper ? '<button type="button" class="three-toggle" data-action="toggle-three" aria-pressed="true" title="卸载三维模型，保留 2D 界面">3D 开启</button>' : ''}</span><span><b data-user-name>${escapeHtml(userNameProfile.name)}</b> <i>／</i> <span id="clock">00:00:00</span></span><button data-action="replay" title="重播启动流程">REINITIALIZE ↗</button></footer>
  <div id="pwa-update-notice" class="pwa-update-notice" role="status" hidden><span>新版本已就绪</span><button data-pwa-action="update">更新并重启 ↻</button></div>
  <div id="modal-root"></div><div id="toast" class="toast" role="status"></div>
  <div id="loading" class="loading"><div class="loading-mark">${logo}</div><span>CONNECTING TO INTERNAL DATABASE</span><i></i></div>
`;

$("#boot-background").insertAdjacentHTML(
  "beforeend",
  '<div class="boot-white"></div>',
);
const bootSequence = new BootSequence($("#stage"));
if (isExtension) { mountBookmarkUI(); setNavigationNotice(message => notify(message)); }
$("#viewport").insertAdjacentHTML("beforeend", '<button class="mobile-entry" data-action="skip">进入档案 <span>→</span></button>');

type Mode = "boot" | "archive" | "detail";
let mode: Mode = "boot",
  selected = 0,
  bootStart = 0,
  lastStep = "",
  ready = false;
let modal: "search" | "saved" | "settings" | null = null,
  searchQuery = "",
  filter = "全部档案";
let activeTab = "overview";
const reviewParams = new URLSearchParams(location.search);
let frozenTime =
  reviewParams.get("freeze") === "1"
    ? Number(reviewParams.get("time") ?? 0)
    : null;
if (reviewParams.get("review") === "1") {
  $("#stage").dataset.review = "true";
  window.addEventListener("message", (event) => {
    if (
      event.origin !== location.origin ||
      event.source !== window.parent ||
      event.data?.type !== "rhine-review-frame"
    )
      return;
    const t = Number(event.data.time);
    if (!Number.isFinite(t) || t < 0 || t >= 35) return;
    frozenTime = t;
    if (ready && mode !== "boot") setMode("boot");
  });
}
let toastTimer: ReturnType<typeof setTimeout>;
let previousFocus: HTMLElement | null = null;
const detailTransition = new SurfaceTransition($("#detail-ui"), undefined, 180, 180);
const tabTransition = new ContentTransition();
let modalTransition: SurfaceTransition | undefined;
let modalClosing = false;
let modalSiblings: { node: HTMLElement; inert: boolean }[] = [];
let pendingDetailFocus = false;
let bookmarkFeedback: Animation | undefined;
function readLocal<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}
const savedStore = isExtension ? 'rhine-bookmark-saved' : 'rhine-saved';
const savedKey = (record: typeof records[number]) => record.bookmarkId ?? record.id;
const storedSaved = readLocal<unknown>(savedStore, []);
// A damaged value must not stop the page from starting.
const saved = new Set<string>(Array.isArray(storedSaved) ? storedSaved.filter((id): id is string => typeof id === "string") : []);
type MotionPreference = "system" | "full" | "reduced";
const systemReducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const systemDarkScheme = matchMedia("(prefers-color-scheme: dark)");
// Updated from the change events' own values, which are current when the event fires.
let systemReduced = systemReducedMotion.matches, systemDark = systemDarkScheme.matches;
/** Earlier versions stored the resolved value; one that differs from the system was an explicit choice. */
function normalizeMotion(value: unknown, legacyReduced: unknown): MotionPreference {
  if (value === "system" || value === "full" || value === "reduced") return value;
  return typeof legacyReduced === "boolean" && legacyReduced !== systemReduced ? (legacyReduced ? "reduced" : "full") : "system";
}
const storedPrefs = readLocal<Partial<{ sound: boolean; music: boolean; soundVolume: number; musicVolume: number; reduced: boolean; motion: MotionPreference; quality: boolean; rendering: RenderQuality; renderPace: RenderPace; idleMotion: IdleMotion; superPerformance: boolean; bookmarkClarityVersion: number; audioDefaultsVersion: number; unmuteSound: boolean; unmuteMusic: boolean; colorTheme: "light" | "dark" | "system" }>>("rhine-settings", {});
const prefs = {
  sound: true,
  music: storedPrefs.sound ?? true,
  soundVolume: .55,
  musicVolume: .5,
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  quality: true,
  superPerformance: false,
  // What the sound button restores; both play once the user turns sound on.
  unmuteSound: true,
  unmuteMusic: true,
  ...storedPrefs,
  renderPace: normalizeRenderPace(storedPrefs.renderPace),
  idleMotion: normalizeIdleMotion(storedPrefs.idleMotion),
  rendering: isExtension ? migrateBookmarkQuality(normalizeQuality(storedPrefs.rendering, storedPrefs.quality !== false), storedPrefs.bookmarkClarityVersion) : normalizeQuality(storedPrefs.rendering, storedPrefs.quality !== false),
  bookmarkClarityVersion: isExtension ? 1 : storedPrefs.bookmarkClarityVersion,
  audioDefaultsVersion: isExtension ? 1 : storedPrefs.audioDefaultsVersion,
  colorTheme: (storedPrefs.colorTheme === "dark" ? "dark" : storedPrefs.colorTheme === "system" && !isWallpaper ? "system" : "light") as "light" | "dark" | "system",
  motion: normalizeMotion(storedPrefs.motion, storedPrefs.reduced),
};
function effectiveReduced() { return prefs.motion === "system" ? systemReduced : prefs.motion === "reduced"; }
function themeIsDark() { return prefs.colorTheme === "dark" || (prefs.colorTheme === "system" && systemDark); }
// Wallpaper Engine sets reduced motion itself; the other hosts may follow the system live.
if (!isWallpaper) prefs.reduced = effectiveReduced();
// The new tab starts silent for everyone (including earlier versions, where sound
// was on by default); sound plays only after the user turns it on.
if (isExtension && storedPrefs.audioDefaultsVersion !== 1) {
  prefs.sound = false;
  prefs.music = false;
}
const SETTINGS_KEY = "rhine-settings";
const snapshotPrefs = (values: object) => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, JSON.stringify(value)]));
// What this page last read or wrote. Only keys it changed since then replace the
// stored values, so several open new tabs never undo each other's settings.
let persistedPrefs: Record<string, string> = snapshotPrefs(storedPrefs);
function persistPrefs() {
  try {
    const stored = readLocal<unknown>(SETTINGS_KEY, {});
    const latest = stored && typeof stored === "object" && !Array.isArray(stored) ? stored as Record<string, unknown> : {};
    const next: Record<string, unknown> = { ...prefs, ...latest };
    for (const [key, value] of Object.entries(prefs)) if (JSON.stringify(value) !== persistedPrefs[key]) next[key] = value;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    persistedPrefs = snapshotPrefs(prefs);
  } catch { /* Session only. */ }
}
if (isExtension && (storedPrefs.bookmarkClarityVersion !== 1 || storedPrefs.audioDefaultsVersion !== 1)) persistPrefs();
paintTheme(themeIsDark() ? 1 : 0);
const rollingMotion = {
  duration: 460,
  motionBlur: true,
  animated: !prefs.reduced,
};
const updateFooterClock = createRollingClock($("#clock"));
const numberOptions = {
  ...rollingMotion,
  locales: "en-US",
  format: { minimumIntegerDigits: 2, useGrouping: false },
};
const fileCounter = createRollingNumber($("#selected-number"), {
  ...numberOptions,
  value: 1,
});
const columnCounter = createRollingNumber($("#column-index"), {
  ...numberOptions,
  value: 3,
});
const codeOptions = {
  ...numberOptions,
  format: { minimumIntegerDigits: 3, useGrouping: false },
  value: 1,
};
const textOptions = {
  ...rollingMotion,
  transition: "direct" as const,
  stagger: "none" as const,
};
const selectionTitle = createRollingText($("#selected-title"), {
  ...textOptions,
  text: $("#selected-title").textContent ?? "",
});
const columnTitle = createRollingText($("#column-name"), {
  ...textOptions,
  text: $("#column-name").textContent ?? "",
});
const hoverTitle = createRollingText($("#hover-title"), { ...textOptions, text: "" });
const categoryTitle = createRollingText($("#archive-category"), {
  ...textOptions,
  text: $("#archive-category").textContent ?? "",
});
const clearanceTitle = createRollingText($("#selected-clearance"), {
  ...textOptions,
  text: $("#selected-clearance").textContent ?? "",
});
const rollingTitles = [selectionTitle, columnTitle, hoverTitle, categoryTitle, clearanceTitle];
const selectedCode = createRollingNumber($("#selected-code"), codeOptions);
const hoverCode = createRollingNumber($("#hover-code"), codeOptions);
const audio = new TerminalAudio();
let musicSuppressed = false;
function configureAudio() { audio.configure({ ...prefs, music: prefs.music && !musicSuppressed }); }
configureAudio();
const reviewEntry = reviewParams.has("scene") || reviewParams.has("time") || reviewParams.get("review") === "1";
let started = false;
let bootReady = false;
let pendingEntry: Mode | undefined;
let namePromptActive = false;
let namePromptDestination: Mode | undefined;
let nameComposing = false;
function syncUserName() {
  document.querySelectorAll<HTMLElement>('[data-user-name]').forEach(node => {
    node.textContent = userNameProfile.name;
    node.title = userNameProfile.name;
  });
}
function saveUserName(value: string) {
  userNameProfile = { name: normalizeUserName(value), confirmed: true };
  let persisted = false;
  try { persisted = writeUserName(localStorage, userNameProfile.name); } catch { /* Session only. */ }
  syncUserName();
  if (!persisted) notify('名称已用于当前页面，但未能保存；下次打开可能需要重新输入。');
}
function beginNamePrompt(destination?: Mode) {
  if (namePromptActive) return;
  namePromptActive = true;
  namePromptDestination = destination;
  bootStart = performance.now() / 1000 - USER_NAME_BOOT_TIME;
  $('#stage').dataset.userNamePrompt = 'true';
  delete $('#stage').dataset.directEntry;
  $('#user-name-prompt').hidden = false;
  bootSequence.update(USER_NAME_BOOT_TIME, '');
  $<HTMLInputElement>('#boot-user-name').focus({ preventScroll: true });
}
function finishNamePrompt() {
  namePromptActive = false;
  $('#user-name-prompt').hidden = true;
  delete $('#stage').dataset.userNamePrompt;
  bootStart = performance.now() / 1000 - USER_NAME_BOOT_TIME;
  const destination = namePromptDestination;
  namePromptDestination = undefined;
  if (destination) {
    if (activeBookmarkStartup === 'direct') $('#stage').dataset.directEntry = 'true';
    setMode(destination);
  } else $('#skip').focus({ preventScroll: true });
}
if (isExtension) {
  const prompt = $<HTMLFormElement>('#user-name-prompt');
  prompt.addEventListener('compositionstart', () => { nameComposing = true; });
  prompt.addEventListener('compositionend', () => { nameComposing = false; });
  prompt.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!event.isComposing && !nameComposing && event.keyCode !== 229) prompt.requestSubmit();
    }
  });
  prompt.addEventListener('submit', event => {
    event.preventDefault();
    if (!namePromptActive || nameComposing) return;
    saveUserName($<HTMLInputElement>('#boot-user-name').value);
    finishNamePrompt();
  });
  window.addEventListener('storage', event => {
    if (event.key !== USER_NAME_KEY) return;
    userNameProfile = loadUserName();
    syncUserName();
    if (namePromptActive && userNameProfile.confirmed) finishNamePrompt();
  });
}
let activeBookmarkStartup: OpeningMode = isExtension ? openingModeForPage() : "full";
const prepareDuringOpening = !isWallpaper && !reviewEntry;
const preparation = { phase: "loading", compileMs: 0, totalMs: 0, firstVisibleFrameMs: 0 };
const preparationStatus = document.createElement("div");
preparationStatus.className = "presentation-status";
preparationStatus.setAttribute("role", "status");
preparationStatus.hidden = true;
$("#viewport").append(preparationStatus);
function showPreparation() {
  if (preparation.phase === "error") return;
  preparationStatus.hidden = false;
  preparationStatus.textContent = "正在准备三维档案…";
}
const loading = $("#loading");
// The entry screen uses the actual viewport, including portrait phones; the
// reference animation still uses its calibrated 1920 x 1080 stage.
$("#viewport").append(loading);
$("#stage").inert = true;
$(".mobile-entry").inert = true;
const entry = !isWallpaper && !reviewEntry && (!isExtension || activeBookmarkStartup === "full") && (prefs.sound || prefs.music) ? new StartupGate({
  root: loading,
  unlock: () => audio.unlock(),
  cancel: () => audio.cancelEntry(),
  start: silent => completeStartup(silent),
}) : undefined;
if (entry) {
  audio.holdForEntry();
  if (prefs.music) void audio.prepareMusic().catch(() => { /* Entry offers retry. */ });
}
let audioPreview = false, audioPreviewRequest = 0;
let scene: ArchiveScene | undefined;
let threeState: "on" | "closing" | "off" | "loading" = "on";
let threeFallback: "unavailable" | "lost" | undefined;
let resumeCell: { lane: number; row: number } | undefined;
let resumeSelection = -1;
let viewer: ModelViewer | undefined;
const accessLog: { id: string; time: string }[] = [];
const columnMemory = archiveColumns.map((_, lane) => columnFiles(lane)[0]);
function recordAccess() {
  accessLog.unshift({
    id: records[selected].id,
    time: new Date().toLocaleTimeString("en-GB"),
  });
}
function saveAudioPrefs() {
  persistPrefs();
  configureAudio();
}
function syncSoundButton() {
  const button = document.querySelector<HTMLButtonElement>('[data-action="toggle-sound"]');
  if (!button) return;
  const audible = prefs.sound || prefs.music;
  button.dataset.muted = String(!audible);
  button.setAttribute("aria-label", audible ? "关闭声音" : "开启声音");
  button.title = audible ? "关闭声音" : "开启声音";
  button.querySelector(".settings-label")!.textContent = audible ? "声音" : "静音";
}
/** The nav button mutes everything, then restores the last audible combination. */
function toggleSound() {
  if (prefs.sound || prefs.music) {
    prefs.unmuteSound = prefs.sound;
    prefs.unmuteMusic = prefs.music;
    prefs.sound = prefs.music = false;
  } else {
    prefs.music = prefs.unmuteMusic;
    prefs.sound = prefs.unmuteSound || !prefs.unmuteMusic;
  }
  // The click is the user activation that lets the browser start audio.
  saveAudioPrefs();
  syncSoundButton();
  if (prefs.sound) audio.play("confirm");
}
function superPerformanceEnabled() { return isWallpaper ? wallpaperHost()?.properties.superperformance?.value === true : prefs.superPerformance; }
function effectiveRenderQuality() { return superPerformanceEnabled() ? superPerformanceQuality : prefs.rendering; }
function savePrefs() {
  saveAudioPrefs();
  applyPrefs();
}
/** Apply the current preferences without storing them (used for changes made in another page). */
function applyPrefs() {
  if (prefs.reduced) {
    rollingTitles.forEach(title => title.finish());
    detailTransition.finish();
    modalTransition?.finish();
    tabTransition.cancel();
    bookmarkFeedback?.cancel();
  }
  scene?.setReduced(prefs.reduced);
  scene?.setIdleBreathing(isWallpaper ? Infinity : idleBreathingSeconds(prefs.idleMotion));
  scene?.setTheme(themeIsDark(), prefs.reduced || !started);
  document.querySelectorAll<HTMLElement>("[data-color-theme]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.colorTheme === prefs.colorTheme)));
  scene?.setSuperPerformance(superPerformanceEnabled());
  viewer?.setSuperPerformance(superPerformanceEnabled());
  scene?.setQuality(effectiveRenderQuality());
  viewer?.setQuality(effectiveRenderQuality());
  syncQualityUI(prefs.rendering);
  updateQualitySummary();
  fileCounter.update({ animated: !prefs.reduced && mode === "archive" });
  rollingTitles.forEach(title => title.update({ animated: !prefs.reduced && mode === "archive" }));
  columnCounter.update({ animated: !prefs.reduced && mode === "archive" });
  selectedCode.update({ animated: !prefs.reduced && mode === "archive" });
  hoverCode.update({ animated: !prefs.reduced && mode === "archive" });
  $("#stage").classList.toggle("reduce-motion", prefs.reduced);
  syncWallpaperBackground();
}
let previousLayout = "";
function fit() {
  const stage = $("#stage");
  const viewport = $("#viewport");
  const coarse = matchMedia("(pointer: coarse)").matches;
  const reference = reviewParams.has("time") || reviewParams.get("review") === "1";
  const { width, height, scale, kind } = mode === "boot" && !reference
    ? openingLayout(viewport.clientWidth, viewport.clientHeight)
    : viewportLayout(viewport.clientWidth, viewport.clientHeight, coarse, mode === "boot");
  stage.style.width = `${width}px`;
  stage.style.height = `${height}px`;
  const nativeText = isExtension && mode !== 'boot';
  stage.style.zoom = nativeText ? String(scale) : '1';
  stage.style.left = stage.style.top = nativeText ? '0' : '50%';
  stage.style.transform = nativeText ? 'none' : `translate(-50%, -50%) scale(${scale})`;
  stage.style.setProperty('--bookmark-ui-unit', `${1 / scale}px`);
  stage.dataset.layout = kind;
  stage.dataset.touch = String(coarse);
  viewport.dataset.mobileBoot = String(mode === "boot" && (coarse || viewport.clientWidth < 1100));
  stage.style.setProperty("--stage-scale", String(scale));
  stage.style.setProperty("--opening-scan-scale", String(Math.min(1, width / 1920)));
  stage.dataset.openingPortrait = String(width < height);
  // The software keyboard resizes dialogs without recomposing the 3D scene.
  const visible = window.visualViewport;
  const stageTop = (viewport.clientHeight - height * scale) / 2;
  stage.style.setProperty("--modal-top", `${Math.max(0, (visible?.offsetTop ?? 0) - stageTop) / scale}px`);
  stage.style.setProperty("--modal-height", `${Math.min(height, (visible?.height ?? viewport.clientHeight) / scale)}px`);
  $("#viewport").style.setProperty("--scale", String(scale));
  reserveNavigation();
  const marks = document.querySelector("#inspection-marks");
  marks?.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const layoutKey = JSON.stringify([width, height, scale, kind, devicePixelRatio]);
  if (layoutKey !== previousLayout) {
    previousLayout = layoutKey;
    scene?.resize();
    viewer?.resize();
  }
  updateQualitySummary();
  // Re-measure line covers and tab underline after wrapping changes.
  requestAnimationFrame(() => {
    documentDecryption.refresh();
    const tab = document.querySelector<HTMLElement>(".detail-tabs button.active");
    const indicator = document.querySelector<HTMLElement>(".tab-indicator");
    if (tab && indicator) indicator.style.transform = `translateX(${tab.offsetLeft}px) scaleX(${tab.offsetWidth})`;
  });
}
/** Keep the centered search clear of the navigation buttons at every aspect ratio. */
function reserveNavigation() {
  if (!isExtension || mode === "boot") return;
  const stage = $("#stage"), nav = $(".system-nav");
  const zoom = parseFloat(stage.style.zoom) || 1;
  const stageRect = stage.getBoundingClientRect(), navRect = nav.getBoundingClientRect();
  if (navRect.width) stage.style.setProperty("--nav-reserve", `${Math.ceil((stageRect.right - navRect.left) / zoom) + 24}px`);
}
if (isExtension) new ResizeObserver(() => reserveNavigation()).observe($(".system-nav"));
/** Settings saved by another open page. Wallpaper settings are owned by the host. */
function applyStoredPrefs(value: string | null) {
  let next: Record<string, unknown> | null = null;
  try { next = JSON.parse(value ?? "null"); } catch { return; }
  if (!next || typeof next !== "object" || Array.isArray(next)) return;
  for (const key of ["sound", "music", "quality", "superPerformance", "unmuteSound", "unmuteMusic"] as const)
    if (typeof next[key] === "boolean") prefs[key] = next[key] as boolean;
  for (const key of ["soundVolume", "musicVolume"] as const)
    if (typeof next[key] === "number" && Number.isFinite(next[key])) prefs[key] = Math.max(0, Math.min(1, next[key] as number));
  if ("renderPace" in next) prefs.renderPace = normalizeRenderPace(next.renderPace);
  if ("idleMotion" in next) prefs.idleMotion = normalizeIdleMotion(next.idleMotion);
  if ("motion" in next) prefs.motion = normalizeMotion(next.motion, undefined);
  if (next.colorTheme === "light" || next.colorTheme === "dark" || next.colorTheme === "system") prefs.colorTheme = next.colorTheme;
  if (next.rendering && typeof next.rendering === "object") prefs.rendering = normalizeQuality(next.rendering as RenderQuality, next.quality !== false);
  prefs.reduced = effectiveReduced();
  persistedPrefs = snapshotPrefs(prefs);
  configureAudio();
  applyPrefs();
  syncSoundButton();
  syncSettingsControls();
}
/** Keep an open settings panel in step with values changed elsewhere. */
function syncSettingsControls() {
  document.querySelectorAll<HTMLInputElement>("#modal-root input[data-pref]").forEach(input => {
    const value = prefs[input.dataset.pref as keyof typeof prefs];
    if (typeof value === "boolean") input.checked = value;
  });
  for (const key of ["soundVolume", "musicVolume"] as const) {
    const input = document.querySelector<HTMLInputElement>(`[data-volume="${key}"]`);
    if (input) { input.value = String(Math.round(prefs[key] * 100)); input.closest("label")?.querySelector("output")?.replaceChildren(`${input.value}%`); }
  }
  for (const [id, value] of [["render-pace", prefs.renderPace], ["idle-motion", prefs.idleMotion], ["motion-preference", prefs.motion]]) {
    const select = document.getElementById(id) as HTMLSelectElement | null;
    if (select) select.value = value;
  }
  const note = document.querySelector("#motion-preference-note");
  if (note) note.outerHTML = motionSettingsMarkup();
}
if (!isWallpaper) window.addEventListener("storage", event => {
  if (event.storageArea !== localStorage) return;
  if (event.key === SETTINGS_KEY) applyStoredPrefs(event.newValue);
  else if (event.key === savedStore) syncSavedFromStorage();
  else if (event.key === "rhine-bookmark-covers") { reloadCoverPreferences(); scene?.refreshBookmarkCovers(); }
  else if (event.key === "rhine-bookmark-open-mode") reloadBookmarkOpenMode();
  // The Chrome Store build keeps no search provider of its own.
  else if (!isChromeStore && event.key === "rhine-search-engine") reloadSearchEngine();
  else if (event.key === "rhine-bookmark-startup") reloadBookmarkStartupMode();
  else if (event.key === "rhine-bookmark-summary-logo") reloadBookmarkSummaryLogo();
  else if (event.key === "rhine-bookmark-other-roots" && isExtension) {
    reloadBookmarkScope();
    window.dispatchEvent(new CustomEvent("rhine-bookmarks-changed", { detail: "书签显示范围已更改" }));
  }
});
if (!isWallpaper) {
  systemReducedMotion.addEventListener("change", event => {
    systemReduced = event.matches;
    const select = document.querySelector<HTMLSelectElement>("#motion-preference");
    if (select) select.options[0].textContent = `跟随系统（当前${systemReduced ? "减少" : "完整"}）`;
    if (prefs.motion !== "system") return;
    prefs.reduced = effectiveReduced();
    savePrefs();
    const note = document.querySelector("#motion-preference-note");
    if (note) note.outerHTML = motionSettingsMarkup();
  });
  systemDarkScheme.addEventListener("change", event => {
    systemDark = event.matches;
    if (prefs.colorTheme === "system") savePrefs();
  });
}
window.addEventListener("resize", fit);
// Moving to a screen with a different density need not change CSS viewport size.
function watchPixelDensity() {
  matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener('change', () => {
    fit(); watchPixelDensity();
  }, { once: true });
}
watchPixelDensity();
window.visualViewport?.addEventListener("resize", fit);
window.visualViewport?.addEventListener("scroll", fit);
matchMedia("(pointer: coarse)").addEventListener("change", fit);
fit();
$("#file-ticks").innerHTML = columnFiles(fileLocation(selected).lane)
  .map(
    (index) => `<button data-select="${index}"></button>`,
  )
  .join("");
let fileTicks = [...$("#file-ticks").querySelectorAll<HTMLButtonElement>("button")];

function setMode(next: Mode) {
  if (isExtension && !reviewEntry && started && !userNameProfile.confirmed && next !== 'boot') {
    beginNamePrompt(next);
    return;
  }
  if (next !== "boot" && !ready) {
    pendingEntry = next;
    showPreparation();
    return;
  }
  if (workbench?.enabled && next === "detail") next = "archive";
  const previousMode = mode;
  rollingTitles.forEach(title => title.update({ animated: !prefs.reduced && next === "archive" }));
  if (next !== "archive") {
    rollingTitles.forEach(title => title.finish());
    hoverCode.finish();
    $("#hover-label").hidden = true;
  }
  if (next === "detail" && mode !== "detail") recordAccess();
  mode = next;
  if (isExtension && previousMode === "boot" && next !== "boot") markDailyOpeningShown();
  syncWallpaperBackground();
  audio.setScene(next);
  if (next !== "boot" && audioPreview) {
    audioPreview = false;
    audioPreviewRequest++;
    configureAudio();
  }
  $("#stage").dataset.mode = next;
  workbench?.syncVisibility();
  if (previousMode !== next) fit();
  $("#boot").inert = next !== "boot";
  $("#boot").setAttribute("aria-hidden", String(next !== "boot"));
  $("#archive-ui").inert = next !== "archive" || Boolean(modal) || Boolean(workbench?.enabled);
  $("#archive-ui").setAttribute("aria-hidden", String(next !== "archive" || Boolean(workbench?.enabled)));
  $(".system-nav").inert = next === "boot" || Boolean(modal);
  $(".system-footer").inert = next === "boot" || Boolean(modal);
  if (next === "detail") {
    if (previousMode !== "detail") detailTransition.show(prefs.reduced);
  } else if (previousMode === "detail" || (next === "boot" && !$("#detail-ui").hidden)) {
    pendingDetailFocus = false;
    tabTransition.cancel();
    detailTransition.hide(prefs.reduced || next === "boot");
    if (!modal && next === "archive") $(".read-file").focus({ preventScroll: true });
  }
  $("#detail-ui").inert = next !== "detail" || Boolean(modal);
  scene?.setMode(next === "boot" ? "hidden" : next);
  if (next !== "boot") {
    bootSequence.reset();
    $(".file-title").firstChild!.textContent = "FILE NUMBER: ";
    $("#stage").dataset.boot = "done";
    $(".callout-rule").style.removeProperty("transform");
    if (isExtension && activeBookmarkStartup === "direct") scene?.revealImmediately();
  }
  if (next === "detail" && previousMode !== "detail") {
    renderDetail();
    pendingDetailFocus = true;
    if (!scene) {
      $("#detail-content").style.opacity = "1";
      $("#detail-content").style.translate = "0 0";
      $("#detail-content").inert = false;
    }
  }
}
function select(index: number, navigation?: ArchiveNavigation) {
  selected = (index + records.length) % records.length;
  columnMemory[fileLocation(selected).lane] = selected;
  if (mode === "detail") setMode("archive");
  activeTab = "overview";
  scene?.select(selected, navigation);
  updateSelection(navigation);
  const columnMove = navigation && "axis" in navigation && navigation.axis === "lane";
  audio.play(columnMove ? "column" : "tick", columnMove ? navigation.direction * .45 : 0);
}
function stepFile(direction: number) {
  const files = columnFiles(fileLocation(selected).lane);
  if (files.length < 2) return;
  select(
    files[(files.indexOf(selected) + direction + files.length) % files.length],
    { axis: "row", direction },
  );
}
function stepColumn(direction: number) {
  const lane = fileLocation(selected).lane;
  const next = wrap(lane + direction, archiveColumns.length);
  select(columnMemory[next], { axis: "lane", direction });
}
function updateSelection(navigation?: ArchiveNavigation) {
  const r = records[selected];
  const { lane } = fileLocation(selected);
  const files = columnFiles(lane);
  const tickStart = Math.max(0, Math.min(files.length - 8, files.indexOf(selected) - 3));
  const tickFiles = files.slice(tickStart, tickStart + 8);
  if (fileTicks.length !== tickFiles.length) {
    $("#file-ticks").innerHTML = tickFiles.map(() => '<button type="button"></button>').join('');
    fileTicks = [...$("#file-ticks").querySelectorAll<HTMLButtonElement>('button')];
  }
  selectionTitle.update({ text: isExtension ? bookmarkDisplayTitle(r) : r.title, animated: !prefs.reduced && mode === "archive" });
  $("#selected-title").title = isExtension ? bookmarkDisplayTitle(r) : r.title;
  if (isExtension) { updateBookmarkSummary(r); updateBookmarkFolderPosition(selected); }
  if (isExtension) $("#stage").style.setProperty("--bookmark-column-color", "#" + bookmarkColumnColor(r.category).getHexString());
  clearanceTitle.update({ text: r.clearance, animated: !prefs.reduced && mode === "archive" });
  categoryTitle.update({ text: r.category, animated: !prefs.reduced && mode === "archive" });
  const direction =
    navigation && "axis" in navigation
      ? navigation.direction > 0
        ? "up"
        : "down"
      : "auto";
  selectedCode.update({
    value: Number(r.id.slice(2)),
    animated: !prefs.reduced && mode === "archive",
    direction,
  });
  fileCounter.update({
    value: files.indexOf(selected) + 1,
    animated: !prefs.reduced && mode === "archive",
    direction:
      navigation && "axis" in navigation && navigation.axis === "row"
        ? direction
        : "auto",
  });
  $(".count-total").textContent = String(files.length).padStart(2, "0");
  columnCounter.update({
    value: lane + 1,
    animated: !prefs.reduced && mode === "archive",
    direction:
      navigation && "axis" in navigation && navigation.axis === "lane"
        ? direction
        : "auto",
  });
  columnTitle.update({ text: archiveColumns[lane], animated: !prefs.reduced && mode === "archive" });
  $<HTMLButtonElement>('[data-action="column-prev"]').disabled = archiveColumns.length < 2;
  $<HTMLButtonElement>('[data-action="column-next"]').disabled = archiveColumns.length < 2;
  $("#column-total").textContent = String(archiveColumns.length).padStart(2, '0');
  $("#archive-ui").dataset.bookmarkId = r.bookmarkId ?? '';
  fileTicks.forEach((button, slot) => {
    const index = tickFiles[slot], record = records[index];
    button.dataset.select = String(index);
    button.setAttribute("aria-label", `选择档案 ${record.id} ${isExtension ? bookmarkDisplayTitle(record) : record.title}`);
    button.title = `${record.id} · ${isExtension ? bookmarkDisplayTitle(record) : record.title}`;
    button.classList.toggle("selected", index === selected);
    button.setAttribute("aria-pressed", String(index === selected));
  });
  $("#saved-count").textContent = String(saved.size).padStart(2, "0");
}
function replayBoot(forcePreview = false) {
  if (!ready) return;
  closeModal(() => replayBootAfterModal(forcePreview));
}
function replayBootAfterModal(forcePreview: boolean) {
  activeBookmarkStartup = "full"; // Explicit replay always plays the full authored opening.
  delete $("#stage").dataset.directEntry;
  bootStart = performance.now() / 1000 - 1.76;
  frozenTime = null;
  lastStep = "";
  setMode(prefs.reduced && !forcePreview ? "archive" : "boot");
  audio.restartBoot();
  scene?.select(0);
  selected = 0;
  updateSelection();
  if (!forcePreview) audio.play("ui-tick");
}
function openFile() {
  if (isExtension) {
    const record = records[selected];
    if (record.bookmarkUrl) openBookmarkDestination(record.bookmarkUrl);
    else notify(record.empty ? '此文件夹暂无书签。' : '此书签地址不能在起始页中打开。');
    return;
  }
  inspectFile();
}
function inspectFile() {
  if (!ready) return;
  closeModal(() => {
    setMode("detail");
    audio.play("open");
  });
}
function readSavedIds() {
  const stored = readLocal<unknown>(savedStore, null);
  return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : null;
}
function syncSavedButton() {
  $("#saved-count").textContent = String(saved.size).padStart(2, "0");
  const button = document.querySelector<HTMLButtonElement>('[data-action="bookmark"]');
  if (!button) return;
  const added = saved.has(savedKey(records[selected]));
  button.firstChild!.textContent = added ? "− REMOVE FROM SAVED" : "＋ SAVE ARCHIVE";
  button.querySelector("span")!.textContent = added ? "已收藏" : "收藏档案";
  button.setAttribute("aria-pressed", String(added));
}
/** Favorites changed in another open page replace this page's copy. */
function syncSavedFromStorage() {
  const ids = readSavedIds();
  saved.clear();
  ids?.forEach(id => saved.add(id));
  syncSavedButton();
  if (modal === "saved") renderResults();
}
function toggleSaved() {
  const id = savedKey(records[selected]);
  // Start from the stored list so favorites added in another page are kept.
  const latest = readSavedIds();
  if (latest) { saved.clear(); latest.forEach(value => saved.add(value)); }
  if (saved.has(id)) saved.delete(id);
  else saved.add(id);
  try {
    localStorage.setItem(savedStore, JSON.stringify([...saved]));
  } catch {}
  syncSavedButton();
  const button = $<HTMLButtonElement>('[data-action="bookmark"]');
  bookmarkFeedback?.cancel();
  if (!prefs.reduced) bookmarkFeedback = button.animate(
    [{ backgroundColor: "#67634c" }, { backgroundColor: "#252820" }],
    { duration: 220, easing: "ease-out" },
  );
  audio.play("confirm");
  notify(saved.has(id) ? "档案已加入收藏" : "已取消收藏");
}
function renderDetail() {
  tabTransition.cancel();
  const r = records[selected];
  $("#object-id").textContent = "NO." + String(selected + 1).padStart(3, "0");
  $("#detail-content").innerHTML = `
  <div class="detail-kicker"><span>FILE ${r.id}</span><span>${escapeHtml(r.clearance)}</span></div>
  <h2>${escapeHtml(r.en)}</h2><div class="detail-title-cn">${escapeHtml(r.title)}<span>${escapeHtml(r.category)}</span></div>
  <div class="detail-rule"></div>
  <dl class="metadata"><div><dt>DEPARTMENT / 科室</dt><dd>${escapeHtml(r.department)}</dd></div><div><dt>COLLECTION / 编目范围</dt><dd>${escapeHtml(r.date)}</dd></div><div><dt>RELATED / 相关人物</dt><dd>${escapeHtml(r.lead)}</dd></div><div><dt>STATUS / 状态</dt><dd><i></i>${r.clearance === "RESTRICTED" ? "目录访问" : "已归档 · 可读取"}</dd></div></dl>
  <div class="detail-tabs" role="tablist"><button id="tab-overview" class="active" role="tab" aria-controls="tab-panel" aria-selected="true" data-tab="overview">01 <span>概述</span></button><button id="tab-notes" role="tab" aria-controls="tab-panel" aria-selected="false" data-tab="notes">02 <span>研究记录</span></button><button id="tab-history" role="tab" aria-controls="tab-panel" aria-selected="false" data-tab="history">03 <span>访问日志</span></button><i class="tab-indicator" aria-hidden="true"></i></div>
  <div id="tab-panel" class="tab-panel" role="tabpanel">${overview()}</div>
  <div class="detail-actions"><button class="solid-button" data-action="bookmark">${saved.has(savedKey(r)) ? "− REMOVE FROM SAVED" : "＋ SAVE ARCHIVE"}<span>${saved.has(savedKey(r)) ? "已收藏" : "收藏档案"}</span></button>${isExtension ? `<button class="export-button" data-action="open">OPEN WEBSITE <span>↗</span></button>` : `<a class="export-button" href="${assetUrl(`archives/RHINE-LAB-${r.id}.txt`)}" download="RHINE-LAB-${r.id}.txt" aria-label="导出 ${r.id} 档案">EXPORT <span>↓</span></a>`}</div>
  <div class="detail-footnote">${isExtension ? '<button data-action="open">打开书签 ↗</button>' : `<a href="${escapeHtml(r.source)}" target="_blank" rel="noopener">设定参考 ↗</a>`}<span>${String(selected + 1).padStart(3, "0")} / ${String(records.length).padStart(3, "0")}</span></div>`;
  $("#detail-content").setAttribute("tabindex", "-1");
  $('[data-action="bookmark"]').setAttribute("aria-pressed", String(saved.has(savedKey(r))));
  documentDecryption.reset($("#detail-content"), prefs.reduced || !scene || scene.decryptionFrame.phase === "clear");
  setTab(activeTab, false);
}
function overview() {
  return `<div class="panel-label">ABSTRACT / 摘要</div><p>${escapeHtml(records[selected].abstract)}</p>`;
}
function setTab(tab: string, sound = true) {
  if (sound && tab === activeTab) return;
  activeTab = tab;
  document.querySelectorAll("[data-tab]").forEach((b) => {
    const active = (b as HTMLElement).dataset.tab === tab;
    b.classList.toggle("active", active);
    b.setAttribute("aria-selected", String(active));
    b.setAttribute("tabindex", active ? "0" : "-1");
  });
  const r = records[selected];
  const tabButton = $<HTMLButtonElement>(`[data-tab="${tab}"]`);
  const indicator = $(".tab-indicator");
  indicator.style.transition = sound ? "" : "none";
  indicator.style.transform = `translateX(${tabButton.offsetLeft}px) scaleX(${tabButton.offsetWidth})`;
  $("#tab-panel").setAttribute("aria-labelledby", tabButton.id);
  $("#tab-panel").innerHTML =
    tab === "overview"
      ? overview()
      : tab === "notes"
        ? `<div class="panel-label">RESEARCH NOTES / 研究记录</div><ol class="research-notes">${r.findings.map((f, i) => `<li><span>${String(i + 1).padStart(2, "0")}</span>${escapeHtml(f)}</li>`).join("")}</ol>`
        : `<div class="panel-label">ACCESS LOG / 本次访问</div>${accessLog
            .filter((entry) => entry.id === r.id)
            .slice(0, 4)
            .map(
              (entry) =>
                `<div class="log-row"><span>${entry.time}</span><span>${escapeHtml(userNameProfile.name)}</span><b>READ AUTHORIZED</b></div>`,
            )
            .join(
              "",
            )}<p class="log-note">本次会话已通过身份验证。档案内容以当前终端可访问范围展示。</p>`;
  $("#tab-panel").scrollTop = 0;
  documentDecryption.refresh();
  if (sound) {
    tabTransition.reveal($("#tab-panel"), prefs.reduced);
    audio.play("ui-tick");
  }
}
function notify(message: string) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 2600);
}

function openModal(kind: NonNullable<typeof modal>) {
  if (!ready) return;
  if (!modal) {
    previousFocus = document.activeElement as HTMLElement;
    modalSiblings = [...$("#stage").children]
      .filter((node): node is HTMLElement => node instanceof HTMLElement && node.id !== "modal-root")
      .map((node) => ({ node, inert: node.inert }));
    modalSiblings.forEach(({ node }) => (node.inert = true));
  }
  modalClosing = false;
  modal = kind;
  searchQuery = "";
  filter = "全部档案";
  audio.play("page-open");
  renderModal();
}
function closeModal(afterClose?: () => void) {
  if (!modal) {
    afterClose?.();
    return;
  }
  if (modalClosing) return;
  modalClosing = true;
  audio.play("page-close");
  modalTransition!.hide(prefs.reduced, () => {
    resultObserver?.disconnect();
    modal = null;
    modalClosing = false;
    $("#modal-root").replaceChildren();
    modalTransition = undefined;
    modalSiblings.forEach(({ node, inert }) => (node.inert = inert));
    modalSiblings = [];
    $("#archive-ui").inert = mode !== "archive" || Boolean(workbench?.enabled);
    $("#detail-ui").inert = mode !== "detail";
    previousFocus?.focus({ preventScroll: true });
    afterClose?.();
  });
}
function renderModal() {
  if (!modal) return;
  modalTransition?.dispose();
  $("#modal-root").innerHTML =
    `<div class="modal-backdrop"><section class="terminal-modal ${modal === "settings" ? "settings-modal" : ""}" role="dialog" aria-modal="true" aria-label="${modal === "settings" ? "系统设置" : modal === "saved" ? "收藏档案" : "档案检索"}"><div class="modal-top"><span>RHINE LAB / ${modal === "settings" ? "SYSTEM PREFERENCES" : "ARCHIVE DIRECTORY"}</span><button data-action="close-modal" aria-label="关闭窗口">CLOSE <span>×</span></button></div>${modal === "settings" ? settingsMarkup() : `<h2>${modal === "saved" ? "SAVED ARCHIVES" : "ARCHIVE INDEX"}<small>${modal === "saved" ? "收藏档案" : "内部档案检索"}</small></h2><div class="search-field"><span>⌕</span><input id="archive-search" type="search" autocomplete="off" placeholder="${isExtension ? "检索书签名称、网址或文件夹" : "输入档案编号、名称或科室"}" aria-label="检索档案"/><span class="key">ESC</span></div><div class="category-filters">${categories.map((c, i) => `<button data-filter="${escapeHtml(c)}" class="${i === 0 ? "active" : ""}">${escapeHtml(c)}</button>`).join("")}</div><div class="result-header"><span>FILE / 档案</span><span>DEPARTMENT / 科室</span><span>ACCESS</span></div><div id="search-results" class="search-results"></div><div class="modal-bottom"><span id="result-count"></span><span>INTERNAL DATABASE <i>●</i> CONNECTED</span></div>`}</section></div>`;
  const backdrop = $(".modal-backdrop");
  backdrop.hidden = true;
  modalTransition = new SurfaceTransition(backdrop, $(".terminal-modal"));
  modalTransition.show(prefs.reduced);
  if (modal === "settings") updateQualitySummary();
  if (modal !== "settings") {
    renderResults();
    requestAnimationFrame(() => {
      if (backdrop.isConnected && !modalClosing) $("#archive-search").focus();
    });
  } else
    requestAnimationFrame(() => {
      if (backdrop.isConnected && !modalClosing) $('[data-action="close-modal"]').focus();
    });
  $("#modal-root")
    .querySelector(".modal-backdrop")
    ?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
}
// Large collections render the index in batches as it scrolls, not all rows per keystroke.
const RESULT_BATCH = 150;
let resultObserver: IntersectionObserver | undefined;
let resultTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleResults() {
  clearTimeout(resultTimer);
  if (records.length > 300) resultTimer = setTimeout(renderResults, 120);
  else renderResults();
}
function renderResults() {
  clearTimeout(resultTimer);
  resultObserver?.disconnect();
  const query = searchQuery.toLowerCase();
  const results = records
    .map((r, i) => ({ r, i }))
    .filter(
      ({ r }) =>
        (modal !== "saved" || saved.has(savedKey(r))) &&
        (filter === "全部档案" || r.category === filter) &&
        `${r.id} ${r.title} ${r.en} ${r.department} ${r.lead} ${r.bookmarkUrl ?? ""}`
          .toLowerCase()
          .includes(query),
    );
  const row = ({ r, i }: { r: typeof records[number]; i: number }) =>
    `<button class="result-row" data-result="${i}"><span class="result-name">${isExtension && r.bookmarkUrl ? bookmarkResultIcon(i) : ""}<b>${r.id}</b><span>${escapeHtml(isExtension ? bookmarkDisplayTitle(r) : r.title)}<small>${escapeHtml(r.en)}</small></span>${saved.has(savedKey(r)) ? "<i>＋</i>" : ""}</span><span>${escapeHtml(r.department)}</span><span>${r.clearance === "RESTRICTED" ? "CATALOG ONLY" : "AUTHORIZED"} <i>↗</i></span></button>`;
  const container = $("#search-results");
  let shown = Math.min(RESULT_BATCH, results.length);
  container.innerHTML = results.length
    ? results.slice(0, shown).map(row).join("")
    : `<div class="empty-results"><span>∅</span><strong>${modal === "saved" && !searchQuery ? "尚无收藏档案" : "没有匹配的档案"}</strong><p>${modal === "saved" && !searchQuery ? "读取档案时，选择 SAVE ARCHIVE 将其保存在此处。" : "尝试其他名称、档案编号，或切换科室分类。"}</p><button data-action="reset-search">${modal === "saved" ? "查看全部档案 →" : "重置检索 →"}</button></div>`;
  if (shown < results.length) {
    const more = document.createElement("div");
    more.className = "result-more";
    more.setAttribute("aria-hidden", "true");
    container.append(more);
    resultObserver = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      const next = Math.min(results.length, shown + RESULT_BATCH);
      more.insertAdjacentHTML("beforebegin", results.slice(shown, next).map(row).join(""));
      shown = next;
      if (shown >= results.length) { resultObserver?.disconnect(); more.remove(); }
      if (isExtension) refreshBookmarkResultIcons();
    }, { rootMargin: "400px 0px" });
    resultObserver.observe(more);
  }
  if (isExtension) refreshBookmarkResultIcons();
  $("#result-count").textContent =
    `${String(results.length).padStart(2, "0")} RECORDS FOUND`;
}
function updateQualitySummary() {
  const summary = document.querySelector("#quality-summary");
  if (!summary) return;
  if (!scene) { summary.textContent = threeFallback ? "三维显示暂不可用 · 画质设置将在三维恢复后生效" : "3D 已关闭 · 三维模型与渲染资源已释放"; return; }
  const canvas = scene.renderer.domElement;
  const metrics = JSON.parse(canvas.parentElement?.dataset.renderQuality ?? "{}");
  summary.textContent = `${superPerformanceEnabled() ? "超级性能模式已启用 · 画质设置暂被覆盖，关闭后恢复 · " : ""}实际渲染 ${canvas.width} × ${canvas.height} · ${effectiveRenderQuality().antialias === "smaa" ? "SMAA" : "原始抗锯齿"} · 纹理 ${metrics.anisotropy ?? 1}×${metrics.limited ? " · 已达到缓冲上限" : ""}${isExtension ? ` · 屏幕目标 ${Math.round(canvas.getBoundingClientRect().width * devicePixelRatio)} × ${Math.round(canvas.getBoundingClientRect().height * devicePixelRatio)}` : ""}`;
}
function motionSettingsMarkup() {
  const note = !prefs.reduced ? "当前使用完整动效。"
    : isWallpaper ? `当前已减少动态效果。${systemReduced ? "系统也请求减少动画，可仅为本站启用完整动效。" : "关闭上方开关可恢复完整动效。"}`
    : prefs.motion === "system" ? "当前跟随系统减少动态效果，可仅为本站启用完整动效。" : "当前已减少动态效果。";
  return `<div id="motion-preference-note" class="motion-preference-note"><p>${note}</p>${prefs.reduced ? '<button data-action="enable-motion">启用完整动效并重播 ↻</button>' : ""}</div>`;
}
/** Wallpaper Engine keeps its property toggle; other hosts follow the system unless the user chooses. */
function motionPreferenceMarkup() {
  if (isWallpaper) return `<label><div><strong>REDUCED MOTION</strong><span>跳过开机动画，简化选档、镜头和文字动效</span></div><input type="checkbox" data-pref="reduced" ${prefs.reduced ? "checked" : ""}/><i class="toggle"></i></label>`;
  const options: [MotionPreference, string][] = [["system", `跟随系统（当前${systemReduced ? "减少" : "完整"}）`], ["full", "始终完整"], ["reduced", "始终减少"]];
  return `<label><div><strong>动态效果 / MOTION</strong><span>减少动态效果会跳过开机动画，简化选档、镜头和文字动效</span></div><select id="motion-preference" aria-label="动态效果">${options.map(([value, label]) => `<option value="${value}" ${prefs.motion === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>`;
}
function settingsMarkup() {
  const group = (title: string, content: string, open = false) => `<details class="bookmark-settings-group" ${open ? 'open' : ''}><summary>${title}</summary><div class="bookmark-settings-content">${content}</div></details>`;
  const extensionBody = isExtension ? `<div class="bookmark-settings">
    ${group('01 / 浏览与搜索', `<div class="settings-list">${bookmarkSettingsMarkup('navigation')}</div>`, true)}
    ${group('02 / 书签显示', `<div class="settings-list">${bookmarkSettingsMarkup('display')}</div>`, true)}
    ${group('03 / 启动与动效', `<div class="settings-list"><label><div><strong>显示名称 / USER NAME</strong><span>用于开场与页脚；最多 24 个字符，留空恢复默认，仅保存在本机</span></div><input id="display-name" type="text" value="${escapeHtml(userNameProfile.name)}" placeholder="${DEFAULT_USER_NAME}" autocomplete="off" spellcheck="false" enterkeyhint="done"/></label>${bookmarkSettingsMarkup('startup')}${motionPreferenceMarkup()}</div>${motionSettingsMarkup()}`)}
    ${group('04 / 画面与性能', `<div class="settings-list">${renderCadenceMarkup(prefs.renderPace)}${idleMotionMarkup(prefs.idleMotion)}${themeSettingsMarkup(prefs.colorTheme, !isWallpaper)}${!isWallpaper ? `<label><div><strong>SUPER PERFORMANCE</strong><span>降低三维画质和渲染分辨率，保留完整动效；关闭后恢复原画质</span></div><input type="checkbox" data-pref="superPerformance" ${prefs.superPerformance ? "checked" : ""}/><i class="toggle"></i></label>` : ""}</div>${qualityMarkup(prefs.rendering)}`)}
    ${group('05 / 声音', `<div class="settings-list">${audioSettingsMarkup(prefs)}</div>`)}
  </div>` : '';
  return `<h2>SYSTEM SETTINGS<small>终端偏好设置</small></h2><p class="settings-intro"><b data-user-name>${escapeHtml(userNameProfile.name)}</b> <span>·</span> SESSION AUTHORIZED</p>${isWallpaper ? '<p class="wallpaper-settings-note">每次启动都会读取 Wallpaper Engine 中的设置。在此修改仅对当前运行生效，无法持久保存；如需保留，请在 Wallpaper Engine 的壁纸属性中调整。</p>' : ""}${isExtension ? extensionBody : `<div class="settings-list">${themeSettingsMarkup(prefs.colorTheme, !isWallpaper)}${!isWallpaper ? `<label><div><strong>SUPER PERFORMANCE</strong><span>降低三维画质和渲染分辨率，保留完整动效；关闭后恢复原画质</span></div><input type="checkbox" data-pref="superPerformance" ${prefs.superPerformance ? "checked" : ""}/><i class="toggle"></i></label>` : ""}${workbench?.settingsMarkup() ?? ""}${audioSettingsMarkup(prefs)}${motionPreferenceMarkup()}</div>${motionSettingsMarkup()}${!isWallpaper ? `<div class="settings-list">${renderCadenceMarkup(prefs.renderPace)}${idleMotionMarkup(prefs.idleMotion)}</div>` : ""}${qualityMarkup(prefs.rendering)}${pwaSettingsMarkup()}`}<div class="settings-shortcuts">${isWallpaper ? '<span>DESKTOP CONTROLS</span><p>拖动阵列或点击界面按钮浏览档案。桌面模式下，方向键与滚轮可能无法传入壁纸。</p>' : '<span>KEYBOARD CONTROLS</span><p><kbd>←</kbd><kbd>→</kbd> 切列 <kbd>↑</kbd><kbd>↓</kbd> 选档 <kbd>ENTER</kbd> 读取 <kbd>/</kbd> 检索 <kbd>ESC</kbd> 返回</p>'}</div><div class="settings-bottom">${!isWallpaper && document.fullscreenEnabled ? '<button data-action="fullscreen">FULLSCREEN <span>↗</span></button>' : ''}<button data-action="restart">REINITIALIZE SYSTEM <span>↻</span></button></div><div class="modal-bottom"><span>ANALYSIS OS / 1.0 · 使用 MiSans 字体（小米） <a href="${assetUrl("fonts/MiSans-license.pdf")}" target="_blank" rel="noopener">字体许可</a></span><span>POWERED BY RHINE LAB</span></div>`;
}

document.addEventListener("input", (e) => {
  const slider = e.target as HTMLInputElement;
  if (slider.dataset.quality) {
    const output = document.querySelector<HTMLOutputElement>(`[data-quality-output="${slider.dataset.quality}"]`);
    if (output) output.value = `${slider.value}%`;
  }
  const volume = e.target as HTMLInputElement;
  if (volume.dataset.volume === "musicVolume" || volume.dataset.volume === "soundVolume") {
    prefs[volume.dataset.volume] = Number(volume.value) / 100;
    volume.closest("label")?.querySelector("output")?.replaceChildren(`${volume.value}%`);
    saveAudioPrefs();
  }
  if ((e.target as HTMLElement).id === "archive-search") {
    searchQuery = (e.target as HTMLInputElement).value;
    scheduleResults();
  }
});
document.addEventListener("change", (e) => {
  const el = e.target as HTMLInputElement;
  if (isExtension && el.id === 'display-name') {
    saveUserName(el.value);
    el.value = userNameProfile.name;
  }
  if (el.id === 'render-pace') { prefs.renderPace = normalizeRenderPace(el.value); renderCadence.reset(); savePrefs(); }
  if (el.id === 'idle-motion') { prefs.idleMotion = normalizeIdleMotion(el.value); savePrefs(); }
  if (el.id === 'motion-preference') {
    prefs.motion = normalizeMotion(el.value, undefined);
    prefs.reduced = effectiveReduced();
    savePrefs();
    $("#motion-preference-note").outerHTML = motionSettingsMarkup();
    audio.play("confirm");
  }
  if (el.dataset.cover === 'logo' || el.dataset.cover === 'title') {
    saveCoverPreference(el.dataset.cover, el.checked);
    scene?.refreshBookmarkCovers();
  }
  if (!isChromeStore && el.id === 'bookmark-search-engine') setSearchEngine(el.value);
  if (el.id === 'bookmark-open-mode') setBookmarkOpenMode(el.value);
  if (el.id === 'bookmark-summary-logo') setBookmarkSummaryLogo(el.checked);
  if (el.id === 'bookmark-startup-mode') setBookmarkStartupMode(el.value);
  if (el.id === 'bookmark-other-roots') {
    setIncludeOtherBookmarks(el.checked);
    window.dispatchEvent(new CustomEvent('rhine-bookmarks-changed', { detail: '书签显示范围已更改' }));
  }
  if (isExtension && el.id === 'quality-preset' && el.value === 'clear') { prefs.rendering = { ...bookmarkClearQuality }; savePrefs(); }
  if (el.id === "quality-preset" && Object.hasOwn(qualityPresets, el.value)) {
    prefs.rendering = { ...qualityPresets[el.value as QualityPreset] };
    savePrefs();
  } else if (el.dataset.quality) {
    const key = el.dataset.quality as keyof RenderQuality;
    prefs.rendering = normalizeQuality({ ...prefs.rendering, [key]: key === "antialias" ? el.value : Number(el.value) });
    savePrefs();
  }
  if (el.dataset.pref) {
    const key = el.dataset.pref;
    if (key === "sound" || key === "music" || key === "reduced" || key === "quality" || key === "superPerformance") prefs[key] = el.checked;
    if (key === "sound" || key === "music") { saveAudioPrefs(); syncSoundButton(); } else savePrefs();
    if (key === "reduced") $("#motion-preference-note").outerHTML = motionSettingsMarkup();
    audio.play("confirm");
  }
});
document.addEventListener("click", (e) => {
  const themeButton = (e.target as Element).closest<HTMLElement>("[data-color-theme]");
  if (themeButton) {
    const choice = themeButton.dataset.colorTheme;
    prefs.colorTheme = choice === "dark" ? "dark" : choice === "system" && !isWallpaper ? "system" : "light";
    savePrefs();
    return;
  }
  if (!started) return;
  if (modalClosing) return;
  const el = (e.target as Element).closest<HTMLElement>("button");
  if (!el) return;
  if (el.dataset.select) {
    select(Number(el.dataset.select));
    return;
  }
  if (el.dataset.result) {
    const index = Number(el.dataset.result);
    closeModal(() => {
      select(index);
      openFile();
    });
    return;
  }
  if (el.dataset.filter) {
    filter = el.dataset.filter;
    document
      .querySelectorAll("[data-filter]")
      .forEach((b) =>
        b.classList.toggle(
          "active",
          (b as HTMLElement).dataset.filter === filter,
        ),
      );
    renderResults();
    return;
  }
  if (el.dataset.tab) {
    setTab(el.dataset.tab);
    return;
  }
  const action = el.dataset.action;
  if (action === "toggle-three") { void toggleThree(); return; }
  if (action === "toggle-sound") { toggleSound(); return; }
  if (action === "sound-preview") audio.play("confirm");
  if (action === "skip") {
    setMode("archive");
    audio.play("confirm");
  }
  if (action === "prev") stepFile(-1);
  if (action === "next") stepFile(1);
  if (action === "column-prev") stepColumn(-1);
  if (action === "column-next") stepColumn(1);
  if (action === "open") openFile();
  if (action === "inspect-bookmark") inspectFile();
  if (action === "model-viewer" && mode === "detail" && scene) {
    const activeScene = scene;
    // Safari does not always focus a button when it is tapped. Capture the
    // actual opener so closing the modal reliably restores the right control.
    el.focus({ preventScroll: true });
    viewer ??= new ModelViewer($("#stage"), () => { audio.setScene(mode); audio.play("page-close"); }, (sound) => audio.play(sound === "tick" ? "ui-tick" : sound));
    audio.setScene("viewer");
    viewer.setSuperPerformance(superPerformanceEnabled());
    viewer.setQuality(effectiveRenderQuality());
    scene.finishDecryption();
    viewer.open(
      records[selected].id,
      records[selected].title,
      () => activeScene.createAssemblyModel(),
      prefs.reduced,
    );
    audio.play("page-open");
  }
  if (action === "back") {
    setMode("archive");
    audio.play("back");
  }
  if (action === "search" || action === "saved" || action === "settings") {
    el.focus({ preventScroll: true });
    openModal(action);
  }
  if (action === "close-modal") closeModal();
  if (action === "bookmark") toggleSaved();
  if (action === "reset-search") {
    modal = "search";
    searchQuery = "";
    filter = "全部档案";
    renderModal();
  }
  if (action === "replay" || action === "restart") {
    replayBoot();
  }
  if (action === "enable-motion") {
    prefs.motion = "full";
    prefs.reduced = false;
    savePrefs();
    replayBoot();
  }
  if (action === "fullscreen" && document.fullscreenEnabled) {
    if (document.fullscreenElement) void document.exitFullscreen();
    else
      void document.documentElement
        .requestFullscreen()
        .catch(() => notify("请使用浏览器的全屏快捷键 F11"));
  }
});
document.addEventListener("keydown", (e) => {
  if (!started) return;
  if (isExtension && (e.target as HTMLElement).id === 'display-name' && e.key === 'Enter') {
    if (e.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    const input = e.target as HTMLInputElement;
    saveUserName(input.value);
    input.value = userNameProfile.name;
    return;
  }
  if (namePromptActive) {
    if (e.key === 'Escape') e.preventDefault();
    return;
  }
  if (viewer?.isOpen) return;
  if (playground?.active && !modal) {
    if (e.key === "Escape") { e.preventDefault(); playground.stop(); }
    else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", "/"].includes(e.key) && !(e.target instanceof HTMLButtonElement)) e.preventDefault();
    return;
  }
  if (modalClosing) {
    e.preventDefault();
    return;
  }
  const typing = e.target instanceof HTMLInputElement;
  if (e.key === "Escape") {
    if (modal) closeModal();
    else if (mode === "detail" || mode === "boot") { const sound = mode === "detail" ? "back" : "ui-tick"; setMode("archive"); audio.play(sound); }
    return;
  }
  if (modal && e.key === "Tab") {
    const focusables = [
      ...$("#modal-root").querySelectorAll<HTMLElement>(
        'button,input:not(:disabled),select:not(:disabled),summary,[tabindex="0"]',
      ),
    ];
    const visible = focusables.filter(el => el.getClientRects().length > 0);
    const first = visible[0],
      last = visible.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
    return;
  }
  if (typing || modal || !ready) return;
  if (
    (e.target as HTMLElement).dataset.tab &&
    ["ArrowLeft", "ArrowRight"].includes(e.key)
  ) {
    e.preventDefault();
    const tabs = ["overview", "notes", "history"];
    setTab(
      tabs[(tabs.indexOf(activeTab) + (e.key === "ArrowRight" ? 1 : 2)) % 3],
    );
    $<HTMLButtonElement>(`[data-tab="${activeTab}"]`).focus();
    return;
  }
  if (e.key === "/") {
    e.preventDefault();
    if (mode === "boot") setMode("archive");
    if (isExtension && mode === "archive") focusBookmarkSearch();
    else openModal("search");
  }
  if (e.key === "ArrowLeft" && mode !== "boot") {
    e.preventDefault();
    stepColumn(-1);
  }
  if (e.key === "ArrowRight" && mode !== "boot") {
    e.preventDefault();
    stepColumn(1);
  }
  if (["ArrowUp", "ArrowDown"].includes(e.key) && mode !== "boot") {
    e.preventDefault();
    stepFile(e.key === "ArrowUp" ? -1 : 1);
  }
  if (
    e.key === "Enter" &&
    (document.activeElement === document.body ||
      document.activeElement?.id === "detail-content" ||
      ["prev", "next", "column-prev", "column-next"].includes(
        (document.activeElement as HTMLElement)?.dataset.action ?? "",
      ) ||
      (document.activeElement as HTMLElement)?.dataset.select)
  ) {
    e.preventDefault();
    if (mode === "boot") setMode("archive");
    else if (mode === "archive") openFile();
  }
});

const ease = (t: number) => {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
};
function bootFrame(t: number) {
  if (!scene && frozenTime === null && t >= 21.9) {
    setMode("archive");
    return undefined;
  }
  if (isWallpaper && frozenTime === null && t >= ARRAY_OPENING_END &&
      !openingShowsDetail(wallpaperHost()?.properties.openingdetail?.value, !!workbench?.enabled)) {
    setMode("archive");
    return undefined;
  }
  audio.updateBoot(t, frozenTime !== null || namePromptActive);
  const motion = bootSequence.update(t, namePromptActive ? '' : userNameProfile.name);
  if (workbench?.enabled && frozenTime === null) {
    const end = openingShowsDetail(wallpaperHost()?.properties.openingdetail?.value, true) ? 35 : ARRAY_OPENING_END;
    if (t > end - .35) $(".powered").style.opacity = String(1 - ease((t - end + .35) / .35));
  }
  let step: string = motion.step;
  if (t >= 22) {
    step = "array";
  }
  if (t >= 25.68) {
    step = "select";
  }
  if (t >= 28.3) {
    step = "inspect";
  }
  if (step !== lastStep) {
    $("#stage").dataset.boot = step;
    lastStep = step;
  }
  $(".file-title").firstChild!.textContent =
    step === "array"
      ? "SELECTING FILES...".slice(0, Math.max(0, Math.floor((t - 21.94) * 18)))
      : "FILE NUMBER: ";
  $("#stage").style.setProperty(
    "--entry-opacity",
    String(ease((t - 21.9) / 0.13)),
  );
  $(".callout-rule").style.transform = `scaleX(${ease((t - 22.08) / 0.9)})`;
  const reveal = ease((t - 22) / 0.4),
    lift = ease((t - 26) / 1.8),
    zoom = 0.55 * ease((t - 27.3) / 1.65) + 0.45 * ease((t - 29.0) / 5.0);
  if (t >= 35) {
    setMode(isExtension ? "archive" : "detail");
    return undefined;
  }
  return { reveal, lift, zoom, time: t };
}

const inspectionOverlay = new InspectionOverlay();
const documentDecryption = new DocumentDecryption();
// A newly opened archive can introduce another font shard. Re-measure its
// redaction lines after font swap while retaining the current reveal progress.
document.fonts.addEventListener("loadingdone", () => documentDecryption.refresh());

let lastTime = 0,
  frameCount = 0,
  frameStart = performance.now(),
  fps = 0;
const renderCadence = new RenderCadence();
let activeUntil = 0;
let frameLimit = 0;
const wakeRendering = () => {
  scene?.noteActivity();
  const now = performance.now();
  if (now >= activeUntil) renderCadence.reset();
  activeUntil = now + 4000;
};
const renderingIsActive = (time: number) => mode === 'boot' || !ready || time < activeUntil || Boolean(scene?.hasActiveInteraction);
if (!isWallpaper) {
  for (const event of ['pointerdown', 'pointermove', 'wheel', 'keydown', 'input', 'resize', 'focus'])
    window.addEventListener(event, wakeRendering, { passive: true });
  document.addEventListener('visibilitychange', () => { renderCadence.reset(); if (!document.hidden) wakeRendering(); });
}
let frameErrorReported = false;
let renderSettled = false;
function frame(ms: number) {
  requestAnimationFrame(frame);
  // One failing frame must not stop every later frame and input response.
  try { renderFrame(ms); }
  catch (error) {
    if (!frameErrorReported) { frameErrorReported = true; console.error(error); }
  }
}
function renderFrame(ms: number) {
  if (!wallpaperFrame(ms)) return;
  if (document.hidden) return;
  const renderingActive = renderingIsActive(ms);
  frameLimit = isWallpaper ? 0 : renderFrameLimit(prefs.renderPace, renderingActive);
  // Once the archive has been still for a while, its canvas is reused; check less often.
  renderSettled = !isWallpaper && !renderingActive && mode === "archive" && !modal && Boolean(scene) && ms - scene!.lastRenderAt > 2000;
  if (renderSettled) frameLimit = SETTLED_FRAME_LIMIT;
  if (!isWallpaper && !renderCadence.shouldRun(ms, frameLimit)) return;
  workbench?.tick();
  const time = ms / 1000;
  const theme = scene?.themeAmount ?? (themeIsDark() ? 1 : 0);
  paintTheme(theme);
  viewer?.setTheme(theme);
  playground?.tick(time);
  let bootTime = frozenTime ?? time - bootStart;
  if (isExtension && !reviewEntry && !userNameProfile.confirmed && mode === 'boot' && bootTime >= USER_NAME_BOOT_TIME) beginNamePrompt();
  if (namePromptActive) {
    bootTime = USER_NAME_BOOT_TIME;
    bootStart = time - bootTime;
  }
  if (mode === "boot" && !ready && frozenTime === null) {
    const held = preparedBootTime(bootTime, false);
    if (held < bootTime) {
      bootStart += bootTime - held;
      bootTime = held;
      showPreparation();
    }
  }
  if (isExtension && mode === "boot" && !reviewEntry && !namePromptActive && bookmarkStartupReady(activeBookmarkStartup, bootTime, ready)) {
    setMode("archive");
    if (namePromptActive) bootTime = USER_NAME_BOOT_TIME;
  }
  const cinema =
    mode === "boot" && bootReady && (namePromptActive || (!(isExtension && activeBookmarkStartup === "direct") && !(pendingEntry && prefs.reduced)))
      ? bootFrame(bootTime)
      : undefined;
  wallpaperEffects?.update(time, prefs.reduced);
  // The calibrated 2D opening fully covers the scene until array entry.
  if (ready && !viewer?.isOpen && (!cinema || cinema.time >= 21.9)) {
    const before = performance.now();
    scene?.update(time, cinema);
    if (!preparation.firstVisibleFrameMs) preparation.firstVisibleFrameMs = performance.now() - before;
  }
  viewer?.update(time);
  if (threeState === "closing" && scene?.presentationHidden) releaseThree();
  playground?.position();
  if (scene && mode === "detail") {
    documentDecryption.update(time, scene.decryptionFrame, prefs.reduced);
    $("#detail-content").style.opacity = String(scene.detailVisibility);
    $("#detail-content").style.translate =
      `0 ${(1 - scene.detailVisibility) * 18}px`;
    $("#detail-content").inert = scene.detailVisibility < 0.1;
    if (pendingDetailFocus && scene.detailVisibility >= 0.1 && !modal && !viewer?.isOpen) {
      $("#detail-content").focus({ preventScroll: true });
      pendingDetailFocus = false;
    }
  }
  $("#stage").style.setProperty("--detail-shade", String(mode === "boot" ? 0 : scene ? scene.detailVisibility : Number(mode === "detail")));
  const currentScene = scene;
  if (currentScene) inspectionOverlay.render(currentScene.decryptionFrame,
    (x, y) => currentScene.projectCard(x, y), Boolean(cinema));
  if (Math.floor(time) !== lastTime) {
    lastTime = Math.floor(time);
    updateFooterClock(new Date(), !prefs.reduced);
  }
  frameCount++;
  if (ms - frameStart > 1000) {
    fps = (frameCount * 1000) / (ms - frameStart);
    frameStart = ms;
    frameCount = 0;
    $("#three-scene").dataset.fps = String(Math.round(fps));
    $("#three-scene").dataset.renderStats = JSON.stringify(scene?.getStats() ?? { loaded: false, drawCalls: 0, triangles: 0 });
    $("#three-scene").dataset.preparation = JSON.stringify({ ...preparation, ready, mode, bootTime: mode === "boot" ? bootTime : null });
  }
}
function bindScene(scene: ArchiveScene, cell?: { lane: number; row: number }) {
    scene.onInspect = () => { if (mode === "archive" && !modal && !viewer?.isOpen) inspectFile(); };
    scene.select(selected, cell ? { cell } : undefined);
    scene.onSelect = (i, cell) => {
      if (mode !== "archive" || modal || viewer?.isOpen) return;
      select(i, cell ? { cell } : undefined);
    };
    scene.onNavigate = (axis, direction) => {
      if (mode !== "archive" || modal || viewer?.isOpen) return;
      if (axis === "lane") stepColumn(direction);
      else stepFile(direction);
    };
    scene.onHover = (i) => {
      const label = $("#hover-label");
      if (i === null) {
        label.hidden = true;
        hoverCode.finish();
        hoverTitle.finish();
        return;
      }
      const animated = !prefs.reduced && mode === "archive";
      hoverCode.update({
        value: Number(records[i].id.slice(2)),
        animated: !label.hidden && animated,
      });
      hoverTitle.update({ text: records[i].title, animated: !label.hidden && animated });
      label.hidden = false;
      // Prepare the first visible value so the next hover can animate immediately.
      hoverCode.update({ animated });
      hoverTitle.update({ animated });
    };
}
function syncThreeButton() {
  $("#stage").dataset.threeState = threeState;
  syncWallpaperBackground();
  const button = document.querySelector<HTMLButtonElement>('[data-action="toggle-three"]');
  if (!button) return;
  button.textContent = threeState === "loading" ? "3D 载入中…" : threeState === "closing" ? "3D 关闭中…" : threeState === "off" ? "3D 关闭" : "3D 开启";
  button.disabled = threeState === "loading";
  button.setAttribute("aria-pressed", String(threeState === "on"));
  button.title = threeState === "off" ? "重新载入三维模型" : threeState === "closing" ? "取消关闭，恢复三维画面" : "卸载三维模型，保留 2D 界面";
}
function releaseThree() {
  if (!scene) return;
  resumeCell = { ...scene.getStats().selectedCell }; resumeSelection = selected;
  viewer?.dispose(); viewer = undefined;
  scene.dispose(); scene = undefined;
  if (mode === "detail") {
    $("#detail-content").style.opacity = "1";
    $("#detail-content").style.translate = "0 0";
    $("#detail-content").inert = false;
    documentDecryption.reset($("#detail-content"), true);
  }
  threeState = "off"; syncThreeButton();
  $("#hover-label").hidden = true;
  delete $("#three-scene").dataset.renderQuality;
  updateQualitySummary();
}
/** Without WebGL, the extension and website stay usable through the 2D interface. */
function useTwoDimensional(reason: "unavailable" | "lost", error?: unknown) {
  if (error !== undefined) console.warn(error);
  threeFallback = reason;
  const failedScene = scene;
  scene = undefined;
  try { viewer?.dispose(); } catch { /* Released with the page. */ }
  viewer = undefined;
  // A partially created scene or a lost context may fail while releasing.
  try { failedScene?.dispose(); } catch { failedScene?.renderer.domElement.remove(); }
  document.querySelectorAll(".bookmark-readable-layer").forEach(node => node.remove());
  threeState = "off"; syncThreeButton();
  $("#hover-label").hidden = true;
  delete $("#three-scene").dataset.renderQuality;
  if (mode === "detail") {
    $("#detail-content").style.opacity = "1";
    $("#detail-content").style.translate = "0 0";
    $("#detail-content").inert = false;
    documentDecryption.reset($("#detail-content"), true);
  }
  updateQualitySummary();
  // A dismissed "unavailable" notice stays hidden for a week; settings still report it.
  const dismissKey = "rhine-three-notice-dismissed";
  let dismissed = 0;
  try { dismissed = Number(localStorage.getItem(dismissKey)) || 0; } catch { /* Show it. */ }
  if (reason === "unavailable" && Date.now() - dismissed < 7 * 864e5) return;
  let notice = document.querySelector<HTMLElement>(".three-notice");
  if (!notice) {
    notice = document.createElement("div");
    notice.className = "three-notice";
    notice.setAttribute("role", "status");
    $("#viewport").append(notice);
  }
  const usable = isExtension ? "书签与搜索仍可正常使用" : "档案内容仍可正常浏览";
  notice.innerHTML = reason === "lost"
    ? `三维显示已中断，${usable}。<button type="button" data-three-retry>重新载入 3D ↻</button><button type="button" class="three-notice-close" aria-label="关闭提示">×</button>`
    : `三维显示暂不可用，${usable}。可开启浏览器的图形加速后重试。<button type="button" data-three-retry>重试 3D ↻</button><button type="button" class="three-notice-close" aria-label="关闭提示">×</button>`;
  notice.querySelector("[data-three-retry]")!.addEventListener("click", () => location.reload());
  notice.querySelector(".three-notice-close")!.addEventListener("click", () => {
    notice!.hidden = true;
    if (reason === "unavailable") try { localStorage.setItem(dismissKey, String(Date.now())); } catch { /* This page only. */ }
  });
  notice.hidden = false;
}
/** A context the browser never restores (for example, too many open pages) falls back to 2D. */
function watchContextLoss(target: ArchiveScene) {
  if (isWallpaper) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const canvas = target.renderer.domElement;
  canvas.addEventListener("webglcontextlost", () => {
    clearTimeout(timer);
    timer = setTimeout(() => { if (scene === target) useTwoDimensional("lost"); }, 5000);
  });
  canvas.addEventListener("webglcontextrestored", () => clearTimeout(timer));
}
let fallbackWheel = 0, fallbackWheelTime = 0;
// The 3D canvas normally owns wheel browsing; keep it in the 2D interface.
$("#stage").addEventListener("wheel", event => {
  if (isWallpaper || scene || !started || !ready || mode !== "archive" || modal || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  if ((event.target as Element).closest(".bookmark-search, .archive-callout, .terminal-modal, #detail-ui")) return;
  const now = performance.now();
  if (now - fallbackWheelTime > 180 || Math.sign(event.deltaY) !== Math.sign(fallbackWheel)) fallbackWheel = 0;
  fallbackWheelTime = now;
  fallbackWheel += event.deltaY * (event.deltaMode === 1 ? 40 : 1);
  if (Math.abs(fallbackWheel) < 100) return;
  stepFile(Math.sign(fallbackWheel));
  fallbackWheel = 0;
}, { passive: true });
async function toggleThree() {
  if (!isWallpaper || !ready || threeState === "loading") return;
  if (threeState === "closing") {
    scene?.setPresentationVisible(true, prefs.reduced);
    threeState = "on"; syncThreeButton(); return;
  }
  if (scene) {
    playground?.stop();
    threeState = "closing"; syncThreeButton();
    scene.setPresentationVisible(false, prefs.reduced);
    if (prefs.reduced) releaseThree();
    return;
  }
  threeState = "loading"; syncThreeButton();
  let next: ArchiveScene | undefined;
  try {
    next = new ArchiveScene($("#three-scene"));
    next.renderer.domElement.style.opacity = "0";
    next.setPresentationVisible(false, true);
    await next.load();
    next.setMode(mode === "detail" ? "detail" : "archive");
    bindScene(next, resumeSelection === selected ? resumeCell : undefined);
    next.revealImmediately();
    scene = next;
    scene.setTheme(themeIsDark(), true);
    scene.setArchiveCoverage(wallpaperHost()?.properties.archivecoverage?.value === "extra");
    savePrefs();
    scene.setPresentationVisible(true, prefs.reduced);
    threeState = "on"; syncThreeButton();
  } catch (error) {
    next?.dispose(); scene = undefined;
    threeState = "off"; syncThreeButton();
    notify("三维模型载入失败，请点击 3D 关闭重试。");
    console.error(error);
  }
}

async function start() {
  let failed = false;
  const offerEntry = () => {
    if (failed) return;
    bootReady = true;
    if (entry) entry.ready();
    else completeStartup(false);
  };
  try {
    if (isWallpaper) await window.rhineWallpaperPropertiesReady;
    const fonts = Promise.all([
      loadBootWebfonts(),
      // With unicode-range faces, preload the opening's actual characters,
      // not every font shard. Other archive text loads on demand.
      document.fonts.load("300 20px MiSans", "ACCESS WELCOME TO INTERNAL DATABASE"),
      document.fonts.load("400 20px MiSans", `身份信息确认请求已接收开始处理权限验证通过欢迎访问莱茵生命内部资料档案编号保密级别商业区选择档案：0123456789 JOYCE MOORE ${userNameProfile.name}`),
      document.fonts.load("600 20px MiSans", "SYNTHESIZE INFORMATION ANALYSIS OS"),
      document.fonts.load("700 20px MiSans", "RHINE LAB WELCOME TO INTERNAL DATABASE"),
    ]).catch(error => { console.warn(error); }).then(() => { if (prepareDuringOpening) offerEntry(); });
    const three = (async () => {
      await yieldPreparation();
      if (!isWallpaper || wallpaperHost()?.properties.load3donstartup?.value !== false) {
        try {
          scene = new ArchiveScene($("#three-scene"));
          scene.setTheme(themeIsDark(), true);
          scene.setArchiveCoverage(wallpaperHost()?.properties.archivecoverage?.value === "extra");
          await scene.load();
          // Canvas labels must use the loaded font, even when the GLB arrives first.
          await fonts;
          if (isExtension) scene.refreshBookmarkCovers();
          if (failed) return;
          bindScene(scene);
          watchContextLoss(scene);
        } catch (error) {
          if (isWallpaper) throw error;
          useTwoDimensional("unavailable", error);
        }
      } else {
        threeState = "off";
        syncThreeButton();
      }
      savePrefs();
      select(0);
      if (scene && (prepareDuringOpening || reviewParams.get("prewarm") === "1")) {
        preparation.phase = "warming";
        try { Object.assign(preparation, await scene.preparePresentation()); }
        catch (error) {
          if (isWallpaper) throw error;
          useTwoDimensional("unavailable", error);
        }
      }
      if (failed) return;
      ready = true;
      preparation.phase = threeFallback ? "2d" : "ready";
      preparationStatus.hidden = true;
      if (pendingEntry && started) {
        const target = pendingEntry;
        pendingEntry = undefined;
        setMode(target);
      }
    })();
    await Promise.all([fonts, three]);
    if (!prepareDuringOpening) {
      if (isWallpaper) {
        // CEF allows automatic audio; never block the visual on audio policy or decoding.
        await Promise.race([audio.unlock(), new Promise(resolve => setTimeout(resolve, 3000))]);
      }
      offerEntry();
    }
  } catch (error) {
    failed = true;
    preparation.phase = "error";
    console.error(error);
    const errorRoot = started ? preparationStatus : loading;
    errorRoot.hidden = false;
    errorRoot.inert = false;
    errorRoot.innerHTML = '<div class="error-state"><strong>CONNECTION INTERRUPTED</strong><p>三维档案准备失败，请重新连接。若仍失败，请检查浏览器硬件加速。</p><button type="button">RECONNECT →</button></div>';
    errorRoot.querySelector("button")!.addEventListener("click", () => location.reload());
  }
}
function completeStartup(silent: boolean) {
  if (started || !bootReady || preparation.phase === "error") return;
  started = true;
  if (silent) {
    prefs.sound = false;
    prefs.music = false;
    saveAudioPrefs();
  }
  audio.releaseEntry();
  audio.restartBoot();
  const fade = prefs.reduced ? 0 : 600;
  bootStart = performance.now() / 1000 - (reviewParams.has("time") ? Number(reviewParams.get("time")) : 1.76);
  if (!reviewParams.has("time")) bootStart += fade / 1000;
  setMode("boot");
  if (isExtension && !reviewEntry && activeBookmarkStartup === "direct") {
    $("#stage").dataset.directEntry = "true";
    setMode("archive");
  }
  if (reviewParams.get("scene") === "archive" || (prefs.reduced && !reviewParams.has("time"))) setMode("archive");
  if (reviewParams.get("scene") === "detail") setMode("detail");
  if (isWallpaper && wallpaperHost()?.properties.boot?.value === false) setMode("archive");
  $("#stage").inert = false;
  $(".mobile-entry").inert = false;
  if (namePromptActive) $('#boot-user-name').focus({ preventScroll: true });
  loading.classList.add("loaded");
  loading.inert = true;
  setTimeout(() => {
    const restoreFocus = loading.contains(document.activeElement) || document.activeElement === document.body;
    loading.remove();
    if (entry && restoreFocus) {
      const skip = $("#skip");
      const target = mode === "boot" ? skip.getClientRects().length ? skip : $(".mobile-entry") : $(".read-file");
      target.focus({ preventScroll: true });
    }
  }, fade);
  requestAnimationFrame(frame);
  // Do not compete with entry audio/font downloads. Full offline installation
  // begins after startup is complete and remains atomic.
  setTimeout(() => void initPwa(notify), 1500);
}
updateSelection();
syncSoundButton();
const customBackground = isWallpaper ? new WallpaperBackground($("#stage"), notify) : undefined;
function syncWallpaperBackground(retry = false) {
  customBackground?.update(wallpaperHost()?.properties ?? {}, mode !== "boot" && (threeState === "off" || threeState === "loading"), prefs.reduced, retry);
}
if (isWallpaper) {
  const apply = (properties: WallpaperProperties) => {
    const theme = properties.colortheme?.value;
    if (theme === "light" || theme === "dark") prefs.colorTheme = theme;
    scene?.setArchiveCoverage(properties.archivecoverage?.value === "extra" || wallpaperHost()?.properties.archivecoverage?.value === "extra");
    for (const key of ["sound", "music", "reduced"] as const)
      if (typeof properties[key]?.value === "boolean") prefs[key] = properties[key].value as boolean;
    for (const key of ["soundVolume", "musicVolume"] as const) {
      const value = properties[key.toLowerCase()]?.value;
      if (typeof value === "number" && Number.isFinite(value)) prefs[key] = Math.max(0, Math.min(1, value / 100));
    }
    const qualityProperties = { ...wallpaperHost()?.properties, ...properties };
    if (Object.keys(properties).some(key => key === "renderquality" || key.startsWith("quality")))
      prefs.rendering = wallpaperQuality(qualityProperties, prefs.rendering);
    savePrefs();
    if (properties.customwallpaperfile || properties.customwallpaper?.value === true) syncWallpaperBackground(true);
    if (properties.boot?.value === false && started && mode === "boot") setMode("archive");
    // Keep an already-open settings surface in sync without replacing focused controls.
    document.querySelectorAll<HTMLInputElement>("[data-pref]").forEach(input => {
      const key = input.dataset.pref as "sound" | "music" | "reduced";
      if (key in prefs) input.checked = prefs[key];
    });
    for (const key of ["soundVolume", "musicVolume"] as const) {
      const input = document.querySelector<HTMLInputElement>(`[data-volume="${key}"]`);
      if (input) { input.value = String(Math.round(prefs[key] * 100)); input.closest("label")?.querySelector("output")?.replaceChildren(`${input.value}%`); }
    }
  };
  window.addEventListener("rhine-wallpaper-properties", event => apply((event as CustomEvent<WallpaperProperties>).detail));
  let pausedAt: number | undefined;
  const pause = () => {
    const paused = wallpaperHost()?.paused ?? false;
    if (paused && pausedAt === undefined) pausedAt = performance.now();
    if (!paused && pausedAt !== undefined) {
      if (started && mode === "boot") bootStart += (performance.now() - pausedAt) / 1000;
      pausedAt = undefined;
    }
    audio.setHostPaused(paused);
  };
  window.addEventListener("rhine-wallpaper-pause", pause);
  apply(wallpaperHost()?.properties ?? {});
  pause();
}
if (isWallpaper) {
  workbench = new Workbench($("#stage"), () => {
    if (ready && mode !== "boot") setMode("archive");
  }, lane => {
    if (ready && !modal) select(columnMemory[lane]);
  });
  playground = new ArchivePlayground($("#stage"), () => scene,
    () => ({ enabled: !!workbench?.enabled && mode === "archive" && ready, paused: Boolean(modal) || modalClosing || Boolean(wallpaperHost()?.paused) || document.hidden, reduced: prefs.reduced }),
    value => { musicSuppressed = value; configureAudio(); }, () => audio.play("tick"));
  wallpaperEffects = new WallpaperEffects($("#stage"), () => scene);
  document.addEventListener("click", event => {
    const button = (event.target as Element).closest<HTMLElement>("[data-workbench-mode]");
    if (button) closeModal(() => { workbench!.setEnabled(button.dataset.workbenchMode === "workbench"); });
  });
}
void start();
// Deterministic review controls: the running application, never a video surrogate.
Object.assign(window, {
  rhine: {
    // The review button supplies a real user activation. Preferences stay local to this preview.
    playBootPreview: async (music = false) => {
      if (!ready || !navigator.userActivation.isActive) return false;
      const request = ++audioPreviewRequest;
      audioPreview = true;
      audio.configure({ ...prefs, sound: true, music });
      const unlocked = await audio.unlock();
      if (request !== audioPreviewRequest) return false;
      if (!unlocked) {
        audioPreview = false;
        configureAudio();
        return false;
      }
      replayBoot(true);
      return true;
    },
    seek: (t: number) => {
      setMode("boot");
      bootStart = performance.now() / 1000 - t;
      lastStep = "";
    },
    archive: () => setMode("archive"),
    detail: () => openFile(),
    select: (i: number) => select(i),
    stats: () => ({
      ...scene?.getStats(),
      threeState,
      fps: Math.round(fps),
      renderCadence: { pace: prefs.renderPace, idleMotion: prefs.idleMotion, limit: frameLimit, settled: renderSettled, active: renderingIsActive(performance.now()), hidden: document.hidden },
      mode,
      ready,
      preparation: { ...preparation },
      startup: started ? "started" : entry?.phase ?? "loading",
      startupMode: activeBookmarkStartup,
      identity: { confirmed: userNameProfile.confirmed, waiting: namePromptActive },
      motion: { reduced: prefs.reduced, preference: prefs.motion, systemReduced },
      theme: { choice: prefs.colorTheme, dark: themeIsDark() },
      bootTime: mode === "boot" ? started ? (frozenTime ?? performance.now() / 1000 - bootStart) + 5 : 6.76 : null,
      selected: records[selected].id,
      saved: [...saved],
      audio: audio.stats(),
      wallpaper: isWallpaper ? wallpaperHost() : null,
    }),
  },
});
if (import.meta.hot) import.meta.hot.dispose(() => audio.dispose());
