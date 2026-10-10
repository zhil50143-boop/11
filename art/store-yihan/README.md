# 《遗憾》后台素材来源

2026-10-09，用户要求重新创建《遗憾》并填齐后台资料；此前明确全部美术使用Image生成，本轮再次要求补齐其他缺项。所有宣传图均由内置Image工具生成，不搬运网络图片。工具未提供具体模型型号，不编造型号记录。

## 最终候选与编辑链

- icon/candidates/icon.png：Image生成的单一旧信封近景，1254×1254、不带文字/圆角/图标边框。远端素材372367。
- banner-generated.png：新宣传图经Image编辑，使用实际游戏中的graduation_old.png替换错误的大学学士服群像；两人身份、遮阳动作、普通高中着装均来源原图。用户选择重生成宣传图，随后明确同意仅调整新图尺寸；banner/candidates/banner-1920.png为1920×1080等尺寸导出，无新绘制内容。
- square-generated.png：Image以最终横版图为唯一母图改为方形，保留人物照片、手、信封、普通家中书桌与正确标题。square/candidates/square-1440.jpg为1440×1440导出，JPEG质量94、4:4:4；原PNG超过平台4MB限制，另存原文，不上传超限文件。
- banner-letter-unused.png：第一次信封宣传图，用户要求另生成一张后弃用；不作为后台当前素材。
- screenshots/candidates：实际新名称Cocos H5运行截图，540×960 CSS窗口、2倍像素，原始1080×1920；没有生成虚构界面或改写显示文字。
- gameplay.mp4：实际Cocos Canvas MP4录像，1080×1920、约40秒，旧物调查、照片翻面、信封阅读。没有额外字幕/人声/设备画中画。桌面Chrome触摸环境，不是物理手机验收。
- trailer.mp4：同一实际Cocos H5在1280×720窗口运行并直接录制Canvas，37.5979秒，保留游戏自身的竖向阅读区与两侧留白；不拼装虚构横屏界面。宣传片与实机录像分别上传为不同视频资源。

全部提示词见PROMPTS.md，字节散列与动态校验见manifest.json和docs/validation/YIHAN_PLATFORM.json。图像内容人工复核由本轮代理检查，不等于真人盲测或平台审核通过。二维码和带签名的播放URL只保留本地，不提交公开仓库。

各场景子目录中的manifest.json保留上传前本地机器校验快照，其中upload_pending是该次校验时的状态；最终远端上传及字段回填结果以本目录根manifest.json和YIHAN_PLATFORM.json为准。
