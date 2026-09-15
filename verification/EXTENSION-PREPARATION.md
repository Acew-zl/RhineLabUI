# 扩展基础与出场准备验证

日期：2026-09-15。基线：原作者 main `17a1611`；交付目标为 Acew-zl/RhineLabUI。

## 构建与自动检查

- `npm run build:extension`：通过。818 个运行文件，33.8 MiB；包含两份版本化 GLB、完整本地 MiSans 分包、三轨音频和档案 TXT。
- `npm run check:extension`：包结构、入口脚本、图标、模型、音频、CSS 资源路径、无 PWA 产物、无额外权限、无独立授权 Novecento kit 检查通过；三项开场时间边界测试通过。
- `npm run build`：普通网页及 PWA 构建通过。
- `node --experimental-strip-types --test scripts/check-presentation-preparation.mjs scripts/check-motion.mjs scripts/check-loop.mjs scripts/check-content.mjs`：23/23 通过，包括 20,000 次循环移动及原抽取动作检查。
- `git diff --check`：通过。Vite 仍提示既有大型 Three.js 主包；未为本轮拆分或降低画质。

既有 `check-startup-entry.mjs` 依赖未安装的 Playwright，直接运行因缺少依赖退出；本轮启动交互通过连接的 Chrome 浏览器逐项验证，未将该脚本记为通过。

## Chrome 运行验证

使用 `npm run preview:extension` 提供 **实际 release/extension 产物**，响应头采用 manifest 中同一份 CSP。测试窗口约 1498×718 CSS px，默认原始画质；不是性能基准测试。

- 完整开场进入三维与详情，切列、打开另一档案、进入 360° 查看器并切换拆解状态可用。
- 设置保留声音、减少动态效果、画质；没有网页 PWA 安装/更新入口。
- 正常运行及查看器没有捕获到 JavaScript/CSP 错误。已有 Three.js PCFSoftShadowMap 弃用警告仍在。
- 首次观测预热编译约 721 ms，总准备约 5648 ms；其后的首次可见 `scene.update` 调用约 21.2 ms。后续缓存运行准备约 764 ms。数字是单机单次 JavaScript 调用耗时，包含驱动提交成本，不等于 GPU 完成时间或全设备稳定帧率；也不是冷缓存前后性能对比。
- 模型请求人工延迟 45 秒：字体就绪后可启动 2D；未准备好时观察到 `ready=false, bootTime=21.85`，保持在三维出现之前；点击进入后可到档案阵列。
- 模型请求返回 503：显示 CONNECTION INTERRUPTED，RECONNECT 可以触发重新加载，未被 CSP 阻止。
- 静音与减少动态效果开启后，无须解锁声音，显示准备状态后进入阵列。

## 不推进动画的预热对照

同一浏览器分别打开：

```
http://127.0.0.1:5190/?time=26&freeze=1
http://127.0.0.1:5190/?time=26&freeze=1&prewarm=1
```

显式对照默认沿用原启动路径，`prewarm=1` 仅启用准备步骤。两页固定时间画面经截图检查；DOM 渲染统计中以下值完全一致：

| 项目 | 未预热 / 预热 |
| --- | --- |
| 模型位置 | `[0, -2.3281, -2.17]` |
| 相机位置 | `[-108.6679, 45.4631, 62.7146]` |
| 抽取 | `0.209` |
| 阵列实例数 | `159`（另有选中模型） |

实现没有改模型、材质参数、灯光或动效函数；预热仅临时填充实例矩阵，完成后恢复，不调用动画 `update()`。阴影、AO、景深和抗锯齿仍按用户画质启用。

## 复现慢加载 / 失败

PowerShell 在独立终端运行，可选环境变量只影响验收服务器：

```powershell
$env:PORT = '5191'
$env:MODEL_DELAY_MS = '45000'
npm run preview:extension
```

另一个终端设置 `PORT=5192`、`MODEL_FAIL=1` 可模拟模型失败。停止服务器后删除相应环境变量即可。

页面 `#three-scene` 的 `data-preparation` 暴露准备状态与首帧调用耗时，`data-render-stats` 暴露原场景统计；开发控制台也可查看既有 `window.rhine.stats()`。

## 验收范围

本轮完成构建、相同 CSP 下的实际产物浏览器检查，未在用户日常浏览器中自动安装或上架扩展。真实 `chrome-extension://` 新标签页覆盖、安装提示及断网新建标签页，需要按 [安装说明](../docs/EXTENSION.md) 在 Chrome / Edge 中验收。HTTP 预览不能替代这部分验证。Firefox / Safari 安装兼容性不在当前目标内。
