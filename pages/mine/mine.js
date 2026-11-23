const app = getApp();
const ai = require("../../utils/ai");
const i18n = require("../../utils/i18n");
const statsUtil = require("../../utils/stats");
const stickerStore = require("../../utils/stickers");

Page({
  data: {
    aiSummary: "",
    summaryLoading: false,
    stats: {
      total: 0,
      myStickers: 0,
      aiCount: 0,
      streak: 0,
      topMotifs: [],
      emotionPct: { anxious: 0, calm: 0, joy: 0, sad: 0 },
      hasEmotion: false
    }
  },

  onShow() {
    i18n.initPage(this, "nav_insights");
    this.refreshStats();
  },

  refreshStats() {
    const dreams = wx.getStorageSync("dreamscope_dreams") || [];
    const stats = statsUtil.compute(dreams, {
      myStickers: stickerStore.getMyStickers().length
    });
    this.setData({ stats: stats });
  },

  generateSummary() {
    const isEn = i18n.getLang() === "en";
    if (this.data.summaryLoading) return;
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

    const dreams = wx.getStorageSync("dreamscope_dreams") || [];
    if (!dreams.length) {
      wx.showToast({ title: isEn ? "No dream records yet" : "还没有梦境记录", icon: "none" });
      return;
    }

    this.setData({ summaryLoading: true });
    ai.monthlySummary(dreams).then((text) => {
      this.setData({ summaryLoading: false, aiSummary: text });
    }).catch((err) => {
      this.setData({ summaryLoading: false });
      wx.showToast({ title: err.message || (isEn ? "Failed to generate" : "生成失败"), icon: "none" });
    });
  },

  exportData() {
    const isEn = i18n.getLang() === "en";
    const dreams = wx.getStorageSync("dreamscope_dreams") || app.globalData.defaultDreams;
    wx.setClipboardData({
      data: JSON.stringify(dreams, null, 2),
      success() {
        wx.showToast({ title: isEn ? "Data copied to clipboard" : "已复制梦境数据到剪贴板", icon: "success" });
      }
    });
  },

  clearLocalCache() {
    const isEn = i18n.getLang() === "en";
    wx.showModal({
      title: isEn ? "Reset Data" : "重置数据",
      content: isEn ? "Reset to initial demo dream data?" : "确定要重置并恢复为默认的梦境示例吗？",
      success(res) {
        if (res.confirm) {
          wx.setStorageSync("dreamscope_dreams", app.globalData.defaultDreams);
          wx.showToast({ title: isEn ? "Reset complete" : "已重置", icon: "success" });
        }
      }
    });
  },

  showAbout() {
    const isEn = i18n.getLang() === "en";
    wx.showModal({
      title: isEn ? "About DreamScope" : "DreamScope 梦境记录",
      content: isEn
        ? "DreamScope: a retro pop & Memphis dream journal with voice capture, speech-to-text, an imagery graph, and AI artwork. All data stays on this device."
        : "复古波普与孟菲斯美学的梦境记录、语音转写、意象图谱与 AI 插画生成助手。数据保存在本机。",
      showCancel: false
    });
  }
});
