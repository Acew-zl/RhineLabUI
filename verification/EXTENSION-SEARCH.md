# 第四阶段：搜索与收尾（0.3.0）

2026-09-16。沿用原生 TypeScript、既有样式和模型，不增加依赖或扩展权限。搜索栏位于品牌下方，复用原检索放大镜、字体、细线和主题变量。保留三维开场、动作、画质和档案索引。

## 实现与边界

搜索引擎可在搜索栏及设置切换并保存。HTTP(S) 地址直接打开，裸域名默认 HTTPS；关键词在主动提交时交给选定引擎。书签匹配只在本地进行，不保存查询、不调用远程联想。按名称、网址、文件夹多词匹配，名称完全匹配和前缀匹配优先，最多显示五条。

输入框采用 combobox/listbox 语义、活动结果提示和匹配数量播报。上下键选择，Enter 打开；无选择时 Enter 搜索网络。输入区隔离三维快捷键，保留 Tab 的原生焦点行为。Esc 分步收起、清空和失焦。处理 composition/isComposing/229，避免中文组词时提交。原 ARCHIVE INDEX 保留完整检索。

收尾修正：移除索引入口不再适用的 `/` 提示；清空输入同步删除旧结果，防止方向键选到隐藏的旧书签；键盘打开书签独立处理，避免浏览器隐式提交点击搜索箭头时丢失活动结果。无站点 Logo、空文件夹等边界仍沿用 0.2.0。

## 验证

- `node --experimental-strip-types --test scripts/check-bookmarks.mjs scripts/check-content.mjs scripts/check-loop.mjs scripts/check-motion.mjs scripts/check-presentation-preparation.mjs`：31 项通过。
- `npm run check:extension`：包检查及 11 项测试通过。新增覆盖多词匹配、全角大小写归一、排序、空目标排除、域名查询串、本地网址、邮件与可执行协议作为普通搜索文字处理。
- `npm run build:extension`、`npm run build` 均通过，只有既有的大代码块提示；普通网页继续构建原档案和 PWA。
- Chrome 本地实际扩展产物、同样 CSP、显式样例数据：1920×1080 明暗主题，390×844 竖屏，800×450 紧凑横屏完成截图检查。搜索区域未横向溢出，长结果省略，短窗口列表独立滚动。
- UI 检查：本地匹配、上下键活动结果、Esc 收起/清空、× 清空后方向键无旧选项、`/` 聚焦、引擎选择及刷新保存、HTTP 地址提交均通过。最后本地页 warn/error 日志为空。
- 通过键盘选择公开样例书签后观察到正确目标 URL；后续读取登录态 GitHub 仪表盘被自动审批阻止，停止外部页面检查，其他验证仅使用本地页面。

未进行真实中文输入法候选窗或手机软键盘实机测试；上述输入法保护通过代码检查，桌面 Chromium 窗口模拟不等于手机实机。已安装扩展的书签/favicon 宿主 API 仍待用户验收，未绕过上一阶段的浏览器安全限制。

更新使用 `release/extension` 或 `release/RhineLab-NewTab-0.3.0.zip`，在扩展管理页重新加载后新建标签页。详见 [EXTENSION.md](../docs/EXTENSION.md)。
