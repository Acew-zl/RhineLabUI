# 浏览器发行版 0.8.2

发布日：2026-09-23。当前构建来自 `extension/manifest.json` 的 0.8.2，扩展资源全部本地打包。

## 安装入口

| 浏览器 | 安装方式 | 验证状态 |
| --- | --- | --- |
| Microsoft Edge（桌面） | [Edge 扩展商店](https://microsoftedge.microsoft.com/addons/detail/ghkdoeojkoenedlobcpaaeocopddkkmp) | 商店 0.8.2 已上线；本项目中验收过交互 |
| Google Chrome（桌面） | 商店审核中；当前使用本 Release 的 Chromium ZIP 解压加载 | 本项目中验收过交互 |
| Brave、Opera、Vivaldi（桌面） | 使用同一份 Chromium ZIP 解压加载 | Chromium 扩展架构可复用；尚未逐一实机验证 |
| Firefox | 暂无正式发行包 | 当前 Chromium 包含 Firefox 不支持的 `favicon` 权限与 `/_favicon/` 图标接口；常规分发还需要 Mozilla 签名 |
| Safari | 暂无正式发行包 | 需要 Apple 的 Safari 扩展打包、测试与审核，当前 ZIP 不可直接安装 |

下载文件：`RhineLab-NewTab-0.8.2.zip`。它适用于上表中的桌面 Chromium 浏览器；五种浏览器共用这一份文件，不需要重复上传相同内容的 ZIP。解压后，在浏览器扩展管理页开启开发者模式，选择「加载已解压的扩展」，指向含 `manifest.json` 的目录。Vivaldi 另需在「设置 → 标签页 → 新标签页」允许「由扩展控制」。手动加载的版本不会通过商店自动更新；Edge 用户优先安装商店版本。

SHA-256：`2870D8B413E699C18A31A9A6BA0AA7D06F0F6FE9AD9A81A2306312E6105E58CA`。

扩展包 0.8.2 来自提交 `7fc3ed1`；本次仓库文档更新未改动 JS/CSS、模型或扩展清单。发行包在此前构建时通过 `npm run build:extension`、`npm run check:extension` 的 20 项检查，并验证 ZIP 根目录为 `manifest.json`、共 825 个文件。该包没有经过 Brave、Opera、Vivaldi 的设备测试。

## 功能与来源

书签栏映射成三维档案列，支持顶部书脊图标与书签名称、本地书签和网络搜索、三种启动方式、亮暗主题及画质设置。书签只在本地处理；隐私说明见 [PRIVACY.md](../PRIVACY.md)，第三方素材与非官方身份见 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)。
