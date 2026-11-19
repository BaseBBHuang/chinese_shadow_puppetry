# v0.2.0 明亮版素材来源

视觉基准为用户确认的 `design/shadow-play/level-01-bright-v2/02-明亮纸影版-修订.png`。使用已安装的 gpt-image 技能 CLI 和 gpt-image-2 生成独立美术，凭据由本机技能配置读取，不进入此目录或交付包。

| 素材 | 原始来源 | 游戏产物 |
| --- | --- | --- |
| 小兔与灯具 | `sprites/gpt-image_20261119_114856_1.png`；提示词 `sprites-prompt.txt` | `app/art/rabbit.webp`、`lamp.webp` |
| 空舞台 | `stage/gpt-image_20261119_115521_1.png`；提示词 `stage-retry-prompt.txt` | `app/art/stage.webp` |
| 月亮与纸面纹理 | 已确认修订稿的局部裁切 | `app/art/moon.webp`、`wood.webp` |

`stage-reference.png` 与 `stage-prompt.txt` 保留最初的舞台构图参考及请求；初次请求超时，最终产物来自简化后的重试提示词。

素材处理脚本：`scripts/prepare_bright_art.py`。处理包括去除洋红背景、透明边缘整理、裁切、等比缩放和 WebP 压缩。角色尺寸与裁切参数记于 `asset-metrics.json`。运行素材脚本会重建当前 `app/art/`，原图、提示词及本说明不打入 ZIP。
