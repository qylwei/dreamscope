const STORAGE_KEY = "dreamscope_ai_config";
const CATS = ["action", "item", "location", "emotion"];
const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";
const PROXY_CHAT_PROVIDERS = ["zhipu", "deepseek", "qwen", "moonshot"];
const i18n = require("./i18n");

function currentLang() {
  return i18n.getLang();
}

function isEn() {
  return currentLang() === "en";
}

// 根据当前界面语言选择提示语
function L(zh, en) {
  return isEn() ? en : zh;
}

const PROVIDERS = {
  zhipu: {
    name: "智谱 GLM",
    nameEn: "Zhipu GLM",
    category: "image",
    recommend: true,
    desc: "⭐ 推荐 · 国内直连 · 支持 CogView 生图 · 极速免费/低门槛",
    descEn: "⭐ Recommended · Direct Connection · CogView Image Gen · Free & Fast",
    portalUrl: "https://open.bigmodel.cn/",
    api: "openai",
    chatUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    imageUrl: "https://open.bigmodel.cn/api/paas/v4/images/generations",
    models: ["glm-4-flash", "glm-4.5-flash", "glm-4-air", "glm-4.5-air", "glm-4-plus", "glm-4.5"],
    imageModels: ["cogview-3-flash", "cogview-3", "cogview-4", "cogview-4-250304"],
    supportsImage: true
  },
  openai: {
    name: "OpenAI",
    nameEn: "OpenAI",
    category: "image",
    desc: "DALL-E 3 高清绘图 · 需海外网络",
    descEn: "DALL-E 3 HD Art · Global Network Required",
    portalUrl: "https://platform.openai.com/",
    api: "openai",
    chatUrl: "https://api.openai.com/v1/chat/completions",
    imageUrl: "https://api.openai.com/v1/images/generations",
    models: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4.1"],
    imageModels: ["dall-e-3", "gpt-image-1"],
    supportsImage: true
  },
  deepseek: {
    name: "DeepSeek",
    nameEn: "DeepSeek",
    category: "text",
    desc: "满血深度思考 · 擅长解梦与意象提取（不生图）",
    descEn: "Deep Reasoning · Dream & Motif Extraction (No Images)",
    portalUrl: "https://platform.deepseek.com/",
    api: "openai",
    chatUrl: "https://api.deepseek.com/chat/completions",
    models: ["deepseek-chat", "deepseek-reasoner"],
    supportsImage: false
  },
  qwen: {
    name: "通义千问",
    nameEn: "Qwen",
    category: "text",
    desc: "阿里百炼大模型 · 擅长文本分析（不生图）",
    descEn: "Alibaba Cloud Model · Text Analysis Only (No Images)",
    portalUrl: "https://bailian.console.aliyun.com/",
    api: "openai",
    chatUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    models: ["qwen-turbo", "qwen-plus", "qwen-max", "qwen-long"],
    supportsImage: false
  },
  moonshot: {
    name: "Kimi",
    nameEn: "Kimi",
    category: "text",
    desc: "月之暗面超长上下文（不生图）",
    descEn: "Moonshot Ultra-long Context (No Images)",
    portalUrl: "https://platform.moonshot.cn/",
    api: "openai",
    chatUrl: "https://api.moonshot.cn/v1/chat/completions",
    models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
    supportsImage: false
  },
  claude: {
    name: "Claude",
    nameEn: "Claude",
    category: "text",
    desc: "Anthropic 细腻文学解梦（不生图）",
    descEn: "Anthropic Literary Interpretation (No Images)",
    portalUrl: "https://console.anthropic.com/",
    api: "anthropic",
    chatUrl: "https://api.anthropic.com/v1/messages",
    models: ["claude-sonnet-4-5", "claude-opus-4-1", "claude-haiku-4-5"],
    supportsImage: false
  },
  gemini: {
    name: "Gemini",
    nameEn: "Gemini",
    category: "text",
    desc: "Google 多模态语言模型（不生图）",
    descEn: "Google Multimodal Language Model (No Images)",
    portalUrl: "https://aistudio.google.com/",
    api: "openai",
    chatUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"],
    supportsImage: false
  }
};

