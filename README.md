# DreamScope · 梦境分析师（微信小程序）

AI 梦境记录与意象分析小程序：语音说梦 → 自动转写 → 结构化解析 → AI 插画 / 贴纸拼贴 → 意象图谱与洞察。

本 README 面向**开发与演示部署**，按顺序做完即可在开发者工具和真机上跑通。

---

## 1. 目录结构

```
dreamscope/
├── app.js / app.json / app.wxss      # 全局入口、tabBar、主题
├── config.js                         # 云开发环境 ID（可留空）
├── pages/
│   ├── timeline/                     # 首页：日历 + 梦境时间线
│   ├── record/                       # 记录：录音/转写 + 拼贴画布
│   ├── workshop/                     # 贴纸实验室：AI 生成 / 手绘 / 拼贴 / 贴纸库
│   ├── graph/                        # 意象图谱（球体 / 平面）
│   ├── detail/                       # 梦境详情
│   ├── mine/                         # 洞察：情绪频谱 / Top5 / AI 月总结
│   └── settings/                     # 设置：语言、AI 模型、数据
├── utils/
│   ├── asr.js                        # 语音转文字（智谱 GLM-ASR，录音后转写）
│   ├── ai.js                         # 多服务商模型适配与提示词
│   ├── fileStore.js                  # 本机文件持久化、配额清理
│   ├── stats.js                      # 洞察页真实统计
│   ├── graph.js                      # 共现图谱构建与意象名归一化
│   ├── stickers.js                   # 贴纸库
│   ├── canvasImage.js                # Canvas 图片加载（多路径兜底）
│   └── i18n.js                       # 中英双语
└── cloudfunctions/analyzeDream/      # 预留云函数（当前前端未调用，可忽略）
```

---

## 2. 运行前必须做的 3 件事

### 2.1 语音转文字（智谱 GLM-ASR，无需插件）

**不使用任何微信插件。** 录音结束后，直接把 mp3 发给智谱的语音转文本接口：

```
POST https://open.bigmodel.cn/api/paas/v4/audio/transcriptions
multipart: file=<mp3>, model=glm-asr-2512
Authorization: Bearer <智谱 API Key>
→ { "text": "..." }
```

- **不需要新账号**：复用你在设置里填的**智谱 GLM Key**；有 Key 就能转写。
- **单段 ≤ 30 秒**：录音页已把上限设为 30 秒（官方限制）。
- **不是边说边显示**：停止录音后调用接口，通常 1–3 秒返回文字并自动填入文本框。
- 没配智谱 Key 时：只保存录音，页面提示「语音转文字需要智谱 API Key」，不影响其他功能。

> 语音转写通过 `wx.uploadFile` 上传 multipart 音频；失败时保留录音，可以重试转写或手动输入。
> 录音上传必须在小程序后台配置 `uploadFile` 合法域名；开发者工具关闭域名校验不代表真机可用。

**要开通 GLM-ASR**：智谱开放平台 → 模型广场确认账号有 `glm-asr-2512` 权限；
若返回 401/403，先检查 Key 是否有效、是否开通该模型。

### 2.2 配置服务器域名

「开发管理 → 开发设置 → 服务器域名」中，按你实际使用的服务商添加：

| 类型 | 域名 | 用途 |
|---|---|---|
| request | `https://open.bigmodel.cn` | 智谱 GLM / CogView |
| uploadFile | `https://open.bigmodel.cn` | 语音转写（multipart 上传） |
| request | `https://api.deepseek.com` | DeepSeek |
| request | `https://dashscope.aliyuncs.com` | 通义千问 |
| request | `https://api.moonshot.cn` | Kimi |
| downloadFile | 生图返回图片所在域名 | `wx.getImageInfo` 下载 AI 图片 |

