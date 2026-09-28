# 上游更新与性能评估 · 2026-09-28

本次读取原作者公开仓库、提交及实际文件差异，没有合并或移植上游代码。当前扩展另行实现帧率控制，验证见 [NEW-TAB-PERFORMANCE.md](../verification/NEW-TAB-PERFORMANCE.md)。

## 网页仓库

检查 [LBEILC/RhineLabUI](https://github.com/LBEILC/RhineLabUI)，main 为 [`ee57797`](https://github.com/LBEILC/RhineLabUI/commit/ee5779741c6c0c916e416705fa634c7abf905c73)。与[上次检查](UPSTREAM-REVIEW-2026-09-21.md)的 `6185da2` 相比，仅三份文件改变：PWA worker、重定向测试、Cloudflare 部署说明。

9 月 26 日修复 Cloudflare 将 `/index.html` 重定向到 `/` 后，Service Worker 缓存的首页响应造成 Edge `ERR_FAILED`。新 worker 从规范目录地址预缓存首页，并在读取旧的 redirected 缓存响应时重建 Response，保留内容、状态和标头。它处理网页刷新及离线导航失败，与三维帧率、模型、纹理或 GPU 占用无关。扩展不注册 PWA，所以无需为起始页移植此补丁；若以后部署 Fork 的独立 PWA，应单独引入并运行上游测试。

共同祖先 `17a1611` 后，main 第一父链共有三次更新：

| 日期 | 内容 | 对当前起始页的建议 |
| --- | --- | --- |
| 9 月 20 日 | [PR #9 精细动效](https://github.com/LBEILC/RhineLabUI/pull/9)，最终 14 项独立开关 | 用户此前决定暂不加入，继续保留。静止起伏关闭有机会让静止画面复用，但与限制每秒绘制次数是不同的方案 |
| 9 月 21 日 | [原创资产 MIT 范围说明](https://github.com/LBEILC/RhineLabUI/commit/6185da2b1891aa9484e90ef233d360cdae655b89) | 已在来源说明中链接，未更改 LICENSE；第三方权利仍不包括在内 |
| 9 月 26 日 | Cloudflare/PWA 首页缓存修复 | 仅独立网页 PWA 需要，扩展无需接入 |

本次新增更新没有修改 `src/main.ts`、`src/scene.ts`、`src/render-quality.ts`、`src/quality-renderer.ts`、模型或依赖。未发现原作者近期为网页主线新增帧率限制或 GPU 负载修复。

## 壁纸仓库

原作者另行维护 [LBEILC/RhineLabWallpaper](https://github.com/LBEILC/RhineLabWallpaper)，检查时 main 为 [`d24e791`](https://github.com/LBEILC/RhineLabWallpaper/commit/d24e79126294da9bc7815dd7694dd93d090576e1)。这些更新不能直接当作网页仓库的缺失功能。

按[更新记录](https://github.com/LBEILC/RhineLabWallpaper/blob/d24e79126294da9bc7815dd7694dd93d090576e1/docs/CHANGELOG.md)及 9 月 25 日的实际提交：

- 页脚可以切换档案展示/工作台，临时打开完整工作台后恢复 Wallpaper Engine 自定义配置。信息、时间及两个快捷按钮有独立开关。
- 左侧时钟/事项、右侧面板、底部导航可各自横向/纵向移动，范围 −300～300px，兼容 HUD 曲面和全局边距；修复只启用部分功能时的连续编号。
- 新增专注结束提醒、按钮操作音；随后增加按钮声与专注提醒声的独立开关。
- 三种音乐律动的强度上限提高到 300%，默认仍为 100%。
- 9 月 14 日已有工作台日期/星期排版、中英文设置与创意工坊说明调整。

以上主要服务于桌面宿主、工作台和音频频谱，当前书签起始页无需引入。此次未运行作者壁纸工程，不能把其验证记录当作本扩展验证。

## 原作者做过哪些性能工作

原项目在 9 月 12 日已经做过保留视觉的优化，包括阴影更新复用、实例矩阵变化区间上传、静止画面复用，以及 AO/景深同分辨率时共用深度。这些已经存在于本 Fork 的基础代码，见上游 [PERFORMANCE-INTEGRATION.md](https://github.com/LBEILC/RhineLabUI/blob/ee5779741c6c0c916e416705fa634c7abf905c73/verification/PERFORMANCE-INTEGRATION.md)。

壁纸还提供高/中/低模型精度；中低精度会删减部分几何和细节，属于有画面取舍的优化。Fork 已保留模型对照实验的历史文件，但尚未把中低精度作为起始页正式设置，不应把它们与完整质量等同。

默认静止起伏仍会改变实例位置，所以现有静止画面复用不能消除空闲重绘。当前起始页还用独立屏幕分辨率层绘制清晰书脊，这也增加了每帧工作量。新版先限制帧率，不降低分辨率、删减模型或关闭光影。

## 分支维护判断

检查开始时，Fork 比上游提交计数为领先 13 / 落后 55；这个数字包含 PR 带入的旧侧分支历史，不能解释成遗漏了 55 项新功能。应按 main 第一父链及实际文件增量维护。

建议继续保持 `origin` 与 `upstream` 分离，选择性接入和起始页有关的修复。直接合并全部变化会碰到书签映射、顶部清晰层、启动方式、镜头和设置布局的自定义实现，且不会解决本次 GPU 高占用。现阶段没有必须补进扩展的最新上游性能补丁。
