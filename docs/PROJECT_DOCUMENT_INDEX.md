# 当前工程文档索引

最新用户材料与实时决定一起读，外部审核的旧状态不覆盖实际回执和源码。正常开发先读CODEX_TASK、LIFE_NARRATIVE_RULES、FINAL_PROGRESS、README和DESIGN_DECISIONS，再读实际工作树。

| 文件 | 用途 | 当前范围 |
| --- | --- | --- |
| DESIGN_DECISIONS.md | 已定、待定、材料冲突及执行顺序 | V2优化的当前决定与事实 |
| PROPOSED_GAME_SPEC_V2.md | 用户提供的策划修订原文 | 保留来源，不自动覆盖GAME_SPEC历史 |
| EXTERNAL_REVIEW_V2.md | 用户提供的工程对照审核 | 以f976796为旧快照，截图缺口已补基线 |
| EXTERNAL_REVIEW_2026-10-09.md | 用户最新十章成品打磨审查与采用范围 | 明确取证限制、P0/P1与冻结结构，不沿用自动调度旧推断 |
| CHAPTER01_VISUAL_AUDIT.md / validation/V2_CH01_OBJECTS.json | 第一章物件切片与全游戏核对 | 分页、决定承接、图片/录音失败、门槛、当前构建及后续待验 |
| PHOTO_ALBUM_AUDIT.md / validation/V2_ALBUM.json | 相册与照片续读后的全游戏核对 | 60测试/508800路线、最终290步、18专项/23图及四原照片集中加载；原真实饭桌进度保持 |
| INTERACTION_VISUAL_AUDIT.md / validation/V2_INTERACTIONS.json | 共用互动与共享场景全游戏核对 | 57测试/508800路线、最终290步、18手机/42专项；真实手机/真人待验 |
| shots/v2-interactions/catalog/index.json / phone-memory/index.json | 当前日夜大字目录及手机/记忆专项 | 39状态78图、18次决定点按、42专项40图，包含实际加载/偏移/失败回退 |
| PROSE_EDIT_LOG.json / validation/V2_SCENE_MAP.json | 每条原句与原因、实际场景映射 | 一重复段/15地点标注；311正文手机决定，251映射/60纸面回退 |
| INTERACTION_AESTHETIC_REVIEW.md / INTERACTION_EVIDENCE_REVIEW.md | 两名独立评审的实际原图/截图/源码检查 | 已提出的按钮、数字键、墙钟、人像卡和混合空间问题关闭；非全量独立运行 |
| OPTIMIZATION_ROADMAP_SOURCE.md | 用户DOCX抽取的路线图原文 | Phase0/1及预算建议；平台条款须另核 |
| VISUAL_V2_SPEC.md | 三屏、决定变体、皮肤与模板规格 | 全游戏统一纸面，20种实际场景/手机变体；未知/混合地点回退 |
| READING_SETTINGS.md | 字号/纸面/音量/减少动态、存储边界与返回书桌 | 已接入实际Main/Story；手机安全区待验 |
| shots/v2-reading-settings/index.json / shots/v2-reading-navigation/index.json | 设置重排53图、通用入口12状态×5比例60图 | 实际桌面触摸与截图；不代替物理手机 |
| ART_SOURCE_POLICY.md / ../art/visual-v2/manifest.json | 用户最新Image来源要求与每件提示/散列 | 库30文件7342879字节；20种实际场景/手机，具体模型未回传 |
| ASSET_REGISTER.csv / baseline/SCENE_PROP_LIST.md | 真实素材和待产条目、地点与物件清单 | 36个实际资源文件、54地点标签，12共享空间初分；历史候选与当前使用单列 |
| baseline/STORY_EXPERIENCE.md / PROSE_REVIEW.md | 60片段估算和文本线索 | 不代替真人时长；不自动改正文 |
| shots/rc2-baseline/index.json | 12状态×5视口实际截图与节点/字体/热点 | 当前RC2功能视觉基线，不是手机验收 |
| shots/v2-life-slice/index.json / shots/v2-image-candidates-fixed/index.json | 新视觉切片60状态图与20设计预览图 | 明确区分正常玩法、候选与手机待验 |
| TAPTAP_SELF_TEST.md / PLATFORM_PHASE0.md | 实际上传、自测与官方适用性核对 | 原RC2已上传，真实手机待反馈 |
| PLATFORM_REVIEW_COPY.md / index.json | 所有实际原文、分支和来源散列 | 随实际源版本重导出，完整材料交平台 |
| GAME_SPEC.md / DIRECTION_SOURCE.txt / LIFE_NARRATIVE_RULES.md | 历史策划与已确认的生活叙事边界 | 时间、人物、长期事实和去AI感要求 |
| CHAPTER02_AUDIT.md～CHAPTER10_AUDIT.md / CHAPTER01_VISUAL_AUDIT.md / ENDING_RULES.md | 每章全局审查与六结局真实硬条件 | 不把待完成项改写为通过；第一章本批审查单独留档 |

运行包、源码ZIP和审核材料当前RC2与后续优化构建须分开记录。给GPT审核时提供公开仓库、具体提交及这些文档；不能把多个版本的文案和包混成一个最终成果。
