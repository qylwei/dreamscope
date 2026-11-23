const app = getApp();
const ai = require("../../utils/ai");
const asr = require("../../utils/asr");
const i18n = require("../../utils/i18n");
const statsUtil = require("../../utils/stats");
const stickerStore = require("../../utils/stickers");

function asrText(ready, isEn) {
  if (ready) {
    return isEn ? "🎙️ Speech-to-text ready · GLM-ASR-2512" : "🎙️ 语音转文字已就绪 · GLM-ASR-2512";
  }
  return isEn
    ? "🎙️ Speech-to-text needs a Zhipu key (30s per clip)"
    : "🎙️ 语音转文字需配置智谱 Key（单段 30 秒内）";
}

Page({
  data: {
    currentLang: "zh",
    t: {},
    providers: [],
    imageProviders: [],
    textProviders: [],
    provider: "zhipu",
    providerName: "智谱 GLM",
    providerDesc: "",
    providerPortal: "",
    apiKey: "",
    aiModel: "",
    imageModel: "",
    textModels: [],
    imageModels: [],
    supportsImage: true,
    keyVisible: false,
    testing: false,
    aiStatus: "",
    hasImageConfigured: false,
    asrReady: false,
    asrStatusText: "",
    stats: { total: 0, myStickers: 0, streak: 0, aiCount: 0 }
  },

  onShow() {
    const info = i18n.initPage(this, "nav_settings");
    const providers = ai.getProviders();
    const cfg = ai.getConfig();
    const provider = providers.find((p) => p.key === cfg.provider) || providers[0];
    const imageList = providers.filter((p) => p.category === "image" || p.supportsImage);
    const textList = providers.filter((p) => p.category === "text" || !p.supportsImage);
    const hasImageKey = ai.hasImageKey();
    const dreams = wx.getStorageSync("dreamscope_dreams") || [];
    const stats = statsUtil.compute(dreams, { myStickers: stickerStore.getMyStickers().length });

    this.setData({
      stats: stats,
      currentLang: info.lang,
      t: info.t,
      providers: providers,
      imageProviders: imageList,
      textProviders: textList,
      provider: provider.key,
      providerName: provider.name,
      providerDesc: provider.desc || "",
      providerPortal: provider.portalUrl || "",
      apiKey: cfg.keys[provider.key] || "",
      aiModel: cfg.models[provider.key] || provider.models[0],
      imageModel: provider.supportsImage
        ? (cfg.imageModels[provider.key] || provider.imageModels[0])
        : "",
      textModels: provider.models,
      imageModels: provider.imageModels || [],
      supportsImage: provider.supportsImage,
      hasImageConfigured: hasImageKey,
      asrReady: asr.hasKey(),
      asrStatusText: asrText(asr.hasKey(), info.lang === "en"),
      aiStatus: cfg.keys[provider.key]
        ? provider.name + (info.lang === "en" ? " · Key saved, ready to test" : " · 已保存 Key，可测试连接") + (provider.supportsImage ? (info.lang === "en" ? " (Image Gen Ready)" : " (支持AI绘图)") : "")
        : provider.name + (info.lang === "en" ? " · Key not configured, fallback enabled" : " · 未填写 Key，AI 功能会退回本地规则")
    });
  },

  changeLang(e) {
    const target = e.currentTarget.dataset.lang;
    if (target === this.data.currentLang) return;
    i18n.setLang(target);
    this.onShow();
    wx.showToast({
      title: target === "en" ? "Switched to English" : "已切换为中文",
      icon: "success"
    });
  },

  onKeyInput(e) {
    this.setData({ apiKey: e.detail.value });
  },

  onModelInput(e) {
    this.setData({ aiModel: e.detail.value });
  },

  onImageModelInput(e) {
    this.setData({ imageModel: e.detail.value });
  },

  toggleKeyVisible() {
    this.setData({ keyVisible: !this.data.keyVisible });
  },

  pickTextModel(e) {
    this.setData({ aiModel: e.currentTarget.dataset.model });
  },

  pickImageModel(e) {
    this.setData({ imageModel: e.currentTarget.dataset.model });
  },

  pickProvider(e) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.provider) return;

    const target = this.data.providers.find((p) => p.key === key);
    if (!target) return;

    this.persistCurrent();
    ai.saveConfig({ provider: key });

    const isEn = i18n.getLang() === "en";
    const cfg = ai.getConfig();
    this.setData({
      provider: key,
      providerName: target.name,
      providerDesc: target.desc || "",
      providerPortal: target.portalUrl || "",
      apiKey: cfg.keys[key] || "",
      aiModel: cfg.models[key] || target.models[0],
      imageModel: target.supportsImage
        ? (cfg.imageModels[key] || target.imageModels[0])
        : "",
      textModels: target.models,
      imageModels: target.imageModels || [],
      supportsImage: target.supportsImage,
      hasImageConfigured: ai.hasImageKey(),
      asrReady: asr.hasKey(),
      asrStatusText: asrText(asr.hasKey(), isEn),
      keyVisible: false,
      aiStatus: cfg.keys[key]
        ? target.name + (isEn ? " · Key saved, ready to test" : " · 已保存 Key，可测试连接") + (target.supportsImage ? (isEn ? " (Image Gen Ready)" : " (支持AI绘图)") : "")
        : target.name + (isEn ? " · Key not configured, fallback enabled" : " · 未填写 Key，AI 功能会退回本地规则")
    });
  },

  persistCurrent() {
    const provider = this.data.provider;
    const patch = {
      keys: {},
      models: {}
    };
    patch.keys[provider] = this.data.apiKey.trim();
    patch.models[provider] = this.data.aiModel.trim() || this.data.textModels[0];
    if (this.data.supportsImage) {
      patch.imageModels = {};
      patch.imageModels[provider] = this.data.imageModel.trim() || this.data.imageModels[0];
    }
    ai.saveConfig(patch);
  },

  saveKey() {
    this.persistCurrent();
    const has = !!this.data.apiKey.trim();
    const isEn = this.data.currentLang === "en";
    this.setData({
      hasImageConfigured: ai.hasImageKey(),
      asrReady: asr.hasKey(),
      asrStatusText: asrText(asr.hasKey(), isEn),
      aiStatus: has
        ? this.data.providerName + (isEn ? " · Key saved, ready to test" : " · 已保存 Key，可测试连接") + (this.data.supportsImage ? (isEn ? " (Image Gen Ready)" : " (支持AI绘图)") : "")
        : this.data.providerName + (isEn ? " · Key cleared, fallback enabled" : " · 已清空 Key，AI 功能会退回本地规则")
    });
    wx.showToast({ title: has ? (isEn ? "Saved" : "已保存") : (isEn ? "Cleared" : "已清空"), icon: "none" });
  },

  clearKey() {
    const isEn = this.data.currentLang === "en";
    const patch = { keys: {} };
    patch.keys[this.data.provider] = "";
    ai.saveConfig(patch);
    this.setData({
      apiKey: "",
      hasImageConfigured: ai.hasImageKey(),
      asrReady: asr.hasKey(),
      asrStatusText: asrText(asr.hasKey(), isEn),
      aiStatus: this.data.providerName + (isEn ? " · Key cleared, fallback enabled" : " · 已清空 Key，AI 功能会退回本地规则")
    });
    wx.showToast({ title: isEn ? "Cleared" : "已清空", icon: "none" });
  },

  testAI() {
    if (this.data.testing) return;
    const isEn = this.data.currentLang === "en";
    if (!this.data.apiKey.trim()) {
      wx.showToast({ title: isEn ? "Please enter API Key first" : "请先填写 API Key", icon: "none" });
      return;
    }
    this.persistCurrent();
    this.setData({ testing: true, aiStatus: (isEn ? "Connecting to " : "正在连接 ") + this.data.providerName + "…" });

    ai.testConnection().then((reply) => {
      const isImg = this.data.supportsImage ? (isEn ? " · Image Model Ready" : " · 绘图模型就绪") : "";
      this.setData({
        testing: false,
        aiStatus: "✅ " + this.data.providerName + (isEn ? " Connected (" : " 连接成功 (") + (reply || (isEn ? "OK" : "正常")) + ")" + isImg
      });
    }).catch((err) => {
      this.setData({
        testing: false,
        aiStatus: (isEn ? "❌ Connection failed: " : "❌ 连接失败：") + (err.message || (isEn ? "Unknown error" : "未知错误"))
      });
    });
  },

  copyPortalUrl() {
    const isEn = i18n.getLang() === "en";
    const url = this.data.providerPortal || "https://open.bigmodel.cn/";
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({ title: isEn ? "Portal URL copied" : "官网地址已复制", icon: "success" });
      }
    });
  },

  noOp() {
    const isEn = i18n.getLang() === "en";
    wx.showToast({ title: isEn ? "Coming soon" : "功能开发中", icon: "none" });
  },

  exportData() {
    const isEn = i18n.getLang() === "en";
    const dreams = wx.getStorageSync("dreamscope_dreams") || app.globalData.defaultDreams;
    wx.setClipboardData({
      data: JSON.stringify(dreams, null, 2),
      success() {
        wx.showToast({ title: isEn ? "Dream data copied" : "已复制梦境数据", icon: "success" });
      }
    });
  },

  showAbout() {
    const isEn = i18n.getLang() === "en";
    wx.showModal({
      title: "DreamScope",
      content: isEn
        ? "Dream journal with a retro pop / Memphis look, v1.0.\nAI features run on your own API key: Zhipu GLM, DeepSeek, Qwen, Kimi, and optionally Claude / Gemini / OpenAI."
        : "复古波普与孟菲斯美学梦境记录 v1.0\nAI 模型由你自行配置的 Key 驱动，支持智谱、DeepSeek、通义千问、Kimi，以及可选的 Claude / Gemini / OpenAI。",
      showCancel: false
    });
  }
});
