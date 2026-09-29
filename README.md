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


## Chapter 01 implementation status
This work is on branch `codex/ch01-vertical-slice`. Runtime code includes the chapter manifest loader, local-save progression, dialogue/choice panels, special memory interaction panels, and the 2037-to-2007 transition data. Serialized `Boot`, `Main`, and `Story` scenes are in `assets/scenes/`; the UI creates fallback controls and panels at runtime. Original photo art and an MP3 file are not yet in the repository, so those story beats present their authored text and track identifiers. Run `npm test` for story, scene structure, UUID, and TypeScript checks. Creator Preview/H5 build verification is still outstanding. See `docs/CH01_SCENE_WIRING.md` for project setup and the remaining editor check.
