# 第一章运行与验收
使用 Cocos Creator 3.8.8 打开工程，等待导入。打开 assets/scenes/Boot.scene，预览。构建 Web Mobile 时将 Boot、Main、Story 三个场景加入构建列表，Boot 为启动场景。画布 1080×1920，竖屏 SHOW_ALL。

代码与纯剧情检查：
1. npm ci（依赖锁文件已由 GitHub Actions 实际生成）。
2. npm run check:story：Schema、目标节点、片段引用、可达性。
3. npm run check:types：Cocos 官方 3.8.8 类型声明下所有脚本检查；npm test：独立 StoryRuntime、存档恢复、旧物重复效果、损坏/未来版本保护。
4. Cocos 导入生成 temp/tsconfig.cocos.json 后，npm run check:cocos。
5. 从 Boot 跑到 Main、Story 和第一章结束，刷新返回同节点与变量。
6. 查看照片、翻面、放回；查看信封、放回；收好纸箱；饭桌、深夜抽信；给 MP3 接电、点播放、转场、公交选择。
7. 在 choice / viewer / transition / 片段切换时刷新，不能重复获得效果，也不能跳过选择。
8. 双击选项、重复翻面、音频加载后退出、存储配额失败、断网继续主线，检查控制台。
9. Web Mobile 真浏览器和 TapTap H5 真机分别核验触摸、竖屏、音频首次手势、后台返回和续档。

当前限制：照片以原始 JSON 的文字描述占位，录音未配置正式音频资源时可读原有录音对白继续。不能把这些占位当成最终美术/配音。
场景序列化和所有 Cocos API 必须经真实 3.8.8 导入与浏览器执行确认；纯逻辑测试不能代替它们。
当前开发分支不包含 Chapter 02，第一章结束保留末尾存档，不加载不存在的 CH02。
