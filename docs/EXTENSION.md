# 浏览器起始页 · 第一轮验收

当前 Fork：[Acew-zl/RhineLabUI](https://github.com/Acew-zl/RhineLabUI)。本地 `origin` 指向此仓库，`upstream` 保留原作者仓库。

本轮完成 Chromium Manifest V3 新标签页扩展及三维出场准备。原有开场、档案阵列、交互、画质与内容保留。书签映射和搜索框属于下一阶段，当前没有申请书签权限。

## 安装验收

1. 在项目目录执行 `npm ci`（首次安装），再执行 `npm run build:extension`。需要 Node.js 24。
2. Chrome 打开 `chrome://extensions`；Edge 打开 `edge://extensions`。
3. 开启「开发者模式」，点击「加载已解压的扩展程序」。
4. 选择项目中的 **`release/extension`** 文件夹，即包含 `manifest.json` 的那一层。
5. 新建标签页；若浏览器询问是否保留新的新标签页，选择保留。

本机验收路径：`D:\Project\RhineLabUI\release\extension`。安装后运行不需要 Node、终端或开发服务器。也可以把整个文件夹发给别人，以同样方式加载；面向普通用户的一键安装需后续上架扩展商店。

修改源码后重新执行 `npm run build:extension`，在扩展管理页点击此扩展的「重新加载」，再新开标签页。关闭或移除此扩展即可恢复浏览器原来的新标签页。当前替换的是新标签页；启动浏览器时是否打开新标签页由浏览器的「启动时」设置决定。

## 本轮重点观察

- 点击进入后完整观看开场，观察三维阵列刚出现时是否还有明显停顿。
- 提前点击 ENTER SYSTEM：准备未完成时显示等待，完成后进入档案阵列。
- 切列、滚轮选档、读取详情、返回、360° 查看器和重播是否保持原样。
- 设置里的减少动态效果、声音和画质仍可使用；扩展内偏好独立保存在本地。
- 断网后新开标签页，模型、文字和声音仍可加载。参考资料的外部链接仍需要网络。

## 实现边界

GLB、MiSans 字体、图标、音频与 TXT 资源全部随扩展打包。无远程脚本、无后台常驻进程、无站点访问权限；扩展构建不注册网页 PWA，也不复制其 Service Worker。独立授权的 Novecento 字体 kit 不进入扩展，使用原项目自带的固定文字图形。

字体准备好即可开始 2D 开场；模型加载及同一 WebGL 上下文的材质编译、纹理/几何上传、阴影与后期通道准备同时进行。预热不推进相机、弹簧、波浪或选档时间轴。极慢情况下停在三维出现前的覆盖帧，准备完成再继续；失败可重新连接。

首次着色器编译仍占用计算资源，预热是提前完成工作，不保证所有设备零掉帧。独立 360° 查看器仍按需创建自己的场景，本轮针对主阵列首次出场。

## 开发与检查

```sh
npm run dev:extension
npm run build:extension
npm run check:extension
npm run preview:extension
```

`dev:extension` 是带热更新的开发预览；`preview:extension` 在 `http://127.0.0.1:5190` 提供实际产物，并使用相同 CSP，便于定位打包问题。HTTP 预览不等于真实扩展安装测试。普通网页继续使用 `npm run dev` / `npm run build`。

验证记录见 [EXTENSION-PREPARATION.md](../verification/EXTENSION-PREPARATION.md)。