const DEFAULT_CONFIG = {
  provider: "zhipu",
  mode: "direct",
  backendUrl: DEFAULT_BACKEND_URL,
  keys: {
    zhipu: "",
    deepseek: "",
    claude: "",
    gemini: "",
    openai: "",
    qwen: "",
    moonshot: ""
  },
  models: {
    zhipu: "glm-4-flash",
    deepseek: "deepseek-chat",
    claude: "claude-sonnet-4-5",
    gemini: "gemini-2.5-flash",
    openai: "gpt-4o-mini",
    qwen: "qwen-plus",
    moonshot: "moonshot-v1-8k"
  },
  imageModels: {
    zhipu: "cogview-3-flash",
    openai: "dall-e-3"
  }
};

const ANALYSIS_PROMPT_ZH = [
  "你是梦境分析助手，负责把用户口述的梦境整理成结构化数据。",
  "只输出一个 JSON 对象，不要 markdown、不要解释。字段如下：",
  "{",
  '  "title": "不超过12个字的标题",',
  '  "emoji": "一个最能代表梦境的表情符号",',
  '  "emotion": "主导情绪，4个字以内",',
  '  "summary": "30个字以内的梦境概述",',
  '  "stickers": [{"name": "带表情符号的意象名", "cat": "action"}],',
  '  "tags": ["4个关键词"]',
  "}",
  "stickers 固定输出 4 个，cat 只能是 action / item / location / emotion 之一：",
  "action=动作，item=物品，location=地点，emotion=情绪。"
].join("\n");

const ANALYSIS_PROMPT_EN = [
  "You turn a user's dream description into structured data.",
  "Output only one JSON object, no markdown, no explanation. Fields:",
  "{",
  '  "title": "a title of at most 6 words",',
  '  "emoji": "one emoji that best represents the dream",',
  '  "emotion": "the dominant emotion, at most 2 words",',
  '  "summary": "one sentence under 25 words",',
  '  "stickers": [{"name": "motif name with a leading emoji", "cat": "action"}],',
  '  "tags": ["4 keywords"]',
  "}",
  "Always output exactly 4 stickers. \"cat\" must be one of action / item / location / emotion.",
  "action=motion, item=object, location=place, emotion=feeling."
].join("\n");

function analysisPrompt() {
  return isEn() ? ANALYSIS_PROMPT_EN : ANALYSIS_PROMPT_ZH;
}

function getConfig() {
  const saved = wx.getStorageSync(STORAGE_KEY) || {};
  const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

  if (saved.provider && PROVIDERS[saved.provider]) cfg.provider = saved.provider;
  if (saved.mode === "proxy" || saved.mode === "direct") cfg.mode = saved.mode;
  if (typeof saved.backendUrl === "string" && saved.backendUrl.trim()) {
    cfg.backendUrl = saved.backendUrl.trim();
  }
  if (saved.keys) {
    Object.keys(saved.keys).forEach((k) => {
      if (cfg.keys[k] !== undefined) cfg.keys[k] = saved.keys[k];
    });
  }
  if (saved.models) {
    Object.keys(saved.models).forEach((k) => {
      if (cfg.models[k] !== undefined) cfg.models[k] = saved.models[k];
    });
  }
  if (saved.imageModels) {
    Object.keys(saved.imageModels).forEach((k) => {
      if (cfg.imageModels[k] !== undefined) cfg.imageModels[k] = saved.imageModels[k];
    });
  }

  if (saved.apiKey && !cfg.keys.zhipu) cfg.keys.zhipu = saved.apiKey;
  if (saved.model) cfg.models.zhipu = saved.model;
  if (saved.imageModel) cfg.imageModels.zhipu = saved.imageModel;

  return cfg;
}

