# 0.2.0 书签扩展验证

2026-09-15。基于 0.1.0 的本地打包与出场准备，保留原始模型、动画、画质和普通网页内容。更新步骤见 [EXTENSION.md](../docs/EXTENSION.md)。

## 本次实现

- 用浏览器书签栏构建动态列：根部书签第一列，顶层文件夹随后；嵌套书签按顺序归入顶层列，空文件夹保留占位。不限制为原来的五列、每列八条。
- 浏览器保存的名称作为封面备注，Logo 与名称分别开关并持久化。背景封面使用一个纹理图集和实例化网格，跟随档案原有位置、遮挡和运动；选中封面使用较高分辨率。
- 图标通过 Chromium `_favicon` 本地接口读取，可见书签按需请求，最多六个并发；失败使用名称首字符。没有使用第三方图标服务。
- 搜索框支持 Bing、Google、百度和 HTTP(S) 地址；档案索引检索名称、网址和路径。打开书签前过滤可执行 URL。收藏按浏览器书签 ID 保存。
- 检测书签变化后提示刷新，不在当前动画中替换整个目录。
- 将弃用的 PCFSoftShadowMap 改为 PCFShadowMap，即当前 Three.js 已经自动采用的类型。

## 自动检查

执行：

```sh
node --experimental-strip-types --test scripts/check-bookmarks.mjs scripts/check-content.mjs scripts/check-loop.mjs scripts/check-motion.mjs scripts/check-presentation-preparation.mjs
npm run build:extension
npm run check:extension
npm run build
```

30 项测试通过。包含旧档案内容与循环回归、出场准备、根书签/文件夹/嵌套顺序、同名与空文件夹、多个书签栏根节点、URL 过滤、搜索编码、45 条不等长列的循环，以及 2000 条目录索引。扩展包检查和其 10 项测试通过。

扩展构建产物 821 个文件、33.8 MiB；普通网页构建 819 个文件、33.8 MiB。构建有现有大代码块提示，没有编译错误。扩展仅声明 bookmarks、favicon 权限；检查本地资源、CSP、无 PWA 和额外权限。

## 浏览器检查

Chrome 中通过 `npm run preview:extension` 检查实际扩展产物，HTTP 响应使用扩展同样的 CSP。显式 `?bookmarks-demo=1&scene=archive` 加载公开样例，页面明确标注演示数据；没有导出或保存个人书签。

- 确认根部两条、嵌套目录两条、空列及 45 条列；从首条反向到 45/45，再向前循环返回。附近八个刻度随选档更新。
- 确认详情显示名称、网址及文件夹；保留原三维外观与详情入口。
- 检查 Logo+名称、仅名称、仅 Logo、全部隐藏四种状态，并验证刷新后保存。HTTP 无 favicon API，因此本次图像检查使用首字符占位，未冒充真实站点 Logo。
- 最终 `?bookmarks-demo=1&scene=archive&prewarm=1` 页面进入阵列，`data-preparation` 为 ready；一次观测编译约 147ms、准备总计约 667ms、首个可见帧约 17ms。这是本机单次检查，不是跨设备性能保证。
- 最终预热页捕获的 warn/error 日志为空，无截图中的弃用警告。

## 尚需安装环境验收

浏览器自动化安全策略阻止访问已安装的 `chrome-extension://` 页面，因此没有绕过该限制，也没有声称完成真实扩展 API 验证。需要用户重新加载 0.2.0 并接受新增权限，核对实际书签顺序、站点 Logo、书签更新提示及离线新标签页。HTTP 预览不能验证这些宿主能力。旧的扩展错误列表须清除后再观察新增日志。

接口依据：[Chrome bookmarks API](https://developer.chrome.com/docs/extensions/reference/api/bookmarks)、[Chrome favicon 用法](https://developer.chrome.com/docs/extensions/how-to/ui/favicons)。
