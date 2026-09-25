# 商店发布字段

状态：Edge 完整版 0.8.2 已上线；Chrome 0.8.2 因搜索体验被拒，以下商店文案适用于待重新提交的 Chrome 专用版 0.8.3。具体账号资料使用商店当前登录账号；不要猜填法定姓名、地址或公开联系邮箱。

## 通用字段

- 名称：Rhine Lab · 莱茵生命起始页
- 简短描述：将书签栏变成可交互的三维档案新标签页，支持本地书签搜索、网站图标和明暗主题。
- 语言：简体中文（zh-CN）
- 类别建议：Productivity / 效率
- 定价：免费
- 可见性：公开
- 网站：https://github.com/Acew-zl/RhineLabUI
- 隐私政策：https://github.com/Acew-zl/RhineLabUI/blob/main/PRIVACY.md
- 支持：使用已验证可用的项目反馈入口或账号公开支持信息
- 不设置 Google 官方网站认证，不声称拥有原作者域名。

## 详细介绍（可直接粘贴）

把浏览器书签栏变成一座可操作的三维档案阵列。

Rhine Lab · 莱茵生命起始页是一款以玻璃档案终端为视觉主题的新标签页扩展。安装后，新建标签页即可浏览自己的书签栏、搜索书签或打开常用网站。

主要功能：
• 书签栏根部书签组成第一列，顶层文件夹各占一列；支持左右切换文件夹、上下选择书签、拖动与滚轮浏览。
• 朝上的书脊显示网站图标和浏览器保存的书签名称，图标与文字可以分别关闭；各列保留选档记忆。
• 打开书签默认新建标签页，让起始页继续保留；也可在设置中改为当前页打开。
• 顶部搜索框支持本地书签匹配和主动网络搜索；网络搜索遵循 Chrome 当前的默认搜索引擎。
• 完整开场、简短开场或直接进入三维档案三种启动方式，提供亮色/暗色主题、声音和画质设置。
• 保留档案详情和 360° 模型查看、旋转、拆解与重组。

隐私与权限：
扩展在本机读取书签栏和浏览器缓存的网站图标，不修改浏览器书签，不向开发者上传书签列表，不含广告或使用统计。只有主动提交网络搜索或打开书签时才访问相应网站。模型、字体和声音随扩展本地打包。

使用说明：
需要支持 WebGL 2 的桌面浏览器。没有书签时，可先在浏览器书签栏添加内容。网站图标取决于浏览器缓存，缺失时会显示占位；可在设置中重试。三维画面会使用 GPU，低配设备可选性能档。扩展替换新标签页，不修改默认搜索引擎或浏览器启动页设置。

本项目由 Acew-zl 基于 LBEILC/RhineLabUI 改造，是《明日方舟》相关的非官方同人项目，与官方制作方无隶属或背书关系。界面语言以中文为主，部分装饰文字为英文。

## 单一用途 / Single purpose

Replace the browser new-tab page with a locally rendered 3D bookmark launcher, enabling users to find and open their bookmarks or explicitly search the web from that page.

## 权限说明

bookmarks: Read the browser bookmark tree and display the bookmarks bar as folder-based 3D archive columns. Listen for changes to offer a refresh. Used only locally for the visible bookmark launcher and search; the extension never creates, edits, deletes, or uploads bookmarks.

favicon: Read browser-cached favicons through the extension favicon endpoint so users can identify bookmarks on archive spines and search results. No third-party favicon service is used.

search: Submit a query typed by the user from the new-tab search box through Chrome's Search API, using the browser's current default search provider. The extension does not modify the provider. The opening mode follows the user's new-tab/current-tab preference.

Remote code: No. JavaScript, fonts, GLB models, and audio are bundled inside the extension. Web searches and opened bookmarks are ordinary user-requested navigations, not remotely executed extension code.

## 数据披露依据

本地处理书签名称/网址/文件夹、图标、用户输入的搜索词和偏好；开发者不接收这些数据。表单如将“收集”定义为离开设备，须依其实际提示作答，不能仅凭不上传就笼统宣称完全不处理用户数据。所有披露与 PRIVACY.md 保持一致。不得自动勾选尚未核实的权利或法律承诺。

## 审核测试说明 / Notes for certification

No test account or paid subscription is required. Install the extension and open a new tab. Add two bookmarks to the browser bookmarks bar and a folder with a bookmark if the test browser has none. Allow the startup resources to finish, then enter the interface. Use left/right to switch folders and up/down or the mouse wheel to select a bookmark. Enter opens the selected bookmark in a new tab by default; double-clicking the selected 3D archive opens details. Type into the top search box to see local bookmark matches; submitting an unselected keyword invokes chrome.search.query with Chrome's current default search provider. The extension has no provider selector and does not change Chrome's default provider. Settings support short/direct startup, light/dark theme, and performance quality. All render resources are local. Favicon availability depends on browser cache. Screenshots use explicitly marked sample bookmarks, not personal user data.
