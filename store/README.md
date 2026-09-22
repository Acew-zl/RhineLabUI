# 商店提交材料与状态

更新：2026-09-22。版本：0.8.2。**尚未提交审核，尚未上架；没有商店安装链接。**

## 当前阻塞

- Chrome：已看到当前账号的开发者后台标签页，但浏览器控制明确返回“extensions gallery cannot be scripted”。本任务不绕过该限制，Chrome 最后的后台上传与提交需用户手动操作。
- Edge：按用户最新要求暂缓。本轮没有提交 Edge 审核；最后观察到的状态为个人账号已登录、开发者注册尚未完成。

## 上传材料

构建产物在 `release/RhineLab-NewTab-0.8.2.zip`。这是商店应上传的扩展包，manifest.json 位于 ZIP 根目录，不要上传仓库源码 ZIP 或商店材料合集。

| 文件 | 用途 |
| --- | --- |
| `store/LISTING.md` | 中文介绍、单一用途、权限理由与英文审核测试说明 |
| `store/media/icon-128.png` | Chrome 图标，128×128，透明留边 |
| `store/media/icon-300.png` | Edge 图标，300×300 |
| `store/media/promo-440x280.png` | 小宣传图，两店均可用 |
| `store/media/01-light-1280x800.jpg` | 亮色实际界面截图 |
| `store/media/03-search-1280x800.jpg` | 本地书签搜索实际截图 |
| `PRIVACY.md` | 中英文隐私说明；推送后可使用 GitHub 公开链接 |
| `THIRD_PARTY_NOTICES.md` | 上游、字体、依赖、原片采样及非官方身份说明 |

截图来自最终扩展构建的本机 HTTP 演示页，保留演示数据提示，未使用真实个人书签，HTTP 没有浏览器 favicon 接口，图标显示占位。截图为浏览器直接输出，没有伪造安装、评价或商店背书。小宣传图由代码绘制，源码为 `store/media/promo-small.svg`。

## Chrome 手动提交

逐项填写可直接使用 [Chrome 上架操作清单](CHROME-PUBLISH.md)。

1. 在当前已登录的 Chrome Web Store 开发者后台创建新条目，上传 `release/RhineLab-NewTab-0.8.2.zip`。
2. 商店详情中按 LISTING.md 填写中文介绍、语言与类别，上传 128px 图标、小宣传图和截图。
3. 隐私页填单一用途、bookmarks 与 favicon 权限说明、无远程代码，以及隐私政策链接。按照表单对“收集”的定义如实披露本地处理与主动外部搜索，不把“不上传开发者”误写为“不处理任何用户数据”。
4. 核对当前账号的发布者身份、公开联系信息、地区与免费公开分发；协议、权利和政策承诺由账号持有人审阅后处理。
5. 完成后台校验后提交审核；通过前不应写“已上架”。保存扩展 ID 和商店 URL，以后更新上传到同一条目。

## Edge 提交

完成 Microsoft Edge 开发者注册后，进入 Edge 扩展工作区创建新条目，上传同一扩展 ZIP，填写 LISTING.md 中的内容、隐私说明与审核测试步骤，并添加 300px 图标和截图。免费公开分发。未完成注册前无法代建条目。

## 授权和审核边界

已保留原作者 MIT 及其原创资产许可来源，但原作者明确排除了《明日方舟》名称/标志/原片设计和三段原片短音等第三方内容。当前包仍包含这些既有元素。本轮未声称获得官方授权，未代勾选“拥有全部权利”等声明，也没有擅自删除或替换用户已验收的视觉与音效。若审核要求对应证明，需要账号持有人处理或另行决定替换方案；上传并不保证审核通过。

## 构建与检查

`npm run build:extension` / `npm run check:extension`。图标与宣传图需要 Node 可访问 sharp，再执行 `node scripts/build-store-assets.mjs`；也可用 `SHARP_MODULE` 指定 sharp 的入口文件。生成后用 `node scripts/check-store-assets.mjs` 校验图像尺寸和包内文档。

本轮仅新增商店元数据、128px 图标与随包隐私/来源/Three.js 许可；应用 JS/CSS 与 0.8.1 的构建内容一致，没有接入上游精细动效。

## 官方资料

- Chrome 发布：https://developer.chrome.com/docs/webstore/publish
- Chrome 图像要求：https://developer.chrome.com/docs/webstore/images
- Chrome 隐私披露：https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- Edge 发布：https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension
- Edge 开发者注册：https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/create-dev-account

验证：扩展构建、20 项扩展检查通过；提供两张 1280×800 截图（亮色主界面、本地书签搜索）。预览出现一条 GPU 着色器浮点舍入警告（X4122），未出现 JavaScript 错误；未改写用户已验收的渲染实现。
