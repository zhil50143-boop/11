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
本批接入第七章《后来的人》八段：2014～2016自己的工作与租房、2017认识程安然、2018来往、2019长期分工、2020结婚、2021周满出生、2024夜间照顾和2030～2037女儿长大后回到雨夜。当前7章42片段308节点，36项测试、20352条全游戏路线、两种类型检查通过；32种核心历史逐节点存取。CH02/03/04/05和CH06_PARTED_2013实际读取，新分工决定有即时与2021/2024承接；未知历史不补写。最终Cocos构建2026-10-08 11:06:25 Finished，4组已知历史抽验各207步540×960真实触摸、六处跨章失败重试、完整集合与异常v2备份通过；旧CH06末尾缺失历史27步通过。审查见CHAPTER07_AUDIT.md。CH08～10、正式素材、完整重构、六结局、二周目、真人阅读校准、最终性能及TapTap真机仍待完成，本批包是开发验证版。
已通过实际Web Mobile构建与手机尺寸浏览器触摸。原创毕业照片保存在art/original，尚未接入游戏；正式声音和TapTap真机待完成。

参阅：
- [制作约束](CODEX_TASK.md)
- [开源候选、许可与取舍](docs/OPEN_SOURCE_REVIEW.md)
- [运行与验收](docs/RUN_AND_VERIFY.md)
- [当前验证记录](docs/VALIDATION.md)
- [第七章后的全游戏策划核对](docs/CHAPTER07_AUDIT.md)
- [第六章历史审查](docs/CHAPTER06_AUDIT.md)
- [第五章历史审查](docs/CHAPTER05_AUDIT.md)
- [第四章历史审查](docs/CHAPTER04_AUDIT.md)
- [第三章历史审查](docs/CHAPTER03_AUDIT.md)
- [第二章历史审查](docs/CHAPTER02_AUDIT.md)
- [最终版持续开发进度](docs/FINAL_PROGRESS.md)

本聊天在 main 开发，不新建分支。第一章已改为生活段落、家庭群记录、旧物调查和一个重大决定。详见 [新版内容规则](docs/LIFE_NARRATIVE_RULES.md)。
