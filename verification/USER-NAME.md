# 首次开场显示名称 · 0.8.5

2026-09-28。用户指定首次在身份动画中输入一次，用 Enter 确认；留空沿用 JOYCE MOORE，之后本机保存，可在设置更改。仅浏览器扩展启用，普通网页和壁纸继续使用原名称。

## 行为与实现

- 完整开场停在原片第 339 帧（应用时间 8.56 秒，原片 13.56 秒）。保留原身份前缀、标志、背景和构图；名字位置显示透明输入框及淡色默认提示。此时冻结时间轴和开场音效触发，三维准备继续进行，确认后从同一时间继续。
- 首次跳过、简短开场、直接进入和减少动态效果同样提供一次名称确认；确认后按原启动偏好进入，不修改已保存的启动方式。页面中已保存的确认状态（包括留空使用默认名）避免重开或重播重复询问。
- Enter 与同风格确认按钮均可提交，中文输入法选字时不提交。保留名称大小写、中文及完整 Emoji；NFC 规范化、移除控制字符，限制为 24 个完整字符。默认名称保留原固定字形；自定义文字使用已有 MiSans 和系统 Emoji，无新字体许可资源。
- 设置「03 / 启动与动效 → 显示名称」按 Enter 或失焦保存，清空恢复默认；开场、页脚、设置简介和本机读取记录共用该名称。已打开的新标签页通过本机 storage 事件同步。
- 名称及确认状态位于 `localStorage['rhine-user-name']`，不读取浏览器账户，不新增 manifest 权限，不发送网络请求。存储不可用时当前页面仍可继续，并提示下次可能需重新输入。隐私政策和商店审核说明已补充本地处理用途与删除方式；商店包更新尚未提交。

## 验证

`npm run check:extension`：26 项通过（含 3 项名称持久化、Unicode/字符长度、损坏/拒绝存储测试）。`npm run check:extension:chrome`：3 项 Chrome 默认搜索测试通过。完整版、Chrome 专用版及普通网页构建通过。

`scripts/check-user-name-browser.mjs` 在独立 Edge 浏览器中加载最终构建，按 manifest 的实际 CSP 提供本机演示页；使用明确标记的示例书签，无真实书签或账号。两种扩展构建均验证：

1. 完整动画自然运行至首次输入位置、保持暂停、自动聚焦、淡色默认名。
2. 中文、字面 HTML 符号和 Emoji 显示，IME Enter 不提交，正常 Enter 提交后继续。
3. 设置修改、重新加载后不再询问、已打开页面同步名称。
4. 直接、简短、减少动态效果时首次留空确认；后续按原启动方式进入。
5. 首次点击跳过仍先完成一次名称确认，不由确认 Enter 打开书签。

两种构建均无页面异常。完整版检查 1920×1080、1440×900、1366×768；Chrome 专用构建使用相同场景。此为本机 HTTP/CSP 运行检查，未宣称商店已更新。

结果：[完整版](user-name/results.json)、[Chrome 专用构建](user-name-chrome/results.json)。界面：[首次输入](user-name/first-use.png)、[确认后](user-name/confirmed.png)、[设置](user-name/settings.png)。

复现：先构建对应版本，设置 `PLAYWRIGHT_MODULE` 指向已安装的 Playwright，再执行 `node scripts/check-user-name-browser.mjs`；Chrome 专用包设置 `USER_NAME_ROOT=release/extension-chrome`、`USER_NAME_OUTPUT=verification/user-name-chrome`。