function saveConfig(patch) {
  const cfg = getConfig();
  const next = Object.assign({}, cfg, patch || {});
  if (patch && patch.keys) next.keys = Object.assign({}, cfg.keys, patch.keys);
  if (patch && patch.models) next.models = Object.assign({}, cfg.models, patch.models);
  if (patch && patch.imageModels) next.imageModels = Object.assign({}, cfg.imageModels, patch.imageModels);
  if (!PROVIDERS[next.provider]) next.provider = "zhipu";
  next.mode = next.mode === "proxy" ? "proxy" : "direct";
  next.backendUrl = String(next.backendUrl || "").trim() || DEFAULT_BACKEND_URL;
  wx.setStorageSync(STORAGE_KEY, next);
  return next;
}

function getProviders(lang) {
  const isEn = lang === "en" || wx.getStorageSync("dreamscope_lang") === "en";
  return Object.keys(PROVIDERS).map((key) => ({
    key: key,
    name: (isEn && PROVIDERS[key].nameEn) ? PROVIDERS[key].nameEn : PROVIDERS[key].name,
    category: PROVIDERS[key].category || (PROVIDERS[key].supportsImage ? "image" : "text"),
    recommend: !!PROVIDERS[key].recommend,
    desc: (isEn && PROVIDERS[key].descEn) ? PROVIDERS[key].descEn : (PROVIDERS[key].desc || ""),
    portalUrl: PROVIDERS[key].portalUrl || "",
    supportsImage: !!PROVIDERS[key].supportsImage,
    models: PROVIDERS[key].models.slice(),
    imageModels: (PROVIDERS[key].imageModels || []).slice()
  }));
}

function currentProvider() {
  const cfg = getConfig();
  return { cfg: cfg, provider: PROVIDERS[cfg.provider] || PROVIDERS.zhipu };
}

function isProxyMode(cfg) {
  return !!(cfg && cfg.mode === "proxy");
}

function isProxySupported(providerKey) {
  return PROXY_CHAT_PROVIDERS.indexOf(providerKey) >= 0;
}

function getProxyBaseUrl(cfg) {
  return String((cfg && cfg.backendUrl) || DEFAULT_BACKEND_URL).trim().replace(/\/+$/, "");
}

function hasKey() {
  const info = currentProvider();
  if (isProxyMode(info.cfg)) {
    return !!getProxyBaseUrl(info.cfg) && isProxySupported(info.cfg.provider);
  }
  return !!(info.cfg.keys[info.cfg.provider] || "").trim();
}

function hasImageKey() {
  const cfg = getConfig();
  if (isProxyMode(cfg)) {
    return !!getProxyBaseUrl(cfg);
  }
  // 当前主选模型若支持生图且有 Key
  if (PROVIDERS[cfg.provider] && PROVIDERS[cfg.provider].supportsImage && (cfg.keys[cfg.provider] || "").trim()) {
    return true;
  }
  // 智谱或 OpenAI 任意一个填了 Key
  return !!((cfg.keys.zhipu || "").trim() || (cfg.keys.openai || "").trim());
}

function getActiveImageProvider() {
  const cfg = getConfig();
  if (isProxyMode(cfg)) {
    return { key: "zhipu", provider: PROVIDERS.zhipu, cfg: cfg };
  }
  if (PROVIDERS[cfg.provider] && PROVIDERS[cfg.provider].supportsImage && (cfg.keys[cfg.provider] || "").trim()) {
    return { key: cfg.provider, provider: PROVIDERS[cfg.provider], cfg: cfg };
  }
  if ((cfg.keys.zhipu || "").trim()) {
    return { key: "zhipu", provider: PROVIDERS.zhipu, cfg: cfg };
  }
  if ((cfg.keys.openai || "").trim()) {
    return { key: "openai", provider: PROVIDERS.openai, cfg: cfg };
  }
  // 都没有填则默认返回智谱
  return { key: "zhipu", provider: PROVIDERS.zhipu, cfg: cfg };
}

