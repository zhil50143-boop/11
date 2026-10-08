# 第九章当前验证基线（2026-10-08）

第九章《如果现在去见她》六段已接入，当前9章54片段418节点；49项测试、508800条全游戏路线和两种类型检查通过。实际发送/说明/见面后才记录事实，五条联系路径均可达；知夏有原定返乡、工作与家庭，未联系路径有完整当前生活。家庭2035和旧街2010照片已在Cocos实显。用户否定的第一版配音不采用，正在重新制作自然熟人对白声线。全篇修30处说理式旁白并补齐录音开头和车声语境。最终当前构建2026-10-08 16:00:27 Finished，build/chapter09-final；一条整游戏270步、四条真实第八章存档续玩34/37/34/26步、缺失旧历史26步、八处跨章失败重试、集合恢复和异常v2备份通过，0脚本错误/资源失败。逐项审查见CHAPTER09_AUDIT.md。CH10、六结局、二周目、声音接入、真人阅读与最终性能/TapTap真机待完成，本批仍是开发验证版。

预览新包：`node tools/serve-preview.cjs 57302 build/chapter09-final`。默认web-mobile旧输出未清理，不能将其当本批产物。声音主观听感没有合格记录，不将ASR或文件检测写成真人听音通过。以下保留历史记录，历史数字不替代当前基线。

---

# 当前第八章验证基线

本批接入第八章《记忆会骗人》六段：2037雨夜、自己的日期、完整信与录音文字、陈野的有限证词、多来源对照及当前家庭周末。当前8章48片段349节点，44项测试、101760条全游戏路线与两种类型检查通过；32种旧历史×四证据路径逐节点存取。完整来源需实际读到末尾，四个独立来源AND才重构，不编造车站目击。最终Cocos构建2026-10-08 12:07:57 Finished，四种阅读结果真实H5触摸233/228/230/230步、七处跨章失败重试、长文中途刷新恢复、完整集合及异常v2备份通过；缺失历史CH07末尾旧档21步通过。毕业照新旧两版已实际显示。审查见CHAPTER08_AUDIT.md。CH09～10、其余照片接入、正式声音、六结局、二周目、真人阅读校准、最终性能与TapTap真机待完成，本批仍是开发验证版。

实际步骤、失败与修复见CHAPTER08_AUDIT.md；当前验证照片已经加载，声音缺失时有完整文字兜底，不能称播放通过。

# 当前已实现章节运行与验收

使用 Cocos Creator 3.8.8 打开工程。Boot、Main、Story 位于 assets/scenes，Boot 为入口。竖屏 1080×1920、SHOW_ALL。

## 开发检查
1. `npm ci --ignore-scripts`。
2. `npm run check:story`：全部已登记章节的 Schema、未登记文件、节点引用、旧节点别名、片段及跨章全局可达性。
3. `npm run check:types`：官方 Cocos 3.8.8 全脚本检查。
4. `npm test`：33 项测试；10176 条路线从第一章走完第六章，家庭说明、选校沟通、暑期承诺与求职十六种核心组合均有真实后续回应；第六章没有新增Choice或数值效果。v1、异常 v2 备份、旧 EP02 边界与阅读/证据恢复均检查。
5. Cocos 编辑器预览 Boot；构建时使用 build-config/web-mobile.json，三场景均需包含。

Windows 命令行构建示例（替换编辑器和工程绝对路径）：
```powershell
& 'C:/ProgramData/cocos/editors/Creator/3.8.8/CocosCreator.exe' --project '你的工程路径' --build 'configPath=你的工程路径/build-config/web-mobile.json'
```

生成 build/web-mobile/index.html 后，运行 `npm run preview`，打开 http://127.0.0.1:5088。端口占用时用 `npm run preview -- 5089`。不要双击 file:// 页面。开发包关闭性能面板，普通剧情不显示隐藏属性。

## 浏览器复验
可使用已有 Playwright 测试环境；它只用于开发检查，不加入游戏运行时。没有环境时可另行安装：
```powershell
npm install --no-save --package-lock=false playwright
npx playwright install chromium
npm run check:browser -- http://127.0.0.1:你的端口
```
如使用已有工具安装目录，可设置 PLAYWRIGHT_MODULE；如使用本机 Chrome，可设置 BROWSER_EXECUTABLE。第三个脚本参数可指定报告目录，默认 work/browser-report。浏览器工具固定 540×960 手机尺寸，使用触摸拖动与点按，断言实际存档和显示节点；它要求开发构建中 Cocos 的 cc 调试接口。

默认CH02为WAIT、CH03为ASSUME、CH04为PROMISE、CH05为RETURN、CH07为PAUSE。分别设置 CH02_FAMILY_CHOICE（TELL / WAIT）、CH03_PLAN_CHOICE（DISCUSS / ASSUME）、CH04_SUMMER_CHOICE（ASK / PROMISE）、CH05_JOB_CHOICE（SHARE / RETURN）、CH07_CARE_CHOICE（TOGETHER / PAUSE）复验三十二种组合，使用独立上下文和报告目录。工具等待实际菜单和按钮就绪；检查 CH01→02、CH02→03、CH03→04、CH04→05、CH05→06、CH06→07六处失败重试，并在报告记录 retriedChapters。新三张第六章便条正文与JSON一致，车站谈话、便条与返程后刷新也纳入复验。工具还检查全部读过节点、字符串证据、刷新前后相等，并在独立测试上下文中注入旧 H5 的异常 v2 集合存档，验证先备份原文、保留当前位置和 flags、不编造丢失证据。

人工检查连续段落上滑阅读、刷新续读；五件旧物、照片翻面、查看信封、收好纸箱；向程安然说明许知夏的决定；饭桌、家庭群、深夜抽信；MP3 文字降级、短转场与自然公交对话。重要决定必须在后文得到回应，普通应答不弹选项。

TapTap H5 真机另验：触摸、竖屏、真实录音首次手势播放、切后台恢复、存储配额失败与资源加载失败。本机浏览器结果不能代替平台验收。

## 当前范围
七章当前内容可从入口走到CH07_EP08_END。第七章单路线8087～8138字符，时长与阅读体验待真人校准。第八章尚未加入；毕业照片候选未接入，纸张和录音尚无正式资源。旧v1先备份再经nodeAliases接回新版，旧异常v2集合先备份原文再保留可识别字符串。未来版本或无法备份的旧档不自动覆盖，已经丢失的空对象历史不编造。

章节资源路径由 assets/resources/data/story/catalog.json 登记。新增章节须同时登记 catalog 和章节 manifest；每个片段必须从章入口可达。pendingChapter 只是当前尚未开发的末尾边界，不能用于吞掉已登记资源的加载错误。每完成一章按 CHAPTER07_AUDIT.md 的形式核对整个项目与策划书，并更新 FINAL_PROGRESS.md。

缺失早年决定记录的旧档回归：完成npm test和实际构建后，运行node tools/browser-ch05-legacy.cjs http://127.0.0.1:你的端口 [报告目录]，使用相同PLAYWRIGHT_MODULE与BROWSER_EXECUTABLE。该工具默认从旧CH04末尾恢复，接入所有后续已实现章节；设置LEGACY_START_CHAPTER=CH05或CH06可分别从对应边界恢复。本批实际复验CH06缺失历史27步，未知早年flags与未经历的CH06_PARTED_2013不补写；照片翻面和短转场也实际操作。断言未知历史不进入特定回应、不补写旧flags，纸条实际内容与JSON一致、刷新后完整集合相等。
