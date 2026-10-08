我已经以 GitHub 当前 `main` 分支为依据，把《余生未寄》与我们确认的项目策划书进行了对照审核。

这次审核的结论比较明确：

《余生未寄》的剧情架构和技术开发已经接近完整，但视觉呈现、场景表现和操作方式明显落后于策划书。现在更像一款可以正常阅读的文字游戏，还没有充分呈现出我们讨论的“现实人生叙事模拟”的质感。

我建议不推翻现有工程、不重新写十章剧情，先集中做一轮视觉和交互品质升级。

## 一、审核基准

当前 GitHub main 最新提交

f976796

现有版本

1.0.0-rc.2

策划定义

现实人生叙事模拟

我对照的核心材料是仓库内的&#x20;

github.com

、

github.com

、

github.com

，以及实际 UI 脚本、场景文件、美术提示词和最新验收记录。



需要说明的是：本次核实了界面实现代码及美术来源记录，但没有取得完整的当前游戏实机截图，也未完成对四张 PNG 的直接视觉逐像素审查。因此下面对界面结构的判断是有代码依据的，对图片审美和跨年龄人物一致性的部分则标明为待最终人工视觉确认。

## 二、策划书与当前游戏的核心差距

| 审核维度          | 当前情况               | 判断     |
| ------------- | ------------------ | ------ |
| 十章完整叙事        | 已有10章60片段467节点     | 符合结构要求 |
| 六个结局与二周目      | 已实现，并有自动化测试记录      | 符合功能要求 |
| 连续生活流叙事       | 已改为长段落阅读、减少普通选择    | 方向符合   |
| 人生书桌主界面       | 目前仍以文字标题和按钮为主      | 明显不符合  |
| 2037/2007视觉区别 | 没有完整的双年代场景表现       | 明显不足   |
| 人物立绘与场景演出     | 主要依靠文字，没有完整角色表现层   | 缺失较大   |
| 原创照片          | 已引用4张，更多场景和角色素材不足  | 部分符合   |
| 照片、信件、MP3     | 功能具备，但主要仍是按钮和文本界面  | 表现不足   |
| 模拟手机          | 有手机内容，尚缺独立拟真手机操作界面 | 部分符合   |
| 记忆重构          | 事实、证据、状态逻辑有实现      | 演出不足   |
| H5运行与存档       | 仓库有较完整的自动化与浏览器验证记录 | 工程基础较好 |
| TapTap真机发布验收  | 仓库明确记录尚未完成         | 待完成    |

这里最值得肯定的，是已有 StoryManager、存档迁移、剧情校验、跨章恢复和多结局逻辑。这些都不是必须重做的东西。

真正需要改的是玩家看见什么、怎样接触人物、怎样在场景里经历故事。

## 三、界面审核：这是第一优先级

### 1. 首页没有实现原先讨论的“人生书桌”

现有&#x20;

github.com

&#x20;基本构成是标题、继续按钮、从头开始按钮和确认提示。



它能完成功能，但这并不是我们希望的正式主页。

我们原先希望的是：

