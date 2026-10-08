# 开源候选核查（2026-10-07）
仅复用基础设施，不导入示例剧情、角色、图片、UI、音乐或独特玩法。候选工程不是本游戏的素材授权来源。

| 候选 / 原始来源 | 已核对许可证 | 可复用范围 | 风险与决定 |
|---|---|---|---|
| [Cocos 官方 creator-types 3.8.8](https://github.com/cocos/creator-types) | [ISC（package.json）](https://github.com/cocos/creator-types/blob/main/package.json) | CI 检查所有脚本与 3.8.8 cc API 类型 | 选用，仅开发依赖；类型检查不能代替场景运行 |
| [mitt 3.0.1](https://github.com/developit/mitt/tree/3.0.1) | [MIT](https://github.com/developit/mitt/blob/3.0.1/LICENSE) | TypeScript 事件订阅、退订；StoryManager→UI | 选用，原样 vendoring，保留许可；卸载时清理订阅 |
| [Ajv 8.20.0](https://github.com/ajv-validator/ajv/tree/v8.20.0) | [MIT](https://github.com/ajv-validator/ajv/blob/v8.20.0/LICENSE) | 开发期 JSON Schema 校验 | 选用，仅 devDependency，不加入 H5 运行时；语义目标检查另做 |
| [InkJS](https://github.com/y-lohse/inkjs) | [MIT](https://github.com/y-lohse/inkjs/blob/master/LICENSE.md) | 分支叙事解释器、序列化状态 | 不引入；Ink 编译 JSON 与现有节点 JSON 不兼容，会重复建立引擎 |
| [FairyGUI Cocos Creator](https://github.com/fairygui/FairyGUI-cocoscreator) | [MIT](https://github.com/fairygui/FairyGUI-cocoscreator/blob/master/LICENSE) | UI 控件基础设施 | 暂不引入；编辑器、资源管线和 3.8.8 适配需实测，当前简单 UI 无明显收益 |
| [Howler 2.2.4](https://github.com/goldfire/howler.js/tree/v2.2.4) | [MIT](https://github.com/goldfire/howler.js/blob/v2.2.4/LICENSE.md) | H5 音频播放、暂停 | 暂不引入；与 Cocos AudioSource 重复，双音频生命周期增加移动端风险 |
| [localForage 1.10.0](https://github.com/localForage/localForage/tree/1.10.0) | [Apache-2.0](https://github.com/localForage/localForage/blob/1.10.0/LICENSE) | 异步 IndexedDB 存储 | 暂不引入；当前存档小，Cocos sys.localStorage 足够，异步迁移有额外复杂度 |
| [ccc-tnt-framework](https://github.com/onvia/ccc-tnt-framework) | [自定义禁止商业使用](https://github.com/onvia/ccc-tnt-framework/blob/master/LICENSE) | 资源/UI/管理器 | 排除；不能用于本商业产品，不复制其实现 |
| [OpenAI Playwright Skill](https://github.com/openai/skills/tree/main/skills/.curated/playwright) | [Apache-2.0](https://github.com/openai/skills/blob/main/skills/.curated/playwright/LICENSE.txt) | 浏览器交互验收辅助 | 未安装该 Skill；本次使用本机已有 Playwright 工具进行 Canvas 实测，无需另加 Skill |
| [Microsoft Playwright](https://github.com/microsoft/playwright) | [Apache-2.0](https://github.com/microsoft/playwright/blob/main/LICENSE) | 开发期真实浏览器触摸、刷新续读与截图 | 已使用本机已有测试环境；只调用测试 API，不复制示例内容，不加入 H5 运行时 |

H5 加载采用 Cocos 3.8 官方 resources API，按 manifest 加载当前片段、预取下一片段 JSON；不用第三方 CDN，不预取全部美术音频。
依据：[Cocos 3.8 动态资源加载](https://docs.cocos.com/creator/3.8/manual/en/asset/dynamic-load-resources.html)。

mitt 固定 tag 3.0.1，源文件 assets/scripts/vendor/mitt.ts，未修改正文；MIT 全文随仓库保存。
Ajv 固定 8.20.0，许可保存在 third_party/ajv/LICENSE。已通过 GitHub Actions 实际安装并执行；package-lock.json 由该环境生成并提交，后续使用 npm ci。

## 2026-10-08新增核查：Code2Games与审美技能

| 候选 | 当前许可证证据 | 可用范围 | 兼容性、风险及决定 |
|---|---|---|---|
| [北大等团队 Code2Games](https://github.com/AIGeeksGroup/Code2Games/tree/8d5ca9c95432e3969bef443a83f8cf224ea4f5a8) | 当前提交完整树26个文件，无 LICENSE/COPYING/NOTICE 路径；GitHub metadata license=null，README未给代码授权 | 仅研究场景、规则、运行反馈的对应关系思想 | 公开入口要求 Python3.11、Blender4.2、Code2Worlds场景、Hunyuan3D2.1、DashScope及动画FBX；输出BLEND/MP4/GLB。论文目标UE5，当前树无Cocos、TS、H5或UE项目目录。不能直接减轻本项目JSON剧情/存档开发；不复制代码、提示词、示例素材，不安装运行。代码授权与第三方模型/角色素材许可都须分别确认 |
| [Taste-Skill](https://github.com/Leonxlnx/taste-skill/tree/b482f7a970abb98c4108d4a9f761e458c64cefc8) | MIT，原文随本机技能安装保留 | 按用户要求用于照片审美：先理解生活叙事需求、核对原有形象、避免泛化装饰 | 已安装 design-taste-frontend，v2实验版；主要针对前端界面，不能自动证明人脸/手部合格；网页栈/动效默认不适用于本Cocos游戏，不加入运行时依赖 |
| [Impeccable](https://github.com/pbakaus/impeccable/tree/778c8a7b71ccd5bfe3ca6ac68c15d9d872d0f87d) | Apache-2.0，LICENSE与NOTICE.md随本机技能安装保留；平台参考派生部分MIT见NOTICE | 用户确认指该技能并允许独立图片评审；用critique按适用范围评审 | 已安装4.5.0；机械检测主要检查网页界面，不是PNG生成瑕疵检测器。图片审查不得把未扫描/零发现等同自动合格，不强套网页交互分数，不改变本项目叙事方向 |

Code2Games核查日期2026-10-08，固定提交8d5ca9c95432e3969bef443a83f8cf224ea4f5a8。论文[arXiv2610.05033v1](https://arxiv.org/abs/2610.05033)介绍UE5引擎重构与执行反馈；论文许可不替代代码、模型、图片或数据集授权。公开仓库现有可执行交付与论文描述分开判断，本次未声称已跑通它。它的稳定ID和运行反馈思路与本项目已有节点ID、Schema、核心测试和真实H5回归相近，没有显著新增收益。

## 离线声音制作工具（2026-10-08）

Qwen官方[Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS)代码与官方模型卡标注Apache-2.0；本地包qwen-tts固定0.1.1，许可证原文保留third_party/qwen-tts/LICENSE。首个0.6B-CustomVoice（85e237c12c027371202489a0ec509ded67b5e4b5）候选被用户否定，不采用。新[1.7B-VoiceDesign](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign/tree/5ecdb67327fd37bb2e042aab12ff7391903235d3)描述虚构角色与现场说话语气，再用[0.6B-Base](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-0.6B-Base/tree/5d83992436eae1d760afd27aff78a71d676296fc)沿用自己生成的两个人物声线；没有现实人物参考。只作为本机离线素材生产，模型权重/推理依赖不加入H5运行时。原文脚本、指纹、试听、转写与主观听感状态分开留证。

独立ASR用SYSTRAN [faster-whisper](https://github.com/SYSTRAN/faster-whisper)1.2.1与官方small模型536b0662742c02347bc0e980a01041f333bce120，MIT，仅检查内容，不证明声音自然。PyAV19路径解码metadata_errors不兼容，改用soundfile读取真实波形与16k数组输入，没有改对白来迎合转写结果。所有模型的大文件均实际核SHA256，制作目录忽略，不复制示例内容。

## 当前发布构建与声音版本

Cocos Creator3.8.8所附引擎根LICENSE.md为MIT，原文保存third_party/cocos-engine-3.8.8/LICENSE.md，随H5 THIRD_PARTY_NOTICES.txt与mitt许可分发。仅裁剪并构建本游戏所需引擎模块，不分发编辑器或将其许可推断到其他软件。

用户否定两版声音后，第三版重新设计两名普通声线，延续仍只使用本项目虚构合成参考。63.53秒正式候选、16.66秒开头、原声说明、散列和完整独立转写在art/original/audio。旧两版留在忽略的work，不作为当前素材；第三版技术播放通过，音色已由用户试听确认。

音色确认记录：2026-10-08用户试听新声线后回复“比上一版自然”，随后明确“就这个音色了”。第三版两名角色音色已确认固定；普通说话的语气、接话及全篇真人阅读继续校准，技术检测不冒充听感。
