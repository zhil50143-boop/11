# 开源候选核查（2026-10-07）
仅复用基础设施，不导入示例剧情、角色、图片、UI、音乐或独特玩法。候选工程不是本游戏的素材授权来源。

| 候选 / 原始来源 | 已核对许可证 | 可复用范围 | 风险与决定 |
|---|---|---|---|
| [mitt 3.0.1](https://github.com/developit/mitt/tree/3.0.1) | [MIT](https://github.com/developit/mitt/blob/3.0.1/LICENSE) | TypeScript 事件订阅、退订；StoryManager→UI | 选用，原样 vendoring，保留许可；卸载时清理订阅 |
| [Ajv 8.17.1](https://github.com/ajv-validator/ajv/tree/v8.17.1) | [MIT](https://github.com/ajv-validator/ajv/blob/v8.17.1/LICENSE) | 开发期 JSON Schema 校验 | 选用，仅 devDependency，不加入 H5 运行时；语义目标检查另做 |
| [InkJS](https://github.com/y-lohse/inkjs) | [MIT](https://github.com/y-lohse/inkjs/blob/master/LICENSE.md) | 分支叙事解释器、序列化状态 | 不引入；Ink 编译 JSON 与现有节点 JSON 不兼容，会重复建立引擎 |
| [FairyGUI Cocos Creator](https://github.com/fairygui/FairyGUI-cocoscreator) | [MIT](https://github.com/fairygui/FairyGUI-cocoscreator/blob/master/LICENSE) | UI 控件基础设施 | 暂不引入；编辑器、资源管线和 3.8.8 适配需实测，当前简单 UI 无明显收益 |
| [Howler 2.2.4](https://github.com/goldfire/howler.js/tree/v2.2.4) | [MIT](https://github.com/goldfire/howler.js/blob/v2.2.4/LICENSE.md) | H5 音频播放、暂停 | 暂不引入；与 Cocos AudioSource 重复，双音频生命周期增加移动端风险 |
| [localForage 1.10.0](https://github.com/localForage/localForage/tree/1.10.0) | [Apache-2.0](https://github.com/localForage/localForage/blob/1.10.0/LICENSE) | 异步 IndexedDB 存储 | 暂不引入；当前存档小，Cocos sys.localStorage 足够，异步迁移有额外复杂度 |
| [ccc-tnt-framework](https://github.com/onvia/ccc-tnt-framework) | [自定义禁止商业使用](https://github.com/onvia/ccc-tnt-framework/blob/master/LICENSE) | 资源/UI/管理器 | 排除；不能用于本商业产品，不复制其实现 |
| [OpenAI Playwright Skill](https://github.com/openai/skills/tree/main/skills/.curated/playwright) | [Apache-2.0](https://github.com/openai/skills/blob/main/skills/.curated/playwright/LICENSE.txt) | 浏览器交互验收辅助 | 候选，未安装/未执行；本地执行通道无响应；Canvas 检查仍需 Cocos 真浏览器验证 |

H5 加载采用 Cocos 3.8 官方 resources API，按 manifest 加载当前片段、预取下一片段 JSON；不用第三方 CDN，不预取全部美术音频。
依据：[Cocos 3.8 动态资源加载](https://docs.cocos.com/creator/3.8/manual/en/asset/dynamic-load-resources.html)。

mitt 固定 tag 3.0.1，源文件 assets/scripts/vendor/mitt.ts，未修改正文；MIT 全文随仓库保存。
Ajv 固定 8.17.1，许可保存在 third_party/ajv/LICENSE。首次实际安装后须生成并提交 package-lock.json，再使用 npm ci；目前不能把尚未安装的工具称为已验证。
