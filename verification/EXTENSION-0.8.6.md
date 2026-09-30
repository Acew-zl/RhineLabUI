# 起始页日常使用体验 · 0.8.6

2026-09-30。用户审查 0.8.5 的不足之处后，确认按以下方案修改：2（每天首次完整）、3、5、6、8（仅最小字号，不改配色）、9（统一静音，由用户自行开启）、10、12、13（搜索包含全部书签）、14，以及 1 的 2D 备用界面。用户决定不修改：4（开场闪烁面积很小）、7（键盘与读屏）、8 的配色、11（本地化）。仅浏览器扩展启用的项目在下文注明；普通网页只共享 2D 备用、动态效果跟随系统、配色跟随系统、静止呼吸和帧率逻辑，壁纸版保持原行为。

## 行为与实现

| 项目 | 行为 | 主要位置 |
| --- | --- | --- |
| 2D 备用界面 | 三维场景创建、载入或预热失败时不再停在 CONNECTION INTERRUPTED；开场在三维出现的时间点进入 2D 界面，书签、搜索、档案索引、详情、键盘与滚轮浏览照常，360° 入口隐藏。底部提示可重试或关闭（关闭一周内不再提示）。三维上下文丢失 5 秒未恢复同样切换。渲染循环单帧异常不再中止；收藏数据损坏不白屏；第二个书脊上下文被拒时标签退回主场景。 | `src/main.ts`（`useTwoDimensional`、`watchContextLoss`、`frame`）、`src/scene.ts` |
| 每天首次完整（扩展） | 新增并默认「每天首次完整 · 之后简短」；看完或跳过完整开场后，当天其余页面使用简短动画。本地保存日期 `rhine-bookmark-startup-full-date`；手动选过的启动方式不变；REINITIALIZE 仍完整重播。 | `src/bookmark-startup.ts` |
| 静止呼吸与重绘 | 「静止呼吸」：30 秒后静止（默认）／持续／关闭。静置 30 秒后起伏平稳归零，已有静止画面复用生效；复用超过 2 秒后检测降为每秒 5 次，任何输入立即恢复。新标签页与网页的 `powerPreference` 改为 `default`（壁纸保持高性能）。画质、分辨率、光影不变。 | `src/scene.ts`、`src/render-cadence.ts`、`src/main.ts` |
| 网址与搜索词 | 只有真实顶级域名（内置 IANA 列表，1438 项）、完整 IPv4、`localhost`、IPv6、带端口或局域网专用名称才按网址打开；本机/局域网使用 http。`node.js`、`3.14`、`1.5倍` 等搜索。列表首行给出另一种处理方式，按 ↓ 选择。Chrome 商店版共用判断。 | `src/bookmark-search.ts`、`src/tld-list.ts`、`scripts/update-tlds.mjs`、`src/bookmark-ui.ts`、`src/chrome-search.ts` |
| 浏览器内部页面（扩展） | `chrome://`、`edge://`、`about:`、本地文件书签改由 `chrome.tabs.create/update` 打开，位置紧邻起始页；无新增权限。本地文件未获「允许访问文件网址」时提示；被拒绝时提示。 | `src/bookmark-navigation.ts` |
| 最小字号（扩展） | 桌面布局中其余标签、页脚、详情、弹窗与设置文字不小于 12 显示像素（主题按钮与详情页签 14），大屏保持原尺寸；紧凑与竖屏布局为 12px。配色未改。搜索栏宽度按导航按钮实际宽度让位；640px 以下竖屏的档案索引按钮只显示图标（恢复原竖屏设计）。 | `src/bookmarks.css`、`src/main.ts`（`reserveNavigation`） |
| 统一静音（扩展） | 升级后所有用户统一静音一次（`audioDefaultsVersion`），之后只在用户开启时播放。「设置」左侧新增声音按钮，静音／恢复上次的音效与音乐组合。静音时无需点击入口即可播放开场。 | `src/main.ts`（`toggleSound`）、`src/bookmarks.css` |
| 跟随系统 | 动态效果为「跟随系统／始终完整／始终减少」，系统变化即时生效；旧版保存的值与系统不同则保留为明确选择。配色新增「跟随系统」，默认仍为亮色。 | `src/main.ts`、`src/theme-ui.ts` |
| 多页同步 | 设置写入时仅覆盖本页改动的项，并接收其他页面的 storage 事件；收藏写入前读取最新列表。主题、声音、画质、帧率、静止呼吸、收藏、书脊、打开方式、搜索引擎、启动方式和书签范围同步。 | `src/main.ts`（`persistPrefs`、`applyStoredPrefs`） |
| 书签范围（扩展） | 书签栏只有文件夹时省略空的首列；书签栏为空时底部说明添加方法。「其他书签与移动设备书签」（默认关闭）刷新后显示为列；顶部搜索始终包含全部书签。 | `src/bookmark-data.ts`、`src/bookmark-scope.ts`、`src/bookmarks.ts` |
| 大量书签（扩展） | 超过 512 个书签时，书脊贴图只为最近的 512 个标签分配 1024px 槽位并按最近使用复用，上限 8192×4096；新槽位绘制并上传后才显示。贴图上传合并为每秒最多 4 次；标题截断改为二分查找。ARCHIVE INDEX 每批 150 行、滚动继续加载，300 个以上书签时输入防抖。 | `src/bookmark-covers.ts`、`src/bookmark-atlas-slots.ts`、`src/main.ts` |

