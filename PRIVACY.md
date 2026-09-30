# 隐私政策 / Privacy Policy

**Rhine Lab · 莱茵生命起始页**
发布者 / Publisher: Acew-zl
更新日期 / Updated: 2026-09-30

本扩展将浏览器新标签页替换为可搜索的三维书签起始页。无需注册扩展账号；开发者不运营用于接收书签、搜索记录或使用统计的服务器。

## 处理的数据与用途

- **书签**：经浏览器授予 bookmarks 权限后，扩展读取书签树（名称、网址、文件夹层级与标识符），在本机用书签栏内容生成档案列（用户可选择同时显示「其他书签」「移动设备书签」），用全部书签生成本机搜索结果，并监听修改以提示刷新。扩展不会新增、修改或删除浏览器书签，也不会将书签树发送给开发者。
- **网站图标**：通过浏览器的 favicon 接口读取缓存图标，用于书脊和书签列表。扩展不向第三方图标服务发送网址，也不主动抓取书签网站来取得图标。
- **本地偏好**：画质、主题、声音与静音、动态效果、启动方式及当天是否已播放完整开场、打开方式、显示开关及扩展内收藏的书签标识保存在本机扩展存储空间；同时打开的多个新标签页在本机相互同步这些偏好。非 Chrome 商店的完整版还保存用户自行选择的搜索引擎。扩展不通过自己的服务同步这些偏好。
- **自定义显示名称**：用户可在首次开场或设置中自行输入名称，用于开场身份文字、页脚及本机档案读取记录。名称和首次确认状态仅保存在本机，不上传或与浏览器账号关联；留空确认使用默认名称 JOYCE MOORE。不读取浏览器登录账号、邮箱或用户 ID。名称只是界面显示内容，不进行身份认证。
- **搜索输入**：输入时在本机匹配书签，不请求远程联想，也不保存查询历史。只有主动提交网络搜索时才会将查询交给搜索引擎。Chrome 商店版通过 Chrome Search API 使用浏览器当前的默认搜索引擎，不单独选择或修改默认引擎；Edge 商店版及 GitHub 完整版可由用户选择 Bing、Google、百度，提交时打开所选引擎的 HTTPS 搜索页面。
- **主动打开链接**：点击书签或输入网址后，浏览器访问用户指定的目标网站；目标网站和搜索引擎按自己的隐私政策处理请求，浏览器也可能依其设置保存浏览记录。书签指向浏览器内部页面（如 chrome://、edge://）或本地文件时，扩展通过浏览器的标签页接口在新标签页或当前页打开该地址，不读取任何标签页的内容、网址或标题。

扩展没有广告、分析 SDK、使用行为上报或远程执行代码；不读取网页正文、密码、支付信息、邮箱或浏览历史数据库。开发者不会出售、共享或使用书签数据进行广告分析、信用判断等与起始页功能无关的用途。

扩展对用户数据的使用遵循 Chrome Web Store 用户数据政策的有限使用要求：仅为已说明的书签起始页功能处理数据；不将其出售、用于广告或信用判断，也不供开发者人工查看。

## 保存、删除与控制

书签和图标在打开的扩展页面中用于显示；页面关闭后其运行时缓存不再保留。本地偏好与扩展内收藏保留至用户修改、清除扩展数据或卸载扩展。实际浏览器书签仍由浏览器管理，卸载本扩展不会删除书签。浏览器自身的账号同步及备份由浏览器设置和服务条款决定。

可在扩展设置中修改偏好及显示名称；清空名称并确认可恢复默认名称。在浏览器书签管理器中管理书签，在扩展管理页禁用或卸载本扩展。清除扩展数据或卸载后，本机名称与首次确认状态一并删除。主动提交的网络搜索和目标网站数据应向相应服务管理。

## 支持与政策更新

项目主页和公开反馈入口：[Acew-zl/RhineLabUI](https://github.com/Acew-zl/RhineLabUI)。公开反馈时请勿附上个人完整书签、身份信息或其他敏感内容。用户主动在 GitHub 提交的信息由 GitHub 按其隐私政策处理，不是扩展自动上传。

若数据处理方式改变，将同步更新本政策和商店披露。

---

## English

Rhine Lab New Tab replaces the browser's new-tab page with an interactive, searchable 3D bookmark interface. No extension account is required, and the publisher operates no server that receives bookmarks, search history, or usage analytics.

With the browser's bookmarks permission, the extension reads the bookmark tree (titles, URLs, folder structure, and identifiers), displays the bookmarks bar locally (optionally also "Other bookmarks" and "Mobile bookmarks"), searches all bookmarks locally, and listens for changes to offer a refresh. It does not create, edit, or delete browser bookmarks or send the tree to the publisher. Website icons are read from the browser's favicon cache; no third-party icon service or direct website fetch is used to retrieve icons.

Preferences and IDs saved as favorites inside the extension remain in local extension storage. The Edge and GitHub full builds also store the user's selected search provider locally. Typed search text is matched locally without remote suggestions or a stored search history. Only an explicit web-search submission sends the query to a search provider. The Chrome Web Store build uses the Chrome Search API and the browser's current default provider; it does not select or change that provider. The Edge and GitHub full builds let users choose Bing, Google, or Baidu and navigate to the chosen provider over HTTPS. Opening a bookmark or entered address navigates to the user's chosen destination; bookmarks to browser pages (such as chrome:// or edge://) or local files are opened through the browser's tab API without reading any tab's content, URL, or title. Those services apply their own privacy policies, and the browser may record browsing history according to its settings.

Users may voluntarily enter a display name during the first opening or in settings. It appears in opening identity text, the footer, and local archive access records. The name and first-use confirmation state remain on the device, are not uploaded, and are not associated with a browser account. An empty confirmation uses JOYCE MOORE. No browser account, email address, or user ID is read, and this decorative name does not authenticate identity. Users can change or reset it in settings; clearing extension data or uninstalling removes both the name and confirmation state.

There are no ads, analytics SDKs, telemetry, or remotely executed code. The extension does not read web-page content, passwords, payment information, email, or the browsing-history database. Bookmark data is not sold, shared by the publisher, or used for advertising, credit decisions, or purposes unrelated to the new-tab experience.

Use of user data complies with the Chrome Web Store User Data Policy, including its Limited Use requirements. Data is handled only for the disclosed new-tab features, is not sold or used for advertising or credit decisions, and is not made available for human review by the publisher.

In-memory bookmark/icon data lasts for the open page. Local preferences and saved bookmark IDs remain until changed, extension data is cleared, or the extension is uninstalled. Browser bookmarks are managed by the browser and are not deleted on uninstall. Browser account synchronization and backups are governed by the browser's settings and policies.

Support and project information: https://github.com/Acew-zl/RhineLabUI . Avoid posting private bookmark lists or sensitive information in public feedback. Information voluntarily posted to GitHub is governed by GitHub's policy and is not uploaded automatically by this extension. This policy and store disclosures will be updated if data practices change.
