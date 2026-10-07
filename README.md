# 余生未寄 / The Letter Never Sent

TapTap H5 沉浸式互动叙事游戏。

## 技术栈
- Cocos Creator 3.8.x
- TypeScript
- 竖屏 1080×1920
- TapTap H5 首发
- JSON 数据驱动剧情
- Local Save 为第一层存档
- Tap 平台能力通过 PlatformService 解耦

## 当前开发目标
先完成 Chapter 01 Vertical Slice：
2037 家中 → 旧纸箱 → 旧物调查 → 照片/信件 → MP3 → 记忆转场 → 2007 公交 → 许知夏首次登场 → 第一个选择。

## 核心限制
- 不增加联网主线依赖
- 不做 UGC
- 不做 AI 聊天
- 不做 IAP
- 广告默认关闭，仅预留自愿激励视频接口
- 剧情不得硬编码在 UI/平台脚本
- Tap API 与 Story 系统必须解耦

请先阅读 CODEX_TASK.md 和 docs/GAME_SPEC.md。

## 第一章开发分支
Boot → Main → Story 场景和代码式占位 UI 位于 assets/scenes 与 assets/scripts/ui。
当前支持四段 JSON、片段切换、隐藏变量、条件、自动本地存档、旧物调查、照片翻面、信件查看、MP3 文字降级、2037→2007 短转场及第一章结束停留。
照片与声音尚未配置正式原创资源；代码存在不等于 Cocos 构建、浏览器和 TapTap 真机已经通过。

参阅：
- [制作约束](CODEX_TASK.md)
- [开源候选、许可与取舍](docs/OPEN_SOURCE_REVIEW.md)
- [运行与验收](docs/RUN_AND_VERIFY.md)
- [当前验证记录](docs/VALIDATION.md)
