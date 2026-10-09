# 余生未寄 / The Letter Never Sent

TapTap H5现实人生叙事模拟。连续生活叙事优先，少量重要决定有长期承接。

## 当前状态

原工程main，版本1.0.0-rc.3体验打磨中。十章60片段467节点、六结局与二周目已接入；仍待真人全文/长时阅读与TapTap物理手机验收，不能称最终1.0。

保留用户确认的“场景窗＋纸面”。全游戏阅读、决定与回退统一纸面；调查、照片翻面、信封/长信、两代手机、记忆对照及独立MP3在实际流程中使用原事实/存档逻辑。20种场景/手机变体按真实年份和地点共享，未知或混合空间回到纸面，不补写同居、时段或证据。所有新美术通过当前内置Image生成，原图、完整提示、编辑链和散列见[素材记录](art/visual-v2/README.md)。工具未回传具体模型型号。已确认第三版音色保持。

最新存档可靠性批次：复现并修复写入失败后内存剧情仍推进的问题，保存成功才提交决定、证据、游标和结局，失败留原页并可重试。71核心测试、508800加权领域逻辑路线、两种类型/全图通过；最新同一构建实际十章290步、14项写入故障及连续六轮1694步/48次相册回看通过，第四轮隐藏、下一轮7。[整改与全游戏核对](docs/SAVE_RELIABILITY_AUDIT.md)、[实际证据](docs/validation/V2_SAVE_RELIABILITY.json)。逻辑路线计数不是同数量浏览器通关；长会话资源观察也不等于手机内存验收。

既往共享场景39状态/78张日夜大字图、18次决定点按、18手机与42专项仍独立保留，[前批核对](docs/INTERACTION_VISUAL_AUDIT.md)和[原始记录](docs/validation/V2_INTERACTIONS.json)不冒充本轮重跑。

阅读页有“返回书桌”，保存成功才退出，继续回到原段落；保存失败留原页重试。三档字号、夜间纸面、录音音量与减少动态独立保存。[设置说明](docs/READING_SETTINGS.md)。相册只读回看与照片描述跨刷新现已补齐；只显示本轮已完成照片，回看不改事实。相册后60测试、整十章290步、18专项/23图及四原照片实际加载集中确认通过。[最新全游戏核对](docs/PHOTO_ALBUM_AUDIT.md)。余下精确场景、跨龄真人辨认及全篇生活节奏仍待完成。

RC2自测包已按授权上传已有TapTap游戏，版本275902/包体74035；新视觉包未上传、绑定、提审或公开发布。[平台状态](docs/TAPTAP_SELF_TEST.md)。给GPT/平台的[全文合集](docs/PLATFORM_REVIEW_COPY.md)覆盖全部分支，实际源码基线和交付包见[审核交接](docs/REVIEW_HANDOFF.md)。当前automation-2不存在，未新建替代调度。

## 技术与运行

- Cocos Creator3.8.8、TypeScript、JSON剧情，竖屏1080×1920；Boot → Main → Story。
- 本地自动存档、旧档备份迁移、阅读位置、结局元进度；不编造丢失历史。
- 照片、信件、短信、旧物、MP3及多来源记忆重构；没有关系分数条或收集百分比。
- 主线离线可运行，平台接口隔离，广告关闭；没有UGC、AI聊天、动态剧情、IAP、签到或复杂成长模型。

先读CODEX_TASK、GAME_SPEC和LIFE_NARRATIVE_RULES。安装依赖后运行npm run check:types、npm run check:story、npm test；已导入编辑器时另跑npm run check:cocos。统计、文案线索与素材清单可以重导出，但不代替真人审读。

发布配置build-config/web-mobile.json关闭debug并裁剪2D模块；最新输出build/visual-v2-save-safe-locked，2026-10-09 16:29:16 Finished，游戏源码843ab85。相册及共享场景前批输出独立保留。构建后使用tools/prepare-delivery.cjs和tools/serve-preview.cjs通过HTTP试玩；tools/package-review-h5.py核对游戏源、30件图、四原照片及固定声音并保留旧包。旧build/web-mobile与历史包不能当成最新包，也不能双击file://代替运行。

## 项目资料

- [当前进度与最终门槛](docs/FINAL_PROGRESS.md)、[生活与声音约束](docs/LIFE_NARRATIVE_RULES.md)
- [策划](docs/GAME_SPEC.md)、[最新外部审查采用范围](docs/EXTERNAL_REVIEW_2026-10-09.md)
- [当前制作决定](docs/DESIGN_DECISIONS.md)、[美术来源](docs/ART_SOURCE_POLICY.md)、[文档索引](docs/PROJECT_DOCUMENT_INDEX.md)
- [六结局与重读](docs/ENDING_RULES.md)、[运行验收](docs/RUN_AND_VERIFY.md)、[开源许可证](docs/OPEN_SOURCE_REVIEW.md)
- [第一章物件核对](docs/CHAPTER01_VISUAL_AUDIT.md)、[第十章全局核对](docs/CHAPTER10_AUDIT.md)
- [审美评审](docs/INTERACTION_AESTHETIC_REVIEW.md)、[细节与事实评审](docs/INTERACTION_EVIDENCE_REVIEW.md)
- [全部审核文案](docs/PLATFORM_REVIEW_COPY.md)、[逐条来源索引](docs/PLATFORM_REVIEW_COPY.index.json)、[对应交付记录](docs/validation/V2_INTERACTIONS_DELIVERY.json)

各章审查保存当时范围；当前状态以FINAL_PROGRESS和实际源码/产物为准。
