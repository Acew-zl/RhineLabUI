# 开场末尾白场覆盖

2026-09-30。用户反馈：开场快结束时出现的白屏没有铺满，右侧露出其他颜色。

## 原因

白场（原片 26.16–26.88 秒淡入，`boot-motion.ts` 的 `white`）是 `#boot-background` 的子元素。`#boot-background` 已随舞台铺满实际视口，但 `responsive.css` 的开场规则又按「父元素是居中的 1920×1080 `.boot`」的假设，把白场平移 `(1920 − 舞台宽) / 2`、`(1080 − 舞台高) / 2`。两次偏移叠加后，白场只在恰好 16:9 时对齐：

| 视口 | 舞台（参考像素） | 露出区域（屏幕像素） |
| --- | --- | --- |
| 1920×960（1080p 显示器扣除浏览器工具栏） | 2160×1080 | 右侧 107 |
| 2560×1080（超宽屏） | 2560×1080 | 右侧 320 |
| 1440×900、1280×800（16:10） | 1728×1080 | 左侧 80、71 |
| 390×844（竖屏手机） | 1280×2770 | 左侧 98、底部 258 |
| 1920×1080、1366×768 | ≈1920×1080 | 无 |

浏览器窗口扣除标签栏和地址栏后通常宽于 16:9，所以常见情况是右侧露出一条。露出处显示的是白场下面的开场背景渐变和背景线条（暗色主题下是石墨背景）。

## 修改

删除该偏移规则，白场按原有 `inset: 0` 铺满 `#boot-background`；同时删除仅供该规则使用的 `--opening-width`、`--opening-height`。白场时间、颜色、透明度曲线以及开场其余图形的位置和比例均未改变。网页、扩展与壁纸共用此修正。

## 验证

- `scripts/check-opening-white.mjs`（新增）：按最终构建提供页面并禁用 WebGL，跳到白场峰值后停止帧循环，测量白场与视口的四边间隙。亮色、暗色各 8 种视口（1920×1080、1920×960、2560×1080、1440×900、1280×800、1366×768、390×844、844×390）共 16 组，间隙均为 0。同一脚本对修改前的构建报告 `light 1920x960: 0/0/106.7/0` 并失败。
- 对照截图：[修改前 1920×960](opening-white/before-1920x960.png)（右侧灰条）、[修改后 1920×960](opening-white/after-1920x960.png)、[修改前 390×844](opening-white/before-390x844.png)、[修改后 390×844](opening-white/after-390x844.png)。
- `npm run check:extension`（32 项）、`npm run check:extension:chrome`（4 项）、`npm run build`、`npm run build:wallpaper` 通过；`scripts/check-extension-experience.mjs` 5 组检查通过。
- 三维路径只在本环境的软件渲染下运行，未单独截图；白场位于三维画布之上，覆盖范围与 2D 路径相同。

## 复现

```sh
npm run build:extension
PLAYWRIGHT_MODULE=<playwright 路径> node scripts/check-opening-white.mjs   # 可设 BROWSER_PATH、WHITE_OUTPUT=<截图目录>
```
