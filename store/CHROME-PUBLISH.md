# Chrome 上架操作清单

Chrome 0.8.2 于 2026-09-24 因新标签页自选网络搜索引擎被拒（Red Argon）。现改用遵循 Chrome 默认搜索引擎的 0.8.3 专用包。Edge 商店及 GitHub 完整版 0.8.2 保持原样。

## 1. 上传扩展

打开你已登录的 Chrome Web Store 开发者后台，在**原有被拒的条目**上传新版本，不要创建新条目。选择：

`D:\Project\RhineLabUI\release\RhineLab-Chrome-Store-0.8.3.zip`

这个 ZIP 的 `manifest.json` 位于根目录，版本为 0.8.3，权限为 bookmarks、favicon、search。不要上传 GitHub 完整版 0.8.2 或仓库源码 ZIP。

## 2. 商店详情

按 [LISTING.md](LISTING.md) 的“通用字段”和“详细介绍”填写。名称和简短描述已写在扩展 manifest 中。语言选简体中文，类别选效率（Productivity），免费、公开分发；若实际后台类别名称有变化，选最接近书签/效率的类别。

上传下列图片，均位于 [media](media/)：

| 表单位置 | 文件 | 尺寸 |
| --- | --- | --- |
| 商店图标 | icon-128.png | 128×128 |
| 屏幕截图 1 | 01-light-1280x800.jpg | 1280×800 |
| 小宣传图 | promo-440x280.png | 440×280 |

**请从 Chrome 商店条目移除旧的 `03-search-1280x800.jpg` 截图**：它展示了已经从 Chrome 版移除的 Bing 下拉菜单。保留 `01-light-1280x800.jpg` 即可展示主界面；后续若补搜索截图，须从 0.8.3 Chrome 专用包实际运行画面重新截取。截图使用明确标注的演示书签，不含你的个人书签。

网站填 `https://github.com/Acew-zl/RhineLabUI`。支持邮箱使用你愿意公开且能收信的邮箱；如后台要求验证，请自行收取验证邮件。不要把上游作者的域名或邮箱填成自己的。

## 3. 隐私权与权限

- 单一用途：复制 LISTING.md 的 Single purpose 段落。
- bookmarks、favicon、search：分别复制对应权限理由。search 仅供 `chrome.search.query` 遵循浏览器默认搜索引擎，不修改 Chrome 搜索设置。
- 是否使用远程代码：选“否”，说明文本已备好。
- 隐私政策网址：`https://github.com/Acew-zl/RhineLabUI/blob/main/PRIVACY.md`。

数据类型必须按实际表单定义披露。用户提供的 Chrome 截图中，「Website content」包括文本、图片和超链接，当前扩展本地处理的书签名称、网址及图标符合这一项，建议勾选。该截图把「Web history」定义为访问过的网页列表及访问时间；扩展不读取浏览历史。「User activity」举例为点击、鼠标位置、滚动或按键日志；扩展响应交互，但不记录这类行为日志。依这张截图的定义，这两项不勾选。身份、财务、健康、认证、私人通信与位置也不勾选。主动网络搜索会通过浏览器默认搜索引擎发送用户提交的查询，具体披露与隐私政策保持一致。

有限使用声明对应现有实现：不出售用户数据，不用于与书签起始页无关的目的，不用于信用判断。请阅读后台完整声明后自行确认。政策依据：[Chrome 官方隐私填写说明](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)、[本地数据也需披露的说明](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)。

## 4. 测试说明与分发

若有审核测试说明字段，复制 LISTING.md 最后的英文 Notes for certification；不需要测试账号、密码或订阅。选择面向公众免费分发，并核对可用地区。

## 5. 提交审核

处理后台列出的必填项，检查商店预览，点击提交审核。是否审核通过后自动发布，按你的发布偏好选择。审核期间仍不等于已上架。保存条目 ID，后续更新应在同一条目上传更高版本。

本项目为非官方同人扩展。第三方名称、标志及三段原片音效的许可边界见仓库 THIRD_PARTY_NOTICES.md；原作者 MIT 授权不覆盖这些第三方权利。不要将 MIT 当作官方授权证明；若后台要求权利确认或审核方要求证明，应先核实。
