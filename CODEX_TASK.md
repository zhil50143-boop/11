# Codex 开发总任务：余生未寄

你现在接手的是一个已经完成核心商业策划锁定的 TapTap H5 单机沉浸式互动叙事项目。

## 最高目标
使用 Cocos Creator 3.8.x + TypeScript 开发《余生未寄》，竖屏 1080×1920，TapTap H5 首发。

## 必须保持
- Chapter 01～10
- 6 个主要结局
- “记忆会撒谎 / Memory Reconstruction”核心机制
- 旧物调查
- 模拟手机
- 人生轨迹
- 二周目
- Local Save
- Tap PlatformService 抽象
- Tap 云存档增强
- 后续自愿激励广告预留

## 禁止自行新增
- 联网主线依赖
- 多人
- UGC
- AI聊天
- AI动态剧情
- IAP
- 商城/体力/签到/抽卡
- 未规划系统

## 当前优先级
只推进 Chapter 01 Vertical Slice，先把真实可玩闭环做稳，再扩展 Chapter 02～10。

Vertical Slice 流程：
2037 雨夜家中
→ 旧纸箱
→ 旧物调查
→ 旧照片
→ 信件
→ 饭桌
→ 深夜
→ 旧 MP3
→ 记忆转场
→ 2007 年 17 路公交
→ 许知夏首次登场
→ 第一次青春选择
→ 自动存档
→ Slice End

## 工程原则
1. Story 与 Platform 严格解耦。
2. 正式剧情只能 JSON 数据驱动。
3. UI 不保存剧情业务状态。
4. Local Save 永远可独立运行。
5. Tap 登录/云存档/广告失败时主线不能被阻断。
6. 每阶段完成后编译、自检、修复阻断错误。
7. 不进行未经必要性验证的大型重构。

## 第一轮执行
请依次完成：
1. 建立 Cocos Creator 3.8.x 可识别工程骨架。
2. 建立 core/story/save/platform/ui 目录。
3. 实现 StoryNode 类型。
4. 实现 GameState。
5. 实现 Flag/Stat effect。
6. 实现 Local Save。
7. 实现 PlatformService 与 LocalPlatform。
8. 实现基础 StoryManager。
9. 读取 Chapter 01 JSON。
10. 用占位 UI 跑通 dialogue / narration / choice。
11. 再实现 investigation / photo / letter / audio interaction。
12. 完成 Chapter 01 Vertical Slice。

每次提交都保持工程可运行。
