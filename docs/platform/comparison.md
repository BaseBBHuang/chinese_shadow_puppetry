# 在线规范与 2026-10-30 本地基线对比

核验时间：2026-11-19。在线来源：https://miniapp-sandbox.xiaohongshu.com/minitool/doc 。完整 HTML / 文本已保存在同目录。

新增公开接口与支持场景：getWindowInfo（9.49+）、getLocation（9.49+）、vibrateShort / vibrateLong（9.50+）、陀螺仪 start / stop / on / off（9.50+）、followAuthor / getFollowStatus（9.51+）、share（9.53+，全屏）、AI.createModel().generateText()（内测加白）、rewardAuthor / setCloseRetentionEnabled（9.53.3+，内测）。这些接口均有在线公开使用说明，不把方法存在等同于客户端支持。

运行能力新增：9.53+ 支持有配额和后台回收约束的包内 classic Dedicated Worker；9.53.3+ 提供 assets/ 静态资源优化，由容器透明取回，不代表网页可联网或资源必定离线可用。

已有能力更新或明确：保存相册最低 9.42+；评论 miniToolSnapshotInfo 最大 2KB；受支持版本上本地存储必须优先平台接口。

本关实际使用：有版本门槛的 getWindowInfo 和可选 vibrateShort。未使用其余新增能力。所有核心资源位于 art/，入口脚本 / 样式位于根目录，随主包加载。普通浏览器下按无 SDK 路径运行。玩法无需持久化或账号。
