# 余生未寄 / The Letter Never Sent

TapTap H5 现实人生叙事模拟。连续生活叙事优先，少量重要决定有长期承接。

## 当前状态

第十章《余生未寄》六段已实现，当前10章60片段467节点，六个结局和真实重读已接入。54项核心测试、508800条初始路线通过；同一H5存档从Boot连续六轮实际触摸290/287/279/290/274/274步，第四轮隐藏结局，下一轮保留六结局且重置当轮事实。17:31位置修正版重新整游戏290步、缺失历史20步、新轮存储失败恢复通过，九处跨章失败重试、集合与原文备份继续保留。发布构建裁剪未使用模块、改善窄屏正文与按钮，弱网首屏由调试约53秒降至发布无压缩约15秒/gzip约7秒。用户再次否定第二版声音的AI/动漫感，第三版两名普通声线及63.53秒完整对白已重新生成接入，实际H5播放/暂停/恢复/自然结束/刷新与来源门控通过；第三版音色已由用户确认；全篇真人阅读、TapTap真机与最终验收尚待完成，不能称最终版本。详见docs/CHAPTER10_AUDIT.md。

源码和开发始终留在当前工程main。十章与六结局可运行，正按用户提供的V2方案优化界面、美术与生活阅读体验。

2026-10-09继续按[最新外部审查](docs/EXTERNAL_REVIEW_2026-10-09.md)打磨：第一章五件旧物已采用Image物件与分页，决定沿用家庭场景，照片正反面、信封/纸页与真实MP3播放器统一纸面。三种决定后果、失败文字回退和完整来源门槛已复验；其他共享场景、手机、记忆对照及真实手机仍待完成。[本批全游戏核对](docs/CHAPTER01_VISUAL_AUDIT.md)。版本仍为1.0.0-rc.3开发切片。

最新视觉切片1.0.0-rc.3：用户已确认“场景窗＋纸面”布局；七件新美术由当前内置Image生成，原图/提示/编辑链见[素材记录](art/visual-v2/README.md)。首页已采用书桌和信封续读，第一章2037家中及2007公交正文采用场景窗与独立纸面。其余章节与互动模板尚待统一，不能称最终版本。[当前制作决定](docs/DESIGN_DECISIONS.md)、[美术来源约束](docs/ART_SOURCE_POLICY.md)、[文档索引](docs/PROJECT_DOCUMENT_INDEX.md)共同约束后续开发。

阅读页现有“返回书桌”，保存成功后退出，再继续回到同一段落；保存失败留在原页重试。首页和阅读页已接入三档字号、夜间纸面、录音音量与减少动态，偏好独立保存。完整信/录音文字按原换行分段显示，修复大字号字形拉伸；证据门控和已确认音色保持。[设置与返回说明](docs/READING_SETTINGS.md)。

RC2自测包已按用户授权上传现有TapTap游戏，二维码已交付；未绑定主包、提审或发布。手机实测和全篇生活节奏审读待完成，详见[TapTap自测交接](docs/TAPTAP_SELF_TEST.md)。全部实际文字和所有分支见[平台审核文案全集](docs/PLATFORM_REVIEW_COPY.md)。

## 技术与边界

- Cocos Creator 3.8.8、TypeScript、JSON剧情，竖屏1080×1920。
- Boot → Main → Story；本地自动存档、旧档迁移、阅读位置与元进度。
- 照片翻面、信纸滚动、短信、旧物调查、MP3播放和多来源记忆重构。
- 隐藏数值只服务事实与结局，没有关系分数、收集百分比、签到或复杂成长模型。
- 主线离线可运行；平台接口隔离，广告关闭。没有UGC、AI聊天、动态剧情或IAP。
- 四张原创照片已实显。声音只采用本项目虚构合成参考，模型权重和制作运行时不随游戏发布。

## 开发与试玩

先读CODEX_TASK、GAME_SPEC和LIFE_NARRATIVE_RULES。安装依赖后运行 npm run check:types、npm run check:story、npm test；本机编辑器已导入时另跑 npm run check:cocos。

已运行npm test生成领域运行时后，可用tools/story-stats.cjs、prose-lint.cjs、asset-register.cjs重导出阅读估算、人工审读线索和素材清单。机器统计不代替真人阅读，不自动加长或改写原文。

发布配置位于build-config/web-mobile.json，关闭debug并裁剪到所需2D模块。构建后用 tools/prepare-delivery.cjs 添加运行时许可，再用 tools/serve-preview.cjs 通过HTTP试玩；gzip模式与未压缩模式分别验收。详细可复现步骤见运行文档。不能双击file://代替H5运行，也不能使用历史build/web-mobile当最新包。

## 项目资料

- [当前进度与最终门槛](docs/FINAL_PROGRESS.md)
- [生活内容与声音约束](docs/LIFE_NARRATIVE_RULES.md)
- [完整策划摘要](docs/GAME_SPEC.md)
- [第十章后的全游戏审查](docs/CHAPTER10_AUDIT.md)
- [六结局与重读规则](docs/ENDING_RULES.md)
- [运行与验收](docs/RUN_AND_VERIFY.md)
- [验证记录](docs/VALIDATION.md)
- [开源候选和许可证](docs/OPEN_SOURCE_REVIEW.md)
- [照片审查](docs/ART_REVIEW.md)、[家庭与旧街照片审查](docs/ART_REVIEW_FAMILY_STREET.md)

第二至九章的CHAPTER*_AUDIT保存当时范围。当前状态以FINAL_PROGRESS和实际源码/产物为准。

音色确认记录：2026-10-08用户试听新声线后回复“比上一版自然”，随后明确“就这个音色了”。第三版两名角色音色已确认固定；普通说话的语气、接话及全篇真人阅读继续校准，技术检测不冒充听感。

当前1.0.0-rc.2追加：普通加载异常使用中文重试提示，保留具体存档/版本警告；新包十章290步、九处跨章故障恢复及新轮存储失败保留/恢复再次通过，0脚本错误/失败资源请求。玩法与已确认第三版声音没有再改。源码基线3c2aeab35fd9437f6c40edc5d2a66bb8bae218c4已同步main，GitHub CI37763185162成功。完整文案汇总PLATFORM_REVIEW_COPY.md及index.json已从全部实际资源与源码生成，覆盖10章60片段467节点、3300条JSON中文、72条源码文字及完整口述台词。最终交付时给对应最终仓库提交，并重新导出全部文字；当前仍待真人阅读和TapTap真机。

审核材料：[完整游戏文案](docs/PLATFORM_REVIEW_COPY.md)、[逐条来源索引](docs/PLATFORM_REVIEW_COPY.index.json)、[GPT与平台交接说明](docs/REVIEW_HANDOFF.md)。