[The Letter That Arrived After Midnight | Fiction](https://images.openai.com/static-rsc-4/DSdDzCj0cE2TU7KM2PQkNwX9_WNLxQv7iYjFr2xDz7ivU4o5y7SN4pCrkFgp-nUWGtpBl5AnPkjx0Nx03xwizXCYDTVJEW_yyXLZnCgAh8krtOHZVqeCNcZEyiIFaqZ8J3oiDkDNWUB53lX8Qh0125O5_5C1gt3tTtRCa9EaZak?purpose=inline)

目标方向：人生书桌

物件本身承担导航，形成真实的生活空间

[Stranded in Space: How ‘Lifeline’ Stole my Heart | by bee haitch blacklock | Medium](https://images.openai.com/static-rsc-4/EaGTXA4KR7Q5d7Ipgs-jdQOjtDfP7z8V-lHUIKSjJQtCWGmW9c0RjtXvKPI7AZNL-A1Jthf8B-rp9n5vNglKEqAsdUxjA9EAw8IZzPXWIGDNNR801fszq6F4R832dP8V_MQC2qccm-6yTEQfil41DGqyQbUIgwE02BxxWB-uF8Q?purpose=inline)

现有代码对应的呈现倾向

统一深色底、文字、矩形按钮，偏功能验证界面

以上仅为视觉方向参考，不是当前游戏截图，也不用于复制他人素材。

正式方案应该让书桌上的信、照片、MP3、毕业册成为入口。完成章节后，桌面物件也随故事变化，而不是一直面对相同的菜单按钮。

审核意见：必须重做首页的视觉表现层，但保留现在的存档与开始游戏逻辑。

### 2. 故事界面还是统一模板，没有真正的年代感

从&#x20;

github.com

&#x20;可以看到，现有界面采用固定深灰背景、浅色文字和绘制矩形按钮。



从&#x20;

github.com

&#x20;可以看到，大部分内容切换依赖清空并重建文本区域。



这种架构适合快速实现长篇叙事，但存在一个明显的问题：

2037年的家庭、2007年的公交、2013年的车站，容易只是阅读标题不同，而不是进入了不同的生活空间。

我们需要让场景产生区别，却不需要到处增加复杂特效。

[Kitchen room night Images - Free Download on Magnific (formerly Freepik)](https://images.openai.com/static-rsc-4/WFFAVhuax57KcfMq7zFr4JOp1H-68Qda_lde-VjX-0hnPGA7pBz1r7hWvg9uifZ_E5KgwCyVLrQUp9dzdhVVqZoBpoN6-ASeopSExYYt3-PWqxNtEMeDTml0wCvigBVy94ACZDwu_89qnE6sBMtJgC6-ZNSP8EjLbVfZklz2cTA?purpose=inline)

2037 · 现实线

灰蓝色雨夜、偏暗室内、暖灯、生活杂物，人物成熟但不疲惫表演化。

[新周刊官网](https://images.openai.com/static-rsc-4/9_5rrhQM-8pux3rWEyWXoG1059b36c-7JuLx0G56NGq0CdK-WTJMp-i4lLNlU1qgeaV42X89oET97gSODNYKzXx4G6dLmxUg9Ig8oJgXjGKfXvEJl7RZZFfDAZMqept6-RNKjJnmM35fUW1TPOyQ04wUNKX2y61PUNNTwTz_qSc?purpose=inline)

2007 · 青春线

普通日光、闷热夏天、旧公交与校园。温暖，但不做过度怀旧美化。

概念参考图，正式资产应使用原创角色设定和锁定后的统一美术规范重新制作。

### 3. 阅读体验需要重新设计，而不是改成花哨视觉小说

策划书的 70% 连续叙事原则是正确的，我不建议退回“立绘 + 台词框 + 下一句”的旧方案。

我建议采用双阅读模式：普通生活采用整段阅读、自然滚动、清楚的段落与留白；关键对话、重要物件和记忆瞬间再临时切换到场景演出。

这样既保留《布衣逆袭录》给我们的启发，又不会让玩家感觉自己在阅读没有排版设计的电子书。

## 四、图片与美术审核

目前仓库实际引用的四张原创照片是：

[泉州漳州昨天中考 命题组点评解析泉州语文、英语试卷-闽南网](https://images.openai.com/static-rsc-4/9867Z-Hc6qYSsYYM9AmkGRi2xOsf4oS22XuXEXR3jRd7fND695YBaHxWFliz33pbpbKeg0k1lQtW0nj205-Bff0ZKl99DWNXwiTflrd2L8rBBxV1rbIfmGqHKKZUmgamDz_nS_C4r30SUdvP3GqcXlCyk3mgtCKI9FS7Sd3uZY4?purpose=inline)

毕业照片 · 2009

github.com

&#x20;·&#x20;

github.com

[University of Utah failed to help Zhifan Dong before she was killed, documents show - The Washington Post](https://images.openai.com/static-rsc-4/WL_LfcqQSJD8vbYwV4cs9JhY3p0RFEYYuKvMqxLShya0aw4MntyWjv07XwGW-oHuLb_XGTU-l6dUsN_Zop3OucifErCoQs9BrAwy3douurmGcX-PGPc27Xs8TOiqvGqCCOi--LOI0iulGU6ol3uPOMGHcpp_wzUQnT5yeGM1fFQ?purpose=inline)

家庭照片 · 2035

github.com

[Backstreets in Southern City, Unique Walking Tours | Shanghai Pathways](https://images.openai.com/static-rsc-4/GBs05kLFl50aHI4DBTuBB3Zavg2PEQAhXNLKocgbzNpxcQ7V_goJXdmCnDFvaEYWPBb5RuxOMk6rQIuJSrefh2U8SUktpXobNlkkxld4xuPJbw3bZtsNjLJUUvrwUlUO7l38dt5fJVrbeurVd-fJl-v1bTFudaMVadenvmcn2oE?purpose=inline)

旧街照片 · 2010

github.com

[デジカメ日記の新カテゴリー追加 - ほぼ自分の覚え書き](https://images.openai.com/static-rsc-4/GL3w1y7a6HPt3q0BotkwqgIoMhOqWQaK3i0zgh_yMmeIWypeLxPrK2tI1AgDfMMG8ihGElJIC18-37vJ-3vk1jFNXXtp40A57xWY11azUw15N2pjE1TtWjE2kUTWuocImshvhqJcpFpIcnwyMdxqW3tbzUHhpltYRGyqfQBK5f0?purpose=inline)

仍缺少的生活物件视觉

需要独立制作相机、信件、公交票、MP3等空间交互素材

网搜示意图仅用于帮助理解类别和目标氛围，并非仓库图片的实际展示；真实素材以每项“仓库原图”为准。

我核对了四张图片的生成提示词及已有&#x20;

github.com

。提示词刻意追求普通抓拍、不完美构图、没有磨皮和煽情光晕，这本身符合去AI感要求。



因此我不建议因为你觉得现在画面不对，就立即把这些照片全部废掉。

更准确的问题是：策划书要的是一套完整的视觉语言，而现在主要制作的是四张真实感照片。

照片可以是真实摄影风格，因为故事里它们本来就是照片；但场景背景、人物立绘、物件交互、阅读面板和转场还没有形成统一体系。

尤其需要重新建立一份正式的角色视觉设定，检查同一个周叙在17岁、30岁和47岁时是否具有稳定的面部特征；程安然与许知夏是否同等真实，不能让一个像普通人、另一个像AI精修模特。

## 五、最需要补齐的三个交互

| 原策划体验 | 当前实现                | 建议修改                       |
| ----- | ------------------- | -------------------------- |
| 旧物调查  | 文字说明和物件按钮           | 桌面上的实际物件热点，点选进入局部特写        |
| 模拟手机  | `phone` 内容主要复用长段落阅读 | 做有真实信息布局的手机界面，历史短信与现代手机有区别 |
| 记忆重构  | 已有状态、证据条件和剧情承接      | 加入照片对照、录音片段与旧记忆文本的可视化切换    |

重点是表现已有玩法，而不是新增复杂玩法。

例如信件可以让玩家轻轻抽出信纸，但不需要制作十秒钟的复杂翻书动画；录音可以在旧MP3上点击播放，但不需要炫目的波形；记忆重构可以让旧文字逐渐被证据替换，而不是使用闪屏、粒子或故障艺术。

## 六、后续版本更新建议

现在仓库已经是 `1.0.0-rc.2`，所以我不建议叫它“重新开发版”。应该保留现有 RC2 作为技术基线，再做有明确验收目标的改进。

| 版本阶段        | 核心工作                          | 验收条件                   |
| ----------- | ----------------------------- | ---------------------- |
| 视觉冻结阶段      | 确认美术方向、角色设定、三张关键UI设计稿         | 你与Claude对视觉样稿达成一致      |
| 1.0.0-rc.3  | 首页人生书桌、故事阅读层、年代场景、UI视觉规范      | 首章全流程视觉表现达到原策划，旧存档正常   |
| 1.0.0-rc.4  | 旧物交互、拟真手机、照片/信件/MP3、记忆重构表现    | 主要交互在真实手机尺寸可用，不卡主线     |
| 1.0.0-rc.5  | 十章演出统一、全篇真人阅读、文案与节奏校准、人物一致性   | 10章实玩，不依赖自动点击证明阅读体验    |
| 1.0.0 发布版   | 真机、TapTap容器、加载、存档、平台合规和最终资源验收 | 无阻断问题，完成发布前验收并由你决定提交上架 |
| 1.1.0 上线后优化 | 根据实际玩家反馈优化阅读、字体、提示、内容节奏       | 只处理有证据支持的体验问题，不盲目加玩法   |

我认为最重要的版本是 rc.3。

因为如果首页和第一章没有建立游戏的独特气质，就算十章全部完成，玩家第一眼看到的还是一套通用文字游戏UI。

在 rc.3 视觉方案没有确定之前，建议暂缓持续批量生成新图片，以免花大量时间制作最后用不上的素材。

## 七、给 Claude 讨论的正式审核交接稿

# 《余生未寄》策划对照审核与版本整改需求

## 当前项目

GitHub：[https://github.com/zhil50143-boop/11](https://github.com/zhil50143-boop/11)

现有版本：1.0.0-rc.2

项目方向：Cocos Creator 3.8.8 + TypeScript、1080×1920竖屏、TapTap H5、现实人生叙事模拟。

**本次不是重新开发，不允许创建新项目或推翻现有十章剧情。**

## 请优先阅读

- `docs/GAME_SPEC.md`
- `docs/DIRECTION_SOURCE.txt`
- `docs/LIFE_NARRATIVE_RULES.md`
- `docs/FINAL_PROGRESS.md`
- `docs/CHAPTER10_AUDIT.md`
- `docs/ART_REVIEW.md`
- `CODEX_TASK.md`

随后检查 `assets/scenes/`、`assets/scripts/ui/`、`assets/resources/images/` 和当前 H5 构建表现。

## 已确认的主要问题

当前剧情、分支、存档和多结局已有完整工程基础，但当前 UI 以程序化深色背景、文字和通用矩形按钮为主，与最初讨论的“人生书桌、真实生活场景、克制的半写实叙事演出”存在明显差距。

目前四张图片主要是剧情中的照片资产，不足以形成完整的游戏视觉体系。需要单独区分真实照片、场景背景、角色视觉、物件交互和阅读界面。

现有模拟手机与记忆重构需要补足交互表现，但不得借此新增复杂系统。

## 设计目标

1. 以普通中国城市生活为核心，营造可信的2007—2037年代差异。
2. 连续文字叙事是主体，普通生活自然展开，只有重大人生决定提供选项。
3. 首页使用“人生书桌”，物件承担合理的功能导航。
4. 现实线克制、温暖但不煽情；青春线自然、明亮但不偶像剧化。
5. 许知夏、程安然、周叙等人物必须遵守统一身份设定，不能AI式完美美化。
6. 不增加玻璃UI、发光边框、粒子、商业游戏式成就反馈、复杂成长系统。
7. 保留已有第三版已确认音色，不因视觉重构擅自重生成语音。
8. 现有StoryManager、剧情JSON、存档兼容、多结局和自动化测试原则上全部保留。

## 请先输出以下内容，暂不修改工程

**第一部分：策划一致性审计**

逐页检查现有游戏：Boot、Main、Story、决定界面、照片、信件、MP3、调查、手机、记忆重构、结局。

每一项给出：策划预期、现有实现、实际差距、严重度、修改建议、是否影响既有逻辑。

**第二部分：美术重建方案**

提供一份统一美术规范，明确：

- 2007与2037的场景美术方向
- 正式主界面与阅读界面
- 人物跨年龄视觉一致性
- 真实照片和场景插画的区别
- 物件材质、排版、字体、色彩与交互动画
- Image 2 原创美术的角色锁定和反向提示词要求

**第三部分：三张关键界面设计**

先设计人生书桌、2037家庭故事阅读界面、2007公交初遇界面。

以这三张界面建立整个游戏的视觉标准，不通过之前不要批量生成其他素材。

**第四部分：版本升级**

按 rc.3 视觉界面、rc.4 物件交互、rc.5 叙事演出与真人体验、1.0.0 TapTap发布验收，拆分开发任务、验收条件和回滚原则。

## 最重要的要求

不要为了显得专业而增加无意义系统、动画和特效。

不要把《余生未寄》做成通用AI文字游戏模板，也不要把它做成华丽恋爱手游。

目标是让玩家感觉自己陪一个普通人经历几十年，而不是一直点击按钮阅读机器生成的剧情。

先做审计和视觉方案，等方案讨论确定后，再动现有代码。

## 最终审核意见

我建议把当前项目定义为：

“叙事功能基本成型，视觉与沉浸体验尚未达到原策划书标准的发布候选版。”

下一步不需要增加第十一章，也不需要重新设计大量数学公式，更不应该因为已经有十章就急着上架。

先把人生书桌、2037家庭和2007公交这三个最能代表游戏气质的场景做对。只要这三个场景真正达到设计目标，我们就能以它们为标准推进整款游戏的视觉升级，而不必推翻已经完成的剧情系统。