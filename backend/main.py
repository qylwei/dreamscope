import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

app = FastAPI(title="DreamScope AI Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

CHAT_PROVIDERS: Dict[str, Dict[str, str]] = {
    "zhipu": {
        "name": "智谱 GLM",
        "url": "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        "env_key": "ZHIPU_API_KEY",
        "default_model": "glm-4-flash",
    },
    "deepseek": {
        "name": "DeepSeek",
        "url": "https://api.deepseek.com/chat/completions",
        "env_key": "DEEPSEEK_API_KEY",
        "default_model": "deepseek-chat",
    },
    "qwen": {
        "name": "通义千问",
        "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        "env_key": "DASHSCOPE_API_KEY",
        "default_model": "qwen-plus",
    },
    "moonshot": {
        "name": "Kimi",
        "url": "https://api.moonshot.cn/v1/chat/completions",
        "env_key": "MOONSHOT_API_KEY",
        "default_model": "moonshot-v1-8k",
    },
}

ZHIPU_IMAGE_URL = "https://open.bigmodel.cn/api/paas/v4/images/generations"
DEFAULT_IMAGE_MODEL = "cogview-3-flash"


class ChatRequest(BaseModel):
    provider: str
    model: Optional[str] = None
    messages: List[Dict[str, Any]]
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


class ImageRequest(BaseModel):
    prompt: str
    model: Optional[str] = DEFAULT_IMAGE_MODEL
    size: Optional[str] = "1024x1024"


def _error_response(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": {"message": message}})


def _passthrough_response(resp: httpx.Response) -> JSONResponse:
    try:
        content = resp.json()
    except ValueError:
        text = resp.text.strip()
        content = {"error": {"message": text or f"Upstream HTTP {resp.status_code}"}}
    return JSONResponse(status_code=resp.status_code, content=content)


@app.get("/health")
async def health() -> Dict[str, bool]:
    return {"ok": True}


@app.post("/api/chat")
async def proxy_chat(req: ChatRequest) -> JSONResponse:
    provider_key = req.provider.strip().lower()
    provider_cfg = CHAT_PROVIDERS.get(provider_key)
    if not provider_cfg:
        supported = ", ".join(CHAT_PROVIDERS.keys())
        return _error_response(400, f"不支持的 provider: {req.provider}（当前支持: {supported}）")

    env_key = provider_cfg["env_key"]
    api_key = os.getenv(env_key, "").strip()
    if not api_key:
        return _error_response(500, f"服务端未配置环境变量 {env_key}")

    payload: Dict[str, Any] = {
        "model": (req.model or "").strip() or provider_cfg["default_model"],
        "messages": req.messages,
    }
    if req.temperature is not None:
        payload["temperature"] = req.temperature
    if req.max_tokens is not None:
        payload["max_tokens"] = req.max_tokens

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(provider_cfg["url"], headers=headers, json=payload)
    except httpx.TimeoutException:
        return _error_response(504, "请求上游模型服务超时")
    except httpx.HTTPError as exc:
        return _error_response(502, f"请求上游模型服务失败: {exc}")

    return _passthrough_response(resp)


@app.post("/api/image")
async def proxy_image(req: ImageRequest) -> JSONResponse:
    api_key = os.getenv("ZHIPU_API_KEY", "").strip()
    if not api_key:
        return _error_response(500, "服务端未配置环境变量 ZHIPU_API_KEY")

    payload: Dict[str, Any] = {
        "model": (req.model or "").strip() or DEFAULT_IMAGE_MODEL,
        "prompt": req.prompt,
        "size": (req.size or "").strip() or "1024x1024",
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(ZHIPU_IMAGE_URL, headers=headers, json=payload)
    except httpx.TimeoutException:
        return _error_response(504, "请求智谱生图服务超时")
    except httpx.HTTPError as exc:
        return _error_response(502, f"请求智谱生图服务失败: {exc}")

    return _passthrough_response(resp)
