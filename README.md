# 余生未寄 / The Letter Never Sent

TapTap H5 现实人生叙事模拟。连续生活叙事优先，重大决定才出现选项。

## 技术栈
- Cocos Creator 3.8.x
- TypeScript
- 竖屏 1080×1920
- TapTap H5 首发
- JSON 数据驱动剧情
- Local Save 为第一层存档
- Tap 平台能力通过 PlatformService 解耦

## 当前开发目标
在当前工程 main 继续至十章、六结局与可交付的 TapTap H5，每章完成后核对整个游戏。进度以 docs/FINAL_PROGRESS.md 为准。已实现第一章回归流程：
2037 家中 → 旧纸箱 → 旧物调查 → 照片/信件 → MP3 → 记忆转场 → 2007 公交 → 许知夏首次登场 → 自然相识。

## 核心限制
- 不增加联网主线依赖
- 不做 UGC
- 不做 AI 聊天
- 不做 IAP
- 广告默认关闭，仅预留自愿激励视频接口
- 剧情不得硬编码在 UI/平台脚本
- Tap API 与 Story 系统必须解耦

请先阅读 CODEX_TASK.md 和 docs/GAME_SPEC.md。

## 当前实现与开发进度
Boot → Main → Story 场景、连续阅读与代码式 UI 位于 assets/scenes 与 assets/scripts/ui。
当前登记六章、三十四个片段、254个节点。支持连续阅读、隐藏变量、条件、自动本地存档、旧物调查、照片翻面、信件查看、MP3文字降级与2037→2007短转场。第六章六段从2013毕业后报到写到十月车站分开和年末交班，三张便条可主动打开。家庭说明、选校沟通、暑期承诺与求职沟通在本章真实读取；本章不新增决定或数值效果，分开由多年事实与几次沟通形成。当前末尾是CH07开发边界。33项核心测试、10176条全游戏路线、16种核心历史逐节点存取通过；最终包抽验8种已知历史各175步实际H5，以及缺失历史旧档50步/25步，均未补写历史。全游戏核对见第六章审查。
已通过 Cocos 3.8.8 Web Mobile 实际构建与手机尺寸浏览器触摸检查。照片与声音尚未配置正式原创资源；TapTap 真机仍待验证。

参阅：
- [制作约束](CODEX_TASK.md)
- [开源候选、许可与取舍](docs/OPEN_SOURCE_REVIEW.md)
- [运行与验收](docs/RUN_AND_VERIFY.md)
- [当前验证记录](docs/VALIDATION.md)
- [第六章后的全游戏策划核对](docs/CHAPTER06_AUDIT.md)
- [第五章历史审查](docs/CHAPTER05_AUDIT.md)
- [第四章历史审查](docs/CHAPTER04_AUDIT.md)
- [第三章历史审查](docs/CHAPTER03_AUDIT.md)
- [第二章历史审查](docs/CHAPTER02_AUDIT.md)
- [最终版持续开发进度](docs/FINAL_PROGRESS.md)

本聊天在 main 开发，不新建分支。第一章已改为生活段落、家庭群记录、旧物调查和一个重大决定。详见 [新版内容规则](docs/LIFE_NARRATIVE_RULES.md)。
