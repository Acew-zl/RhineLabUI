# 检索调取与书脊阅读 · 0.8.7

2026-10-02。用户批准 `UX-CRITIQUE.md` 前三项，并明确修正检索调取：输入和浏览结果不移动阵列，确认打开后才移动、抽取和解密；目标网页同时在后台加载，动画完成后激活。其余建议仅整理为 [下一轮候选](../docs/UX-NEXT-STEPS.md)，未实现。

## 行为与范围

- **阅读避让**：仅非选中阵列书脊在计数、操作提示与页脚的屏幕区域平滑减淡；投影过大的前景标签适度减淡。与原来的循环、顶部淡出相乘，保留原贴图分辨率和字体大小，不增加模糊。选中及归位标签独立绘制，保持清晰。本轮没有加入焦段外的名称/Logo 分离实验。
- **确认后调取**：顶部本地书签结果与档案索引共用确认流程。扩展使用 `tabs.create({active:false})` 立即开始后台加载，沿实际选择轨道到达对应卡片后打开详情，等待抽取、特写及解密达到完成状态，再用 `tabs.update({active:true})` 激活目标。不会等待外站完整加载，也不会预先访问未确认的结果。当前页覆盖偏好仍生效，该模式在动画结束后导航，不额外开页。
- **取消**：Esc、重新选档、打开弹窗/查看器、返回阵列和主动切换标签页均取消尚未完成的自动激活；保留已经创建的网页。相同目标在调取中再次确认不重复创建。若任一动画阶段六秒仍未完成，取消自动切页，避免未完成时强行激活。
- **后台手势**：三维卡片、顶部本地书签结果和索引支持中键及 Windows/Linux Ctrl、macOS ⌘ 点击；任意可点击卡片均可打开，无需先选中。保持当前选中项、目录及前台页面，不抽取或自动激活。Mac Ctrl 保留右键语义。未新增 OUT 印记或下沉回弹。
- **检索一致性**：两处共用 NFKC 归一化、多关键词匹配与标题排序；五条以上可带原查询进入索引查看全部。索引也包含未映射为三维列的其他书签，不虚构其模型位置。Enter 提示随所选行区分搜索网络、打开网址和打开书签，未选行时沿用原语义。
- **降级路径**：减少动态效果、无三维场景、未映射到阵列的书签直接打开；普通 HTTP 预览没有标签页 API，保持同步打开以免失去浏览器的用户手势许可。Chrome 专用版继续使用 `chrome.search`，完整版保留搜索引擎选择。两版 manifest 权限不变，没有新增访问记录、统计或后台进程。

## 验证与证据

- TypeScript 与完整版/Chrome 专用构建通过。`npm run check:extension` 40 项、`npm run check:extension:chrome` 4 项通过；新增测试覆盖调取时序、取消、重复确认、当前页偏好、降级、手势、文件访问限制、静区坐标及共用检索。
- `scripts/check-extension-dispatch.mjs`：Edge 154.0.4258.48 使用真实三维渲染、明确标注的演示书签及标签页 API 观察桩。确认输入/方向键不移动；46 条匹配带查询进入索引；Ctrl/中键保持选中项；后台创建先于激活，激活时已在详情且解密清晰度 ≥0.995；Esc 不关闭后台页；索引中键保持目录。静止呼吸关闭、鼠标离开阵列并充分收敛后，四秒内新增三维渲染帧为 **0**。这不等同于测得显卡占用为零。见 [结果](extension-0.8.7/results.json)。
- `scripts/check-extension-native.mjs`：独立临时 Edge 配置加载真实解压扩展，仅写入测试书签，不接触用户配置。目标网页已收到 HTTP 请求并加载时，起始页仍是浏览器的活动标签页；随后真实 `tabs.update` 在详情解密清晰度 0.99646 时激活它，本次确认到切页约 6.1 秒。Ctrl 点击与三维卡片中键也保持前台和选中项。见 [原生标签页结果](extension-0.8.7/native-results.json)。
- 既有 `scripts/check-extension-experience.mjs` 的五组检查通过：2D 备用、网址/搜索备选、静音和每日开场、多页同步和系统动态效果、三个桌面尺寸的最小字号及搜索导航避让。见 [结果](extension-0.8.7/experience-results.json)。
- 阅读画面对照：[1920×1080](extension-0.8.7/reading-1920.png)、[1366×768](extension-0.8.7/reading-1366.png)、[竖屏](extension-0.8.7/reading-portrait.png)、[暗色](extension-0.8.7/reading-dark.png)、[调取完成](extension-0.8.7/dispatch-complete.png)。小窗口初始选档左边缘的既有裁切列为下一轮候选，本轮未改变相机构图。

## 复现与限制

```powershell
npm run build:extension
npm run check:extension
npm run build:extension:chrome
npm run check:extension:chrome
$env:PLAYWRIGHT_MODULE='<Playwright 模块路径>'
node scripts/check-extension-dispatch.mjs
node scripts/check-extension-native.mjs
```

默认测试浏览器为本机 Edge，可用 `BROWSER_CHANNEL` 指定其他已安装的 Chromium 品牌浏览器。测试创建并关闭独立浏览器实例与本机 HTTP 服务，原生检查使用 `release/review-0.8.7/native` 下的临时配置。没有在 Chrome 商店安装包、macOS 实机或全部 Chromium 浏览器逐一测试；没有量测真实 GPU 百分比。两版本地包均为 0.8.7，本轮没有上传商店或发布 GitHub Release。
