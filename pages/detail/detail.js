const app = getApp();
const ai = require("../../utils/ai");
const i18n = require("../../utils/i18n");
const fileStore = require("../../utils/fileStore");
let audioContext = null;

Page({
  data: {
    dream: {},
    miniStickers: [],
    isPlaying: false,
    aiReading: "",
    readingLoading: false
  },

  onLoad(options) {
    const id = options.id || "d1";
    const list = wx.getStorageSync("dreamscope_dreams") || app.globalData.defaultDreams;
    const target = list.find((d) => d.id === id) || list[0] || {};
    this.setData({
      dream: target,
      miniStickers: (target.stickers || []).slice(0, 3)
    });
    i18n.initPage(this, "nav_detail");

    audioContext = wx.createInnerAudioContext();
    audioContext.onPlay(() => {
      this.setData({ isPlaying: true });
    });
    audioContext.onEnded(() => {
      this.setData({ isPlaying: false });
    });
    audioContext.onStop(() => {
      this.setData({ isPlaying: false });
    });
    audioContext.onError(() => {
      const isEn = i18n.getLang() === "en";
      this.setData({ isPlaying: false });
      wx.showToast({ title: isEn ? "Audio playback failed" : "播放音频失败", icon: "none" });
    });
  },

  onUnload() {
    if (audioContext) {
      try {
        audioContext.stop();
        audioContext.destroy();
      } catch (e) {}
      audioContext = null;
    }
  },

  onShow() {
    i18n.initPage(this, "nav_detail");
  },

  goBack() {
    wx.navigateBack();
  },

  generateReading() {
    const isEn = i18n.getLang() === "en";
    if (this.data.readingLoading) return;
    if (!ai.hasKey()) {
      wx.showModal({
        title: isEn ? "API Key Needed" : "还没有填写 API Key",
        content: isEn ? "Please configure your AI model API key in Settings first." : "请先到「我的 → AI 模型设置」填写 API Key。",
        confirmText: isEn ? "Settings" : "去设置",
        success: (res) => {
          if (res.confirm) wx.switchTab({ url: "/pages/settings/settings" });
        }
      });
      return;
    }
    if (!this.data.dream || !this.data.dream.desc) {
      wx.showToast({ title: isEn ? "No text description for this dream" : "这个梦境还没有文字描述", icon: "none" });
      return;
    }

    this.setData({ readingLoading: true });
    ai.interpretDream(this.data.dream).then((text) => {
      this.setData({ readingLoading: false, aiReading: text });
    }).catch((err) => {
      this.setData({ readingLoading: false });
      wx.showToast({ title: err.message || (isEn ? "Interpretation failed" : "解读失败"), icon: "none" });
    });
  },

  openGraph(e) {
    const ds = (e && e.currentTarget && e.currentTarget.dataset) || {};
    const fallback = this.data.miniStickers[0] ? this.data.miniStickers[0].name : "";
    app.globalData.graphFocus = ds.name || fallback || "";
    wx.switchTab({ url: "/pages/graph/graph" });
  },

  saveArchive() {
    const isEn = i18n.getLang() === "en";
    const d = this.data.dream || {};
    if (!d.id) return;
    const sep = isEn ? ", " : "、";
    const lines = [
      d.title || "",
      (isEn ? d.dateEn : d.date) || d.date || "",
      d.desc || "",
      (d.stickers || []).map((s) => s.name).filter(Boolean).join(sep)
    ].filter(Boolean);
    wx.setClipboardData({
      data: lines.join("\n"),
      success() {
        wx.showToast({ title: isEn ? "Archive copied" : "档案已复制", icon: "success" });
      }
    });
  },

  deleteCurrentDream() {
    const isEn = i18n.getLang() === "en";
    const dream = this.data.dream || {};
    const id = dream.id;
    // 英文界面用英文标题，避免确认框里出现中文
    const rawTitle = isEn ? (dream.titleEn || dream.title) : (dream.title || dream.titleEn);
    // 英文界面下，若标题仍是中文（旧记录/未翻译），就退回通用文案
    const safeTitle = (isEn && /[\u4e00-\u9fa5]/.test(rawTitle)) ? "" : rawTitle;
    const title = safeTitle || (isEn ? "This dream" : "这篇梦境");
    if (!id) return;

    wx.showModal({
      title: isEn ? "Delete Dream Archive" : "删除梦境档案",
      content: isEn ? `Are you sure you want to permanently delete "${title}"?` : "确定要永久删除梦境「" + title + "」吗？",
      confirmColor: "#FF3B30",
      confirmText: isEn ? "Delete" : "删除",
      cancelText: isEn ? "Cancel" : "取消",
      success: (res) => {
        if (res.confirm) {
          const current = wx.getStorageSync("dreamscope_dreams") || app.globalData.defaultDreams;
          const target = current.find((d) => d.id === id) || null;
          const list = current.filter((d) => d.id !== id);
          wx.setStorageSync("dreamscope_dreams", list);
          if (target) fileStore.removeDreamFiles(target);
          wx.showToast({ title: isEn ? "Deleted" : "已删除", icon: "success" });
          setTimeout(() => {
            wx.navigateBack({ fail: () => wx.switchTab({ url: "/pages/timeline/timeline" }) });
          }, 600);
        }
      }
    });
  },

  playAudio() {
    const isEn = i18n.getLang() === "en";
    if (!this.data.dream.audioUrl) {
      wx.showToast({ title: isEn ? "Demo has no audio. Record your own to try!" : "演示数据暂无原声，请自己录音一条体验！", icon: "none" });
      return;
    }
    if (this.data.isPlaying) {
      audioContext.stop();
    } else {
      audioContext.src = this.data.dream.audioUrl;
      audioContext.play();
    }
  }
});
