const https = require("https");

const API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const MODEL = process.env.ZHIPU_MODEL || "glm-4-flash";
const CATS = ["action", "item", "location", "emotion"];

const SYSTEM_PROMPT = [
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

function postJSON(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, headers)
    }, (res) => {
      let raw = "";
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => {
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch (e) {}
        if (!parsed) return reject(new Error("接口返回非 JSON: " + raw.slice(0, 120)));
        if (parsed.error) return reject(new Error(parsed.error.message || "接口返回错误"));
        resolve(parsed);
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => req.destroy(new Error("请求超时")));
    req.write(JSON.stringify(body));
    req.end();
  });
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

function normalize(d) {
  const stickers = (Array.isArray(d.stickers) ? d.stickers : []).slice(0, 5)
    .map((s) => ({
      name: String((s && s.name) || "").slice(0, 16),
      cat: CATS.indexOf(s && s.cat) >= 0 ? s.cat : "item"
    }))
    .filter((s) => s.name);

  const tags = (Array.isArray(d.tags) ? d.tags : []).slice(0, 6)
    .map((t) => String(t).slice(0, 12))
    .filter(Boolean);

  return {
    title: String(d.title || "").slice(0, 16),
    emoji: String(d.emoji || "✨").slice(0, 4),
    emotion: String(d.emotion || "").slice(0, 8),
    summary: String(d.summary || "").slice(0, 60),
    stickers: stickers,
    tags: tags
  };
}

exports.main = async (event) => {
  const text = String(event.text || "").trim().slice(0, 800);
  if (!text) return { ok: false, error: "empty_text" };

  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) return { ok: false, error: "missing_env_ZHIPU_API_KEY" };

  try {
    const res = await postJSON(
      API_URL,
      { Authorization: "Bearer " + apiKey },
      {
        model: MODEL,
        temperature: 0.7,
        max_tokens: 600,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text }
        ]
      }
    );

    const content = res.choices && res.choices[0] && res.choices[0].message
      ? res.choices[0].message.content
      : "";

    const data = parseLoose(content);
    if (!data) return { ok: false, error: "invalid_json", raw: String(content).slice(0, 200) };

    return { ok: true, data: normalize(data) };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
};
