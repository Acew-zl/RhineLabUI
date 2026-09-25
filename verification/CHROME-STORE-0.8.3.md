# Chrome 商店专用版 0.8.3

2026-09-25：Chrome 0.8.2 因 Red Argon（新标签页同时改变搜索体验）被拒。Chrome 商店专用版保留书签搜索、网址直达、三维档案和打开方式设置；关键词使用 `chrome.search.query()`，遵循浏览器当前默认搜索引擎。引擎下拉框和 `rhine-search-engine` 偏好不进入 Chrome 产物。Edge 商店与 GitHub 完整版仍为 0.8.2，保留 Bing／Google／百度选择。

Chrome 商店产物：`release/RhineLab-Chrome-Store-0.8.3.zip`，29,620,848 字节，SHA-256 `6C29BAFB0A47890EA43950CF055996F16E3E1FED1C148E54A7FBB972B4ABA1D0`。ZIP 根目录含 `manifest.json`，825 个文件，版本 0.8.3，权限为 `bookmarks`、`favicon`、`search`。已有 GitHub 完整版 `RhineLab-NewTab-0.8.2.zip` 的 SHA-256 仍为 `2870D8B413E699C18A31A9A6BA0AA7D06F0F6FE9AD9A81A2306312E6105E58CA`。

构建与检查：

- `npm run build:extension:chrome`、`npm run check:extension:chrome`：构建及三项搜索行为检查通过；产物扫描确认无固定 Bing／Google／百度搜索 URL、无独立引擎偏好或选择器。
- `npm run build:extension`、`npm run check:extension`：完整版构建与原有 20 项检查通过；产物仍包含三个可选搜索引擎。
- `npm run build`：普通网页构建通过。

旧商店搜索截图 `store/media/03-search-1280x800.jpg` 包含 Bing 下拉框，不能继续用于 Chrome 0.8.3 的商店页面。上传和文案调整见 `store/CHROME-PUBLISH.md`。当前验证未替代 Chrome Web Store 的重新审核，也未声称已经通过审核。

政策依据：[Chrome 新标签页搜索规定](https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines-faq)、[Chrome Search API](https://developer.chrome.com/docs/extensions/reference/api/search)。