function request(url, data, timeout, key) {
  return new Promise((resolve, reject) => {
    if (!key) {
      reject(new Error(L("请先在「我的 → AI 模型设置」填写 API Key", "Add your API key in Me → AI Model Settings first.")));
      return;
    }
    wx.request({
      url: url,
      method: "POST",
      timeout: timeout || 30000,
      header: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key
      },
      data: data,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        const msg = (res.data && res.data.error && res.data.error.message) || ("HTTP " + res.statusCode);
        reject(new Error(msg));
      },
      fail(err) {
        reject(new Error(formatFail(err)));
      }
    });
  });
}

function proxyRequest(url, data, timeout) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      method: "POST",
      timeout: timeout || 30000,
      header: {
        "Content-Type": "application/json"
      },
      data: data,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        const msg = (res.data && res.data.error && res.data.error.message)
          || (res.data && res.data.detail)
          || ("HTTP " + res.statusCode);
        reject(new Error(typeof msg === "string" ? msg : JSON.stringify(msg)));
      },
      fail(err) {
        reject(new Error(formatFail(err)));
      }
    });
  });
}

function anthropicRequest(url, data, key) {
  return new Promise((resolve, reject) => {
    if (!key) {
      reject(new Error(L("请先填写 Claude 的 API Key", "Add your Claude API key first.")));
      return;
    }
    wx.request({
      url: url,
      method: "POST",
      timeout: 30000,
      header: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      data: data,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        const msg = (res.data && res.data.error && res.data.error.message) || ("HTTP " + res.statusCode);
        reject(new Error(msg));
      },
      fail(err) {
        reject(new Error(formatFail(err)));
      }
    });
  });
}

function formatFail(err) {
  const raw = (err && err.errMsg) || "";
  let isEn = false;
  try { isEn = wx.getStorageSync("dreamscope_lang") === "en"; } catch (e) {}
  if (raw.indexOf("domain list") >= 0) {
    return isEn
      ? "Domain not in whitelist: On mobile, tap top-right '···' → 'Enable Debug' / 'Debug Mode'; on PC DevTools check 'Do not verify domain'."
      : "域名未加入白名单：手机真机请点击右上角「···」选择「开启调试」；电脑端请在「详情 → 本地设置」勾选「不校验合法域名」";
  }
  return raw || (isEn ? "Network request failed" : "网络请求失败");
}

function pickContent(res) {
  const choice = res && res.choices && res.choices[0];
  return choice && choice.message ? String(choice.message.content || "") : "";
}

function extractAnthropic(res) {
  const blocks = res && res.content;
  if (!Array.isArray(blocks)) return "";
  return blocks.filter((b) => b.type === "text").map((b) => b.text || "").join("");
}

function parseLoose(text) {
  const cleaned = String(text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(cleaned); } catch (e) {}
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch (e) {}
  }
  return null;
}

// 按字符（而不是 UTF-16 码元）截断，避免把 emoji 切成乱码
function clip(value, n) {
  const chars = Array.from(String(value == null ? "" : value));
  return chars.slice(0, n).join("");
}

function normalize(d) {
  const stickers = (Array.isArray(d.stickers) ? d.stickers : []).slice(0, 5)
    .map((s) => ({
      name: clip((s && s.name) || "", 16),
      cat: CATS.indexOf(s && s.cat) >= 0 ? s.cat : "item"
    }))
    .filter((s) => s.name);

  const tags = (Array.isArray(d.tags) ? d.tags : []).slice(0, 6)
    .map((t) => clip(t, 12))
    .filter(Boolean);

  return {
    title: clip(d.title || "", 16),
    emoji: clip(d.emoji || "✨", 4),
    emotion: clip(d.emotion || "", 8),
    summary: clip(d.summary || "", 60),
    stickers: stickers,
    tags: tags
  };
}

