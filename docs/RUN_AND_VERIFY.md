# 当前已实现章节运行与验收

使用 Cocos Creator 3.8.8 打开工程。Boot、Main、Story 位于 assets/scenes，Boot 为入口。竖屏 1080×1920、SHOW_ALL。

## 开发检查
1. `npm ci --ignore-scripts`。
2. `npm run check:story`：全部已登记章节的 Schema、未登记文件、节点引用、旧节点别名、片段及跨章全局可达性。
3. `npm run check:types`：官方 Cocos 3.8.8 全脚本检查。
4. `npm test`：22 项测试；2544 条路线从第一章走完第三章，家庭说明与选校沟通四种组合均有真实后续回应。v1、异常 v2 备份、旧 EP02 边界与阅读/证据恢复均检查。
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

默认第二章走暂不说明的 WAIT，第三章走先安排的 ASSUME。设置 `$env:CH02_FAMILY_CHOICE='TELL'` / `'WAIT'` 与 `$env:CH03_PLAN_CHOICE='DISCUSS'` / `'ASSUME'`，分别复验四种组合；使用独立浏览器上下文和报告目录。工具等待菜单与 Story 实际就绪，避免固定启动秒数造成误判。新增检查第二章进入第三章的失败重试、毕业照片、信封和录取后分支。工具还检查全部读过节点、字符串证据、刷新前后相等，并在独立测试上下文中注入旧 H5 的异常 v2 集合存档，验证先备份原文、保留当前位置和 flags、不编造丢失证据。

人工检查连续段落上滑阅读、刷新续读；五件旧物、照片翻面、查看信封、收好纸箱；向程安然说明许知夏的决定；饭桌、家庭群、深夜抽信；MP3 文字降级、短转场与自然公交对话。重要决定必须在后文得到回应，普通应答不弹选项。

TapTap H5 真机另验：触摸、竖屏、真实录音首次手势播放、切后台恢复、存储配额失败与资源加载失败。本机浏览器结果不能代替平台验收。

## 当前范围
三章当前已登记内容可以从入口走到第三章六段末尾。第三章单路线约 8079～8183 字符，三章时长仍待真人校准。照片与声音尚无正式原创资源；第四章尚未加入。旧 v1 存档先备份，再经 nodeAliases 接回新版段落；旧异常 v2 集合备份原文后仅保留可识别字符串。未来版本存档或无法备份的旧档不会被自动覆盖。空对象中已经丢失的历史无法自动还原。

章节资源路径由 assets/resources/data/story/catalog.json 登记。新增章节须同时登记 catalog 和章节 manifest；每个片段必须从章入口可达。pendingChapter 只是当前尚未开发的末尾边界，不能用于吞掉已登记资源的加载错误。每完成一章按 CHAPTER03_AUDIT.md 的形式核对整个项目与策划书，并更新 FINAL_PROGRESS.md。
