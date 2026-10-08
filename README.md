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
本批接入第八章《记忆会骗人》六段：2037雨夜、自己的日期、完整信与录音文字、陈野的有限证词、多来源对照及当前家庭周末。当前8章48片段349节点，44项测试、101760条全游戏路线与两种类型检查通过；32种旧历史×四证据路径逐节点存取。完整来源需实际读到末尾，四个独立来源AND才重构，不编造车站目击。最终Cocos构建2026-10-08 12:07:57 Finished，四种阅读结果真实H5触摸233/228/230/230步、七处跨章失败重试、长文中途刷新恢复、完整集合及异常v2备份通过；缺失历史CH07末尾旧档21步通过。毕业照新旧两版已实际显示。审查见CHAPTER08_AUDIT.md。CH09～10、其余照片接入、正式声音、六结局、二周目、真人阅读校准、最终性能与TapTap真机待完成，本批仍是开发验证版。
已通过实际Web Mobile构建与手机尺寸浏览器触摸。原创毕业照已接入并在H5核验；家庭与旧街照片为已独立审评候选，尚未接入。正式声音和TapTap真机待完成。

参阅：
- [制作约束](CODEX_TASK.md)
- [开源候选、许可与取舍](docs/OPEN_SOURCE_REVIEW.md)
- [运行与验收](docs/RUN_AND_VERIFY.md)
- [当前验证记录](docs/VALIDATION.md)
- [第八章后的全游戏策划核对](docs/CHAPTER08_AUDIT.md)
- [第七章历史审查](docs/CHAPTER07_AUDIT.md)
- [第六章历史审查](docs/CHAPTER06_AUDIT.md)
- [第五章历史审查](docs/CHAPTER05_AUDIT.md)
- [第四章历史审查](docs/CHAPTER04_AUDIT.md)
- [第三章历史审查](docs/CHAPTER03_AUDIT.md)
- [第二章历史审查](docs/CHAPTER02_AUDIT.md)
- [最终版持续开发进度](docs/FINAL_PROGRESS.md)

本聊天在 main 开发，不新建分支。第一章已改为生活段落、家庭群记录、旧物调查和一个重大决定。详见 [新版内容规则](docs/LIFE_NARRATIVE_RULES.md)。
