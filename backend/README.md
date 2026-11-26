# DreamScope AI 代理后端

基于 FastAPI 的轻量代理服务，将各家大模型 API Key 收归服务端环境变量管理，为微信小程序提供统一的对话与生图转发接口。

## 接口一览

- `GET /health`：健康检查，返回 `{"ok": true}`
- `POST /api/chat`：转发对话请求，支持 `zhipu`（智谱 GLM）、`deepseek`（DeepSeek）、`qwen`（通义千问）、`moonshot`（Kimi）
- `POST /api/image`：转发智谱 CogView 图像生成请求

## 1. 配置环境变量（.env）

复制 `.env.example` 为 `.env`，按需填入对应厂商的 API Key（只需填你要使用的厂商，`.env` 已被 `.gitignore` 忽略，切勿提交到 Git）：

```powershell
cd backend
Copy-Item .env.example .env
```

`backend/.env` 示例格式：

```env
ZHIPU_API_KEY=你的智谱Key
DEEPSEEK_API_KEY=你的DeepSeekKey
DASHSCOPE_API_KEY=你的通义百炼Key
MOONSHOT_API_KEY=你的KimiKey
```

## 2. 安装依赖

建议使用 Python 3.11：

```powershell
cd backend
py -3.11 -m pip install -r requirements.txt
```

## 3. 启动服务

在 `backend/` 目录下运行（默认监听 `8000` 端口）：

```powershell
py -3.11 -m uvicorn main:app --host 127.0.0.1 --port 8000
```

如需局域网内手机真机调试，可将 `--host` 改为 `0.0.0.0` 并使用电脑局域网 IP 访问。

启动后可验证健康检查：

```powershell
curl http://127.0.0.1:8000/health
```

预期返回：`{"ok":true}`

## 4. 小程序切换为后端代理模式

1. 在微信开发者工具中，进入「详情 → 本地设置」，勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」（本地 HTTP 调试必需）。
2. 打开小程序「设置（Settings）」页的 **AI 模型设置** 卡片。
3. 将「调用模式」从默认的 **直连** 切换为 **后端代理**。
4. 确认「后端地址」为 `http://127.0.0.1:8000`（真机调试时改为电脑局域网地址如 `http://192.168.x.x:8000`）。
5. 选择服务商（智谱 GLM / DeepSeek / 通义千问 / Kimi），点击 **保存**，再点击 **测试连接** 验证转发链路。

> 如未启动后端，将调用模式切回 **直连** 即可照常使用原有直连逻辑。
