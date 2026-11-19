# 掌中影戏 · 小兔摘月

第一关可玩原型 v0.2.0（明亮纸影版），小红书小工具离线 H5。美术基于用户确认的明亮修订稿：奶油纸面、浅枫木、珊瑚红幕布和柔和纸影角色；只有本地经典 JavaScript、CSS、SVG 和 WebP，无运行时第三方依赖。

![第一关实际运行：初始与通关](docs/qa/bright-v2/playable-preview.jpg)

[下载 v0.2.0 离线包](dist/zhangzhongyingxi-level01-v0.2.0.zip) · [查看验收记录](docs/qa/bright-v2/verification.md)

## 体验

向右拖灯体或圆形灯座，让幕上的兔影变大。手部碰到月亮并保持 300ms 后通关，约 2.6 秒柔光演出后可重玩或赏月。鼠标、触摸均可；键盘方向键可细调，Home / End 到达轨道两端。提示不会自动解题。实体木偶与投影使用同一美术素材，投影按灯距计算。

本版只包含已确认的第一关。设计稿的“下一幕”替换为有效的“赏月”入口；没有占位关卡或不可用按钮。暂不包含音效、分享、存档或第二关。

## 目录

- `app/`：实际交付源码，根入口 `index.html`，可直接被模拟器加载。
- `app/logic.js`：投影几何、持续接触、通关状态机。
- `app/app.js`：触摸 / 键盘、提示、生命周期、平台窗口信息与可选振动。
- `app/art/`：压缩后的独立美术素材。
- `tests/logic.test.cjs`：核心机制的 7 项测试。
- `scripts/package.py`：资源及包结构检查、ZIP 打包。
- `scripts/prepare_bright_art.py`：当前明亮版素材整理过程，需要 Pillow；日常修改与打包不需要运行。
- `scripts/prepare_art.py`：旧版素材重建，仅输出至历史素材目录。
- `dist/zhangzhongyingxi-level01-v0.2.0.zip`：小工具离线包。
- `docs/qa/bright-v2/verification.md`：当前版本验收记录和限制；旧版记录另行保留。
- `design/`：已确认视觉设计、生成提示词及交互规格。

## 检查与打包

```sh
node --test tests/logic.test.cjs
node --check app/app.js
node --check app/logic.js
python3 scripts/package.py
```

ZIP 根目录直接包含 `index.html`，只打包 `app/` 内的文件。密钥、生成工具、原始设计、文档、测试均不进入 ZIP。

## 本地模拟器

使用 Node.js 20+ 和已核验版本的 redapp CLI：

```sh
redapp dev --dir ./app --no-open --agent
```

本次环境安装的是 CLI 1.0.5、模拟器 SDK 0.2.0，prod 环境。当前电脑临时 CLI 位于 `/tmp/shadow-redapp/bin/redapp`，可用以下命令重新启动；/tmp 清理后需要重新安装 CLI。

```sh
SKILLHUB_UPLOAD_HOME=/tmp/shadow-redapp-state /tmp/shadow-redapp/bin/redapp dev --dir ./app --no-open --agent
```

本地调试不需要发布登录。浏览器直接打开 HTML 只能用于辅助检查，不能代替平台容器验收。

## 平台交付

当前公开规范已于 2026-11-19 核验，快照在 `docs/platform/`。核心资源放在 `art/` 内随主包下发，不依赖静态资源外移。支持 `getWindowInfo` 的客户端优先避让安全区与原生按钮；不支持时用容器 CSS 安全区变量。支持版本及方法同时满足时调用短振动；失败不影响通关。

上传前需将这个 ZIP 在创服平台模拟器完整验收，再用 Android 和 iOS 真机分别扫码验证。当前未上传、未送审；未完成真机性能及 Chrome 61 实机兼容性验收。