> 注意：OpenAI / Anthropic / Gemini 的域名无法在国内小程序后台备案，真机基本不可用。
> 比赛演示建议只保留智谱（默认）、DeepSeek、通义、Kimi。
>
> 开发者工具里 `project.config.json` 的 `urlCheck` 目前是 `false`（方便本地调试）。
> 真机验证时请勾选/取消勾选「不校验合法域名」各跑一次，确认域名配置真的生效。
>
> **测试号/非正式号无法在后台配域名**：开发阶段直接在开发者工具勾「不校验合法域名」；
> 真机预览时点右上角「···」→「开启调试」即可跑通。比赛演示够用，但正式发布必须配好域名。

### 2.3 填写模型 API Key

打开小程序 →「我的 → AI 模型设置」：

- 选服务商（默认智谱 GLM，推荐 `glm-4-flash` + `cogview-3-flash`）
- 粘贴 Key → 保存 → 测试连接
- 生图需要智谱或 OpenAI 的 Key；纯文本模型（DeepSeek / 通义 / Kimi）不会生图，会自动用本地艺术插画兜底
- **语音转写固定用智谱 Key**：即使当前文本模型选的是 DeepSeek/通义，也请把智谱 Key 填上，否则只能录音、不能转文字

Key 只存在本机 Storage，仅在你发起请求时发送给对应服务商。

---

## 3. 发布前（上架/体验版）还要做

1. **隐私保护指引**：后台「设置 → 服务内容声明 → 用户隐私保护指引」，声明麦克风、相册用途。
2. `app.json` 增加 `"__usePrivacyCheck__": true`（当前未开启，避免比赛演示被隐私弹窗打断）。
3. 录音/选图前调用 `wx.requirePrivacyAuthorize`——`record.js` 已封装 `runWithPrivacy()`，但需要上面的开关才会真正触发。
4. tabBar 图标当前是 32×32，正式发布建议换 81×81。
5. 若要上架，AI 生成内容需按平台要求补充相关资质/说明。

---

## 4. 数据与配额

- 梦境、贴纸配置、API Key：`wx.setStorageSync`
- 录音、AI 插画、贴纸作品：`wx.getFileSystemManager().saveFile`
- 单小程序 `saveFile` 总量约 **10 MB**。`utils/fileStore.js` 会在启动时清理没有被任何记录引用的孤儿文件；删除梦境时也会回收该条的插画与录音。
- 「我的 → 数据导出」会把全部梦境 JSON 复制到剪贴板，可作为备份。
- 没有账号体系，也没有云同步：换手机/清缓存 = 数据丢失（比赛版本的设计取舍）。

---

## 5. 自测清单（演示前 10 分钟）

- [ ] 冷启动：首页空态/示例数据正常，无报错
- [ ] 未配 Key 录一条：能保存、显示本地艺术插画、不出现「AI 绘梦」角标
- [ ] 配 Key 录一条：停止录音后 1–3 秒文字自动填入文本框，保存后生成插画，详情页大图正常
- [ ] 杀进程重启：详情页「播放原声」仍可播放（音频已持久化）
- [ ] 录音中点返回：麦克风立即停止（状态栏录音标识消失）
- [ ] 画布上画线：页面不滚动
- [ ] 洞察页数字 = 实际记录数；清空后显示空态
- [ ] 切英文：录音页状态、按钮、Toast 无中文残留
- [ ] 日历选 6 月 2 日：不会把 6 月 25 日的梦带出来
- [ ] 删除一条梦境：对应图片/录音文件被回收（存储不涨）

---

## 6. 已知限制

- 语音识别使用智谱 GLM-ASR-2512，**单段 ≤ 30 秒**，停止录音后转写（不是边说边出字）；中英混说时语言由模型自动判断。
- 图片资源统一使用 ASCII 文件名（`sticker_*.png` / `ai_*.png`）。Canvas 2D 在部分环境下读不了中文路径，改名 + `utils/canvasImage.js` 多路径兜底一起解决“贴纸贴不上”的问题；新增素材请沿用英文命名。
- 生图/解析的真实效果取决于所选模型与 Key 的额度。
- 图谱的「球体/平面」是可视化布局，不是物理力导向仿真。
- 当前版本**完全免费**：没有订阅、内购或付费墙，所有功能都直接可用。
- 云函数 `analyzeDream` 未接入前端调用，保留作为后续「免 Key 服务端代理」的占位。