隐私政策、README、`docs/EXTENSION.md` 与商店说明已同步；manifest 权限不变，版本 0.8.6。

## 验证

- `npm run check:extension`（32 项）、`npm run check:extension:chrome`（4 项）：发行包与 CSP 检查通过，单元测试全部通过；普通网页 `npm run build` 与壁纸 `npm run build:wallpaper` 构建通过。新增：网址判断与备选、浏览器内部页面经标签页接口打开及提示、每天首次完整的日期判断、其他书签与空首列、书脊槽位分配。
- `scripts/check-extension-experience.mjs`（新增）：按 manifest CSP 提供最终构建和演示书签，禁用 WebGL，在 Chromium 1194 无头浏览器中通过 5 组检查：2D 备用、搜索判断两方向、静音迁移与每天首次完整、两页同步与跟随系统、1366×768／1100×700／1600×1200 无低于 12px 的可见文字且搜索栏不压导航。结果与截图：[results.json](extension-0.8.6/results.json)、[2D 备用](extension-0.8.6/fallback-2d.png)、[搜索备选](extension-0.8.6/search-alternative.png)、[声音按钮](extension-0.8.6/sound-button.png)。
- 以 `--load-extension` 在临时配置中加载真实解压扩展，写入测试书签（含 `chrome://settings`、`file://`、`javascript:`、空名称、其他书签）后检查：`chrome://settings/` 通过标签页接口在新标签页打开；`javascript:` 仍不执行并提示；其他书签可搜索，开启范围后新页面显示「Other bookmarks」列；两页之间主题、声音与收藏同步且存储合并；2000 个书签时档案索引首屏 150 行、滚动后 300 行。命令行加载的解压扩展默认允许文件网址，因此本地文件未授权提示由单元测试覆盖。
- 本项目的 `scripts/check-user-name-browser.mjs` 改用本机 Chromium、禁用 WebGL 后运行，5 组首次命名流程通过（原脚本指定 Edge 通道，本环境没有 Edge）。该脚本在跳转时间后只等待 200ms；软件合成下有一次因画面未及时更新而失败，重跑 3 次均通过。
- 修改前 1366×768 的扫描中，页脚 7.1px、详情脚注 5.7px、弹窗底栏 6.4px 等 20 余处小于 12px；修改后档案、搜索、详情、索引与设置在 1366×768、1280×720、1024×700、390×844 均无低于 12px 的可见文字。修改前 1100×700 搜索栏与导航重叠 16px，现已消除。

### 三维路径（软件渲染）

本环境只有 SwiftShader 软件渲染，每帧约 3–4 秒，不能代表真实帧率或显卡占用。以 480×300、超级性能模式运行：

- 静止呼吸：输入后起伏增益升至约 0.21，30 秒窗口结束后衰减并归零；弹簧收敛后停止重绘（已渲染帧保持 296，复用帧 20 秒内由 63 增至 163，检测频率 5 次/秒）。
- 三维上下文丢失（`WEBGL_lose_context` 不恢复）5 秒后切换到 2D，提示「三维显示已中断」，方向键继续选档。
- 书脊贴图：少量书签时按原方式为每个书签保留槽位（8192×128，1024px），截图中书脊名称与图标正常显示（[少量书签](extension-0.8.6/spines-small.png)）。2000 个书签时为 8192×4096、1024px、512 槽位（修改前为 512px 书脊、8192×4000；1000 个书签时修改前为 8192×8000），画面附近的书脊名称各不相同且与所在书签一致，切换文件夹无异常（[2000 个书签](extension-0.8.6/spines-2000.png)）。

## 未验证与限制

- 真实显卡占用未在本环境测量；请在原 RX 6800S 设备上按 [NEW-TAB-PERFORMANCE.md](NEW-TAB-PERFORMANCE.md) 的方法复测均衡模式静置 30 秒以后的 GPU 3D 占用。
- 未在品牌版 Chrome／Edge 与商店安装中实测；商店包尚未上传。
- 顶级域名列表来自 IANA（经 `tlds@1.261.0` 取得），新增域名后缀需执行 `node scripts/update-tlds.mjs` 更新。

## 复现

```sh
npm run build:extension && npm run check:extension
npm run build:extension:chrome && npm run check:extension:chrome
PLAYWRIGHT_MODULE=<playwright 路径> node scripts/check-extension-experience.mjs   # 可设 BROWSER_CHANNEL=msedge 或 BROWSER_PATH
```
