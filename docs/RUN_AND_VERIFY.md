# 当前十章候选的运行与验收

Cocos Creator 3.8.8 + TypeScript，1080×1920竖屏，Boot/Main/Story。十章60片段467节点、六结局与真实重读已实现。声音普通口语感仍重做；真人阅读、最终声音包和TapTap设备待验。进度以FINAL_PROGRESS为准。

## 开发检查

1. `npm ci --ignore-scripts`。
2. `npm run check:types`，官方3.8.8类型核对；本机导入编辑器后另跑`npm run check:cocos`。
3. `npm run check:story`：全部章节Schema、未登记文件、节点/跨章引用、旧别名、可达性、六个终局。
4. `npm test`：54项核心测试，508800初始路线及元进度/二周目专项。高分不能替代事实，缺失旧历史不能编造。
5. 每次章节完成对照GAME_SPEC、用户方向和LIFE_NARRATIVE_RULES审查整个游戏，修复冲突再继续，保留符合/待完成/冲突。

## 构建与预览

发布配置build-config/web-mobile.json关闭debug，settings/v2/packages/engine.json保留base、WebGL/WebGL2、2D、UI、Mask、Graphics、Audio、Tween、Profiler和custom-pipeline。未使用的3D物理/Spine/视频模块不打包。裁剪成功不等于浏览器运行成功。

命令行构建使用新输出名，避免误用历史文件；Windows后台编辑器隐藏窗口：

```powershell
$taskRoot=(Get-Location).Path
$taskBuild='configPath='+$taskRoot+'/build-config/web-mobile.json;outputName=life-candidate;logDest='+$taskRoot+'/work/cocos-life-candidate.log'
Start-Process -FilePath 'C:/ProgramData/cocos/editors/Creator/3.8.8/CocosCreator.exe' -ArgumentList @('--project', ('"'+$taskRoot+'"'), '--build', ('"'+$taskBuild+'"')) -WindowStyle Hidden
```

确认日志Finished、新index.html和真实浏览器共同通过，再运行：

```text
node tools/prepare-delivery.cjs build/life-candidate
node tools/serve-preview.cjs 5088 build/life-candidate --gzip
```

HTTP打开http://127.0.0.1:5088。去掉--gzip是独立未压缩诊断；部署端需实际提供正确Content-Encoding/Vary，不能假定TapTap自动开启压缩。不要双击file://。旧build/web-mobile清理被拒，保留历史目录，不能当新产物。

## 浏览器验收

开发机器可用已有Playwright，设置PLAYWRIGHT_MODULE为其模块路径、BROWSER_EXECUTABLE为Chrome路径；测试依赖不加入游戏。手机尺寸touchscreen点按/拖动，读取运行状态用于断言。发布包可运行；额外UI类型通过公开System模块读取，不依赖debug变量UITransform。

```text
node tools/browser-smoke.cjs URL work/browser-whole
node tools/browser-rounds.cjs URL work/browser-rounds
node tools/browser-performance.cjs URL work/browser-performance
```

整游戏参数：CH02_FAMILY_CHOICE=TELL/WAIT、CH03_PLAN_CHOICE=DISCUSS/ASSUME、CH04_SUMMER_CHOICE=ASK/PROMISE、CH05_JOB_CHOICE=SHARE/RETURN、CH07_CARE_CHOICE=TOGETHER/PAUSE、CH08_EVIDENCE=FULL/NONE/LETTER/RECORDING、CH09_CONTACT_CHOICE=SEND/NONE、CH09_DISCLOSE_CHOICE=TELL/WAIT、CH09_MEETING_CHOICE=MEET/DECLINE。默认组合在脚本声明。跨章失败是明示故障注入，检查原章游标保留、点重试后正确进入；长文中途刷新、集合与异常v2原文备份均断言。

browser-rounds从Boot开始同一存档连读六轮，每轮真实决定与来源阅读，第四轮隐藏；完成计数、刷新保留和本轮事实重置都断言，不注入结局。

```text
node tools/browser-audio.cjs URL 真正第八章NONE路线报告 输出目录
node tools/browser-save-recovery.cjs URL 真正六轮报告 输出目录
node tools/browser-ch05-legacy.cjs URL 输出目录
```

音频专项用尚未获得录音的真实H5状态作初始游标fixture，实际播放、暂停、恢复、自然结束，不设置播放位置；刷新和推进后才写来源。存储专项用真实完成轮次作初始fixture，只对新轮写入注入失败，检查旧存档原文和旧运行状态，再恢复写入并实际重读。旧历史专项设置LEGACY_START_CHAPTER=CH09，从缺失早年记录的旧CH09末尾恢复，走公共段落不补写。

390×844/540×960性能工具记录冷缓存、1.6Mbps、80ms、4倍CPU；帧样本解除限速后记录。说明桌面软件渲染限制，不冒充手机；gzip和原始传输单独测。技术播放和ASR不证明声音自然，自动点击不证明真人阅读时间。

## TapTap包结构与边界

TapTap上传ZIP根仅一个game/文件夹，game/index.html在第一层，H5资源保持相对结构，许可在game内。源码包独立，不含模型权重、凭据或制作运行时。先本地CRC/散列/入口核验和CLI只读预检，再请求明确上传/目标批准。

实时CLI帮助中屏幕方向1=portrait、0=landscape，不可照旧样例给竖屏传0。上传要求文件在命令当前目录内，以实际schema为准。上传、主包绑定、提审和发布单独批准/核验。

平台真机另查首次手势音频、切后台恢复、触摸和安全区、存储配额/加载失败、部署压缩和性能。普通Chrome与本机ZIP预检不替代TapTap容器/手机。