function chat(messages, options) {
  const info = currentProvider();
  const cfg = info.cfg;
  const provider = info.provider;
  const model = cfg.models[cfg.provider] || provider.models[0];
  const opts = options || {};

  if (isProxyMode(cfg)) {
    const baseUrl = getProxyBaseUrl(cfg);
    if (!baseUrl) {
      return Promise.reject(new Error(L("请先填写后端代理地址", "Add your backend proxy URL first.")));
    }
    if (!isProxySupported(cfg.provider)) {
      return Promise.reject(new Error(L(
        "后端代理暂不支持 " + provider.name + "，请切换智谱 GLM / DeepSeek / 通义千问 / Kimi",
        "Backend proxy does not support " + provider.name + ". Switch to Zhipu / DeepSeek / Qwen / Kimi."
      )));
    }
    return proxyRequest(baseUrl + "/api/chat", {
      provider: cfg.provider,
      model: model,
      temperature: typeof opts.temperature === "number" ? opts.temperature : 0.7,
      max_tokens: opts.max_tokens || 800,
      messages: messages
    }, 30000).then(pickContent);
  }

  const key = cfg.keys[cfg.provider];
  if (!key) return Promise.reject(new Error(L("请先填写 " + provider.name + " 的 API Key", "Add your " + provider.name + " API key first.")));

  if (provider.api === "anthropic") {
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
    const userMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

    const body = {
      model: model,
      max_tokens: opts.max_tokens || 1000,
      temperature: typeof opts.temperature === "number" ? opts.temperature : 0.7,
      messages: userMessages
    };
    if (system) body.system = system;

    return anthropicRequest(provider.chatUrl, body, key).then(extractAnthropic);
  }

  return request(provider.chatUrl, {
    model: model,
    temperature: typeof opts.temperature === "number" ? opts.temperature : 0.7,
    max_tokens: opts.max_tokens || 800,
    messages: messages
  }, 30000, key).then(pickContent);
}

function writeBase64Image(base64) {
  return new Promise((resolve, reject) => {
    const filePath = wx.env.USER_DATA_PATH + "/ai-image-" + Date.now() + ".png";
    wx.getFileSystemManager().writeFile({
      filePath: filePath,
      data: base64,
      encoding: "base64",
      success: () => resolve(filePath),
      fail: reject
    });
  });
}

function generateImage(prompt, size) {
  const active = getActiveImageProvider();
  const provider = active.provider;

  if (isProxyMode(active.cfg)) {
    const baseUrl = getProxyBaseUrl(active.cfg);
    if (!baseUrl) {
      return Promise.reject(new Error(L("请先填写后端代理地址", "Add your backend proxy URL first.")));
    }
    const proxyModel = active.cfg.imageModels.zhipu || PROVIDERS.zhipu.imageModels[0];
    return proxyRequest(baseUrl + "/api/image", {
      model: proxyModel,
      prompt: String(prompt).slice(0, 300),
      size: size || "1024x1024"
    }, 60000).then((res) => {
      const item = res && res.data && res.data[0];
      if (!item) throw new Error(L("模型没有返回图片", "The model returned no image."));
      if (item.url) return item.url;
      if (item.b64_json) return writeBase64Image(item.b64_json);
      throw new Error(L("模型没有返回图片", "The model returned no image."));
    });
  }

  const key = (active.cfg.keys[active.key] || "").trim();

  if (!key) {
    return Promise.reject(new Error(L(
      "请先在「我的 → AI 模型设置」填写智谱 GLM 或 OpenAI 的 API Key",
      "Add a Zhipu GLM or OpenAI API key in Me → AI Model Settings first."
    )));
  }
  if (!provider.supportsImage) {
    return Promise.reject(new Error(L(
      provider.name + " 不支持生图，请配置智谱 GLM 或 OpenAI",
      provider.name + " cannot generate images. Configure Zhipu GLM or OpenAI."
    )));
  }

  const model = active.cfg.imageModels[active.key] || provider.imageModels[0];

  return request(provider.imageUrl, {
    model: model,
    prompt: String(prompt).slice(0, 300),
    size: size || "1024x1024"
  }, 60000, key).then((res) => {
    const item = res && res.data && res.data[0];
    if (!item) throw new Error(L("模型没有返回图片", "The model returned no image."));
    if (item.url) return item.url;
    if (item.b64_json) return writeBase64Image(item.b64_json);
    throw new Error(L("模型没有返回图片", "The model returned no image."));
  });
}

