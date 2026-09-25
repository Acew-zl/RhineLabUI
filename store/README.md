# 商店提交材料与状态

更新：2026-09-25。**Edge 完整版 0.8.2 已上线；Chrome 0.8.2 被拒，已备 0.8.3 专用包重新提交；GitHub 完整版下载见 Release。**

## 发布状态

- Chrome：0.8.2 因新标签页的独立搜索引擎选择被拒（Red Argon）；0.8.3 专用包改用 Chrome Search API，待在原条目重新提交。Chrome 后台不能通过当前浏览器控制自动操作，后续状态以用户后台为准。
- Edge：[商店条目](https://microsoftedge.microsoft.com/addons/detail/ghkdoeojkoenedlobcpaaeocopddkkmp)已公开，开发者后台显示 Live，版本 0.8.2。

## 上传材料

Chrome 商店应上传 `release/RhineLab-Chrome-Store-0.8.3.zip`；Edge／GitHub 完整版继续使用 `release/RhineLab-NewTab-0.8.2.zip`。两者的 manifest.json 均位于 ZIP 根目录，不要混用或上传仓库源码 ZIP。

| 文件 | 用途 |
| --- | --- |
| `store/LISTING.md` | 中文介绍、单一用途、权限理由与英文审核测试说明 |
| `store/media/icon-128.png` | Chrome 图标，128×128，透明留边 |
| `store/media/icon-300.png` | Edge 图标，300×300 |
| `store/media/promo-440x280.png` | 小宣传图，两店均可用 |
| `store/media/01-light-1280x800.jpg` | 亮色实际界面截图 |
| `store/media/03-search-1280x800.jpg` | 仅适用于 0.8.2 完整版；显示旧 Bing 下拉框，Chrome 0.8.3 条目须移除 |
| `PRIVACY.md` | 中英文隐私说明；GitHub 公开链接已可使用 |
| `THIRD_PARTY_NOTICES.md` | 上游、字体、依赖、原片采样及非官方身份说明 |

截图来自最终扩展构建的本机 HTTP 演示页，保留演示数据提示，未使用真实个人书签，HTTP 没有浏览器 favicon 接口，图标显示占位。截图为浏览器直接输出，没有伪造安装、评价或商店背书。小宣传图由代码绘制，源码为 `store/media/promo-small.svg`。

## Chrome 手动提交记录

逐项填写可直接使用 [Chrome 上架操作清单](CHROME-PUBLISH.md)。

1. 在现有被拒条目上传 Chrome 0.8.3 专用 ZIP，不要另建条目。
2. 商店详情按 LISTING.md 更新网络搜索说明，并移除显示 Bing 下拉框的旧搜索截图；保留亮色主界面截图、图标和宣传图。
3. 隐私页填单一用途、bookmarks／favicon／search 权限说明、无远程代码，以及更新后的隐私政策链接。按照表单对“收集”的定义如实披露本地处理与主动外部搜索，不把“不上传开发者”误写为“不处理任何用户数据”。
4. 核对当前账号的发布者身份、公开联系信息、地区与免费公开分发；协议、权利和政策承诺由账号持有人审阅后处理。
5. 完成后台校验后提交审核；通过前不应写“已上架”。保存扩展 ID 和商店 URL，以后更新上传到同一条目。

## Edge 商店

当前 0.8.2 已经公开，可在上方商店链接安装。今后更新请在现有条目上传更高版本，不要另建条目。

## 授权和审核边界

已保留原作者 MIT 及其原创资产许可来源，但原作者明确排除了《明日方舟》名称/标志/原片设计和三段原片短音等第三方内容。当前包仍包含这些既有元素。本轮未声称获得官方授权，未代勾选“拥有全部权利”等声明，也没有擅自删除或替换用户已验收的视觉与音效。若审核要求对应证明，需要账号持有人处理或另行决定替换方案；上传并不保证审核通过。

## 构建与检查

Chrome 专用版：`npm run build:extension:chrome` / `npm run check:extension:chrome`。完整版：`npm run build:extension` / `npm run check:extension`。图标与宣传图需要 Node 可访问 sharp，再执行 `node scripts/build-store-assets.mjs`；也可用 `SHARP_MODULE` 指定 sharp 的入口文件。生成后用 `node scripts/check-store-assets.mjs` 校验图像尺寸和包内文档。

本轮仅新增商店元数据、128px 图标与随包隐私/来源/Three.js 许可；应用 JS/CSS 与 0.8.1 的构建内容一致，没有接入上游精细动效。

## 官方资料

- Chrome 发布：https://developer.chrome.com/docs/webstore/publish
- Chrome 图像要求：https://developer.chrome.com/docs/webstore/images
- Chrome 隐私披露：https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- Edge 发布：https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension
- Edge 开发者注册：https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/create-dev-account

验证：扩展构建、20 项扩展检查通过；提供两张 1280×800 截图（亮色主界面、本地书签搜索）。预览出现一条 GPU 着色器浮点舍入警告（X4122），未出现 JavaScript 错误；未改写用户已验收的渲染实现。
