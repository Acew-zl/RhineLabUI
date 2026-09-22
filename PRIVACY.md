# 隐私政策 / Privacy Policy

**Rhine Lab · 莱茵生命起始页**
发布者 / Publisher: Acew-zl
更新日期 / Updated: 2026-09-22

本扩展将浏览器新标签页替换为可搜索的三维书签起始页。无需注册扩展账号；开发者不运营用于接收书签、搜索记录或使用统计的服务器。

## 处理的数据与用途

- **书签**：经浏览器授予 bookmarks 权限后，扩展读取书签树（名称、网址、文件夹层级与标识符），使用书签栏内容在本机生成档案列和搜索结果，并监听修改以提示刷新。扩展不会新增、修改或删除浏览器书签，也不会将书签树发送给开发者。
- **网站图标**：通过浏览器的 favicon 接口读取缓存图标，用于书脊和书签列表。扩展不向第三方图标服务发送网址，也不主动抓取书签网站来取得图标。
- **本地偏好**：画质、主题、声音、启动方式、搜索引擎、打开方式、显示开关及扩展内收藏的书签标识保存在本机扩展存储空间。扩展不通过自己的服务同步这些偏好。
- **搜索输入**：输入时在本机匹配书签，不请求远程联想，也不保存查询历史。只有主动提交网络搜索时，才会在浏览器中打开所选搜索引擎的 HTTPS 搜索页面并将查询交给该引擎；当前可选 Bing、Google、百度。
- **主动打开链接**：点击书签或输入网址后，浏览器访问用户指定的目标网站；目标网站和搜索引擎按自己的隐私政策处理请求，浏览器也可能依其设置保存浏览记录。

扩展没有广告、分析 SDK、使用行为上报或远程执行代码；不读取网页正文、密码、支付信息、邮箱或浏览历史数据库。开发者不会出售、共享或使用书签数据进行广告分析、信用判断等与起始页功能无关的用途。

扩展对用户数据的使用遵循 Chrome Web Store 用户数据政策的有限使用要求：仅为已说明的书签起始页功能处理数据；不将其出售、用于广告或信用判断，也不供开发者人工查看。

## 保存、删除与控制

书签和图标在打开的扩展页面中用于显示；页面关闭后其运行时缓存不再保留。本地偏好与扩展内收藏保留至用户修改、清除扩展数据或卸载扩展。实际浏览器书签仍由浏览器管理，卸载本扩展不会删除书签。浏览器自身的账号同步及备份由浏览器设置和服务条款决定。

可在扩展设置中修改偏好，在浏览器书签管理器中管理书签，在扩展管理页禁用或卸载本扩展。主动提交的网络搜索和目标网站数据应向相应服务管理。

## 支持与政策更新

项目主页和公开反馈入口：[Acew-zl/RhineLabUI](https://github.com/Acew-zl/RhineLabUI)。公开反馈时请勿附上个人完整书签、身份信息或其他敏感内容。用户主动在 GitHub 提交的信息由 GitHub 按其隐私政策处理，不是扩展自动上传。

若数据处理方式改变，将同步更新本政策和商店披露。

---

## English

Rhine Lab New Tab replaces the browser's new-tab page with an interactive, searchable 3D bookmark interface. No extension account is required, and the publisher operates no server that receives bookmarks, search history, or usage analytics.

With the browser's bookmarks permission, the extension reads the bookmark tree (titles, URLs, folder structure, and identifiers), displays the bookmarks bar locally, and listens for changes to offer a refresh. It does not create, edit, or delete browser bookmarks or send the tree to the publisher. Website icons are read from the browser's favicon cache; no third-party icon service or direct website fetch is used to retrieve icons.

Preferences and IDs saved as favorites inside the extension remain in local extension storage. Typed search text is matched locally without remote suggestions or a stored search history. Only an explicit web-search submission opens the selected provider (Bing, Google, or Baidu) over HTTPS with the submitted query. Opening a bookmark or entered address navigates to the user's chosen destination. Those services apply their own privacy policies, and the browser may record browsing history according to its settings.

There are no ads, analytics SDKs, telemetry, or remotely executed code. The extension does not read web-page content, passwords, payment information, email, or the browsing-history database. Bookmark data is not sold, shared by the publisher, or used for advertising, credit decisions, or purposes unrelated to the new-tab experience.

Use of user data complies with the Chrome Web Store User Data Policy, including its Limited Use requirements. Data is handled only for the disclosed new-tab features, is not sold or used for advertising or credit decisions, and is not made available for human review by the publisher.

In-memory bookmark/icon data lasts for the open page. Local preferences and saved bookmark IDs remain until changed, extension data is cleared, or the extension is uninstalled. Browser bookmarks are managed by the browser and are not deleted on uninstall. Browser account synchronization and backups are governed by the browser's settings and policies.

Support and project information: https://github.com/Acew-zl/RhineLabUI . Avoid posting private bookmark lists or sensitive information in public feedback. Information voluntarily posted to GitHub is governed by GitHub's policy and is not uploaded automatically by this extension. This policy and store disclosures will be updated if data practices change.