function analyzeDream(text) {
  return chat([
    { role: "system", content: analysisPrompt() },
    { role: "user", content: String(text).slice(0, 800) }
  ], { max_tokens: 700 }).then((content) => {
    const data = parseLoose(content);
    if (!data) throw new Error(L("模型返回格式异常，请重试", "The model returned an unexpected format. Please retry."));
    return normalize(data);
  });
}

function interpretDream(dream) {
  const dreamData = dream || {};
  const en = isEn();
  const stickers = (dreamData.stickers || []).map((s) => s.name).join(en ? ", " : "、");

  const userContent = en
    ? [
      "Dream: " + (dreamData.desc || dreamData.descEn || "(no description)"),
      "Motifs: " + (stickers || "none"),
      "Title: " + (dreamData.title || dreamData.titleEn || "none")
    ].join("\n")
    : [
      "梦境描述：" + (dreamData.desc || "（无文字描述）"),
      "意象：" + (stickers || "无"),
      "标题：" + (dreamData.title || "无")
    ].join("\n");

  return chat([
    {
      role: "system",
      content: en
        ? "You are a gentle dream interpretation assistant. Write 70-110 words in English about this dream's imagery and emotions. Keep a warm tone, never give a medical diagnosis, and end with one small practical suggestion. Output the body text only."
        : "你是温和的梦境解读助手。用中文写一段 80-120 字的解读，从意象和情绪角度展开，语气温和，不做医学诊断，最后给一句轻量的行动建议。只输出正文。"
    },
    { role: "user", content: userContent }
  ], { temperature: 0.8, max_tokens: 500 });
}

function monthlySummary(dreams) {
  const list = dreams || [];
  const en = isEn();
  const counts = {};
  let stickerTotal = 0;
  let generatedTotal = 0;

  list.forEach((d) => {
    (d.stickers || []).forEach((s) => {
      const name = String((s && s.name) || "").trim();
      if (!name) return;
      counts[name] = (counts[name] || 0) + 1;
      stickerTotal++;
      if (s.src) generatedTotal++;
    });
  });

  const topStickers = Object.keys(counts)
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, 8)
    .map((n) => n + "×" + counts[n])
    .join(en ? ", " : "、");

  const brief = list.slice(0, 12).map((d) => {
    const tags = (d.tags || []).join(en ? ", " : "、");
    const stickers = (d.stickers || []).map((s) => s.name).filter(Boolean).join(en ? ", " : "、");
    return [
      en ? (d.dateEn || d.date) : d.date,
      en ? (d.titleEn || d.title) : d.title,
      en ? (d.descEn || d.desc) : d.desc || "",
      stickers ? (en ? "Stickers: " : "贴纸：") + stickers : "",
      tags.length ? (en ? "Tags: " : "标签：") + tags : ""
    ].filter(Boolean).join(en ? " | " : "｜");
  }).join("\n");

  const userContent = en
    ? [
      "Dreams: " + list.length,
      "Sticker uses: " + stickerTotal + (generatedTotal ? ", including " + generatedTotal + " AI-made stickers" : ""),
      "Top motifs: " + (topStickers || "none"),
      "Dream details:",
      brief || "none"
    ].join("\n")
    : [
      "梦境数量：" + list.length + " 场",
      "贴纸使用：" + stickerTotal + " 次" + (generatedTotal ? "，其中 AI 生成贴纸 " + generatedTotal + " 张" : ""),
      "高频贴纸：" + (topStickers || "暂无"),
      "梦境明细：",
      brief || "暂无"
    ].join("\n");

  return chat([
    {
      role: "system",
      content: en
        ? "You are a dream analysis assistant. Based on the user's dream records and sticker usage, write a 100-140 word English monthly summary: point out the most frequent motifs and the emotions they may reflect, summarize the emotional trend, and end with a gentle reminder. Output the body text only."
        : "你是梦境分析助手。结合用户的梦境记录和贴纸使用情况，写一段 120-160 字的中文月度总结：先点出高频出现的意象贴纸及可能对应的情绪，再概括整体情绪走向，最后给一句温柔的提醒。只输出正文。"
    },
    { role: "user", content: userContent }
  ], { temperature: 0.8, max_tokens: 700 });
}

function testConnection() {
  return chat([
    { role: "user", content: L("请只回复两个字：正常", "Reply with exactly one word: OK") }
  ], { max_tokens: 30, temperature: 0 }).then((text) => text.trim());
}

/**
 * 语音转文字（使用已配置的智谱 GLM 转写）
 * 将录音文件转 Base64 后由多模态音频模型进行转文字解析
 * @param {string} tempAudioPath
 * @returns {Promise<string>}
 */
function transcribeAudio(tempAudioPath) {
  return new Promise((resolve, reject) => {
    const cfg = getConfig();
    const key = (cfg.keys.zhipu || cfg.keys[cfg.provider] || "").trim();
    if (!key) {
      return reject(new Error(L("未配置 API Key，无法使用语音转写", "API Key is required for voice transcription.")));
    }
    if (!tempAudioPath) {
      return reject(new Error(L("未获取到音频文件", "Audio file not found.")));
    }

    const fs = wx.getFileSystemManager();
    fs.readFile({
      filePath: tempAudioPath,
      encoding: "base64",
      success: (fileRes) => {
        const base64Audio = fileRes.data;
        if (!base64Audio) {
          return reject(new Error(L("音频读取为空", "Audio data is empty.")));
        }

        let format = "mp3";
        if (tempAudioPath.endsWith(".aac")) format = "aac";
        else if (tempAudioPath.endsWith(".wav")) format = "wav";

        wx.request({
          url: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
          method: "POST",
          timeout: 40000,
          header: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + key
          },
          data: {
            model: "glm-4-voice",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "请将这段音频中的内容准确转写为文字，不要添加任何解释、标点纠正或多余说明，只输出听到的文字本身："
                  },
                  {
                    type: "input_audio",
                    input_audio: {
                      data: base64Audio,
                      format: format
                    }
                  }
                ]
              }
            ]
          },
          success: (apiRes) => {
            const choice = apiRes.data && apiRes.data.choices && apiRes.data.choices[0];
            const text = choice && choice.message ? String(choice.message.content || "").trim() : "";
            if (text) {
              resolve(text);
            } else if (apiRes.data && apiRes.data.error) {
              reject(new Error(apiRes.data.error.message || L("智谱语音转写接口报错", "Zhipu voice transcription error.")));
            } else {
              reject(new Error(L("未能识别到语音文字", "No speech recognized.")));
            }
          },
          fail: (err) => {
            reject(new Error(formatFail(err)));
          }
        });
      },
      fail: (readErr) => {
        reject(new Error(readErr.errMsg || L("读取音频文件失败", "Failed to read audio file.")));
      }
    });
  });
}

module.exports = {
  getConfig,
  saveConfig,
  getProviders,
  hasKey,
  hasImageKey,
  getActiveImageProvider,
  isProxySupported,
  chat,
  analyzeDream,
  interpretDream,
  monthlySummary,
  generateImage,
  testConnection,
  transcribeAudio
};
