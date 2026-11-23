const app = getApp();
const ai = require("../../utils/ai");
const stickerStore = require("../../utils/stickers");
const i18n = require("../../utils/i18n");
const canvasImage = require("../../utils/canvasImage");
let doodleCtx = null;
let lastX = 0;
let lastY = 0;

Page({
  data: {
    activeTab: "db",
    aiPrompt: "一只戴礼帽的橘猫在彩色云朵上游动",
    isGenerating: false,
    aiImages: [
      "/assets/ai/1.png",
      "/assets/ai/2.png",
      "/assets/ai/3.png",
      "/assets/ai/4.png",
      "/assets/ai/ai_rainbow_slide.png",
      "/assets/ai/ai_deep_sea.png",
      "/assets/ai/ai_abandoned_school.png"
    ],
    selectedAiImg: "/assets/ai/1.png",
    curColor: "#1A1A1A",
    categories: [
      { key: "all", name: "全部" },
      { key: "action", name: "🏃 动作" },
      { key: "item", name: "📦 物品" },
      { key: "location", name: "📍 地点" },
      { key: "emotion", name: "🔮 情绪" }
    ],
    selectedCat: "all",
    stickers: [],
    filteredStickers: [],
    stickerName: "",
    catOptions: ["动作", "物品", "地点", "情绪"],
    stickerCatIndex: 0,
    collageMode: "move",
    collageColor: "#1A1A1A",
    collageStickers: []
  },

  onLoad() {
    const list = stickerStore.getAllStickers();
    this.setData({
      stickers: list,
      filteredStickers: list,
      collageStickers: this.toCollageStrip(list)
    });
  },

  onShow() {
    const info = i18n.initPage(this, "nav_workshop");
    const t = info.t;
    const isEn = info.lang === "en";
    const list = stickerStore.getAllStickers();
    const cat = this.data.selectedCat;
    const categories = [
      { key: "all", name: t.ws_cat_all || (isEn ? "All" : "全部") },
      { key: "action", name: t.ws_cat_action || (isEn ? "🏃 Action" : "🏃 动作") },
      { key: "item", name: t.ws_cat_item || (isEn ? "📦 Item" : "📦 物品") },
      { key: "location", name: t.ws_cat_location || (isEn ? "📍 Location" : "📍 地点") },
      { key: "emotion", name: t.ws_cat_emotion || (isEn ? "🔮 Emotion" : "🔮 情绪") }
    ];
    const catOptions = isEn
      ? ["Action", "Item", "Location", "Emotion"]
      : ["动作", "物品", "地点", "情绪"];

    // 提示词默认值跟随语言，避免英文界面里出现一整句中文
    const promptZh = "一只戴礼帽的橘猫在彩色云朵上游动";
    const promptEn = "An orange cat in a top hat drifting over pastel clouds";
    const aiPrompt = (!this.data.aiPrompt || this.data.aiPrompt === promptZh || this.data.aiPrompt === promptEn)
      ? (isEn ? promptEn : promptZh)
      : this.data.aiPrompt;

    this.setData({
      categories: categories,
      catOptions: catOptions,
      aiPrompt: aiPrompt,
      stickers: list,
      filteredStickers: cat === "all" ? list : list.filter((s) => s.cat === cat),
      collageStickers: this.toCollageStrip(list)
    });

    const tab = app.globalData.workshopTab;
    if (tab) {
      app.globalData.workshopTab = "";
      this.setData({ activeTab: tab }, () => {
        if (tab === "doodle") setTimeout(() => this.initDoodleCanvas(), 100);
        if (tab === "collage") setTimeout(() => this.initCollageCanvas(), 100);
      });
    }
  },

  onReady() {
    this.initDoodleCanvas();
  },

  initDoodleCanvas() {
    const query = wx.createSelectorQuery();
    query.select("#doodleCanvas")
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext("2d");
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, res[0].width, res[0].height);
        this.canvasNode = canvas;
        doodleCtx = ctx;
      });
  },

  toCollageStrip(list) {
    return (list || []).map((s) => ({ key: "lib-" + s.id, name: s.name, src: s.src }));
  },

  initCollageCanvas() {
    const query = wx.createSelectorQuery();
    query.select("#collageCanvas")
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext("2d");
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        this.collageCanvas = canvas;
        this.collageCtx = ctx;
        this.collageWidth = res[0].width;
        this.collageHeight = res[0].height;
        this.collageImages = {};
        if (!this.collageItems) this.collageItems = [];
        if (!this.collageStrokes) this.collageStrokes = [];
        this.currentStroke = null;
        this.dragItem = null;

        Promise.all(this.collageItems.map((it) => this.ensureCollageImage(it.src)))
          .then(() => this.drawCollage());
        this.drawCollage();
      });
  },

  ensureCollageImage(src) {
    if (!src || !this.collageCanvas) return Promise.resolve(null);
    if (this.collageImages[src]) return Promise.resolve(this.collageImages[src]);

    return canvasImage.load(this.collageCanvas, src).then((img) => {
      if (img) this.collageImages[src] = img;
      return img;
    });
  },

  addStickerToCanvas(e) {
    const src = e.currentTarget.dataset.src;
    const name = e.currentTarget.dataset.name;
    this.addCollageSticker(src, name, 0);
  },

  addCollageSticker(src, name, retry) {
    const isEn = i18n.getLang() === "en";
    if (!this.collageCanvas) {
      if (retry === 0) this.initCollageCanvas();
      if (retry < 6) {
        setTimeout(() => this.addCollageSticker(src, name, retry + 1), 200);
      } else {
        wx.showToast({ title: isEn ? "Canvas not ready — tap again" : "画布还没准备好，再点一次", icon: "none" });
      }
      return;
    }

    this.ensureCollageImage(src).then((img) => {
      if (!img) {
        wx.showToast({ title: isEn ? "Failed to load sticker image" : "贴纸图片加载失败", icon: "none" });
        return;
      }
      const size = Math.round(Math.min(this.collageWidth, this.collageHeight) * 0.3);
      const offset = (this.collageItems.length % 5) * 26;
      this.collageItems.push({
        src: src,
        name: name,
        x: Math.round((this.collageWidth - size) / 2) + offset - 52,
        y: Math.round((this.collageHeight - size) / 2) + offset - 52,
        size: size
      });
      this.drawCollage();
    });
  },

  drawCollage() {
    const ctx = this.collageCtx;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.collageWidth, this.collageHeight);
    ctx.fillStyle = "#FFFDF8";
    ctx.fillRect(0, 0, this.collageWidth, this.collageHeight);

    this.collageItems.forEach((item) => {
      const img = this.collageImages[item.src];
      if (img) ctx.drawImage(img, item.x, item.y, item.size, item.size);
    });

    this.collageStrokes.forEach((stroke) => this.drawCollageStroke(stroke));
    if (this.currentStroke) this.drawCollageStroke(this.currentStroke);
  },

  drawCollageStroke(stroke) {
    const pts = stroke.points || [];
    if (!pts.length) return;
    const ctx = this.collageCtx;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    if (pts.length === 1) ctx.lineTo(pts[0].x + 0.1, pts[0].y + 0.1);
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  },

  collageTouchStart(e) {
    if (!this.collageCtx) return;
    const t = e.touches[0];

    if (this.data.collageMode === "draw") {
      this.currentStroke = {
        color: this.data.collageColor,
        width: 6,
        points: [{ x: t.x, y: t.y }]
      };
      return;
    }

    for (let i = this.collageItems.length - 1; i >= 0; i--) {
      const it = this.collageItems[i];
      if (t.x >= it.x && t.x <= it.x + it.size && t.y >= it.y && t.y <= it.y + it.size) {
        this.dragItem = it;
        this.dragOffset = { x: t.x - it.x, y: t.y - it.y };
        this.collageItems.splice(i, 1);
        this.collageItems.push(it);
        this.drawCollage();
        break;
      }
    }
  },

  collageTouchMove(e) {
    if (!this.collageCtx) return;
    const t = e.touches[0];

    if (this.data.collageMode === "draw" && this.currentStroke) {
      this.currentStroke.points.push({ x: t.x, y: t.y });
      this.drawCollage();
      return;
    }

    if (this.dragItem) {
      this.dragItem.x = t.x - this.dragOffset.x;
      this.dragItem.y = t.y - this.dragOffset.y;
      this.drawCollage();
    }
  },

  collageTouchEnd() {
    if (this.currentStroke) {
      if (this.currentStroke.points.length > 1) this.collageStrokes.push(this.currentStroke);
      this.currentStroke = null;
      this.drawCollage();
    }
    this.dragItem = null;
  },

  setCollageMode(e) {
    this.setData({ collageMode: e.currentTarget.dataset.mode });
  },

  setCollageColor(e) {
    this.setData({ collageColor: e.currentTarget.dataset.color });
  },

  clearCollage() {
    const isEn = i18n.getLang() === "en";
    this.collageItems = [];
    this.collageStrokes = [];
    this.currentStroke = null;
    this.dragItem = null;
    this.drawCollage();
    wx.showToast({ title: isEn ? "Canvas cleared" : "画布已清空", icon: "none" });
  },

  saveCollage() {
    const isEn = i18n.getLang() === "en";
    if (!this.collageCanvas) {
      wx.showToast({ title: isEn ? "Canvas not ready" : "画布还没准备好", icon: "none" });
      return;
    }
    if (!this.collageItems.length && !this.collageStrokes.length) {
      wx.showToast({ title: isEn ? "Canvas is still empty" : "画布还是空的", icon: "none" });
      return;
    }

    wx.showLoading({ title: isEn ? "Saving..." : "保存中", mask: true });
    wx.canvasToTempFilePath({
      canvas: this.collageCanvas,
      success: (res) => {
        stickerStore.persistImage(res.tempFilePath).then((savedPath) => {
          const id = "my-" + Date.now();
          const name = isEn ? "Collage Work" : "拼贴作品";
          const item = { key: "lib-" + id, name: name, nameEn: "Collage Work", cat: "item", src: savedPath };
          stickerStore.addMySticker({ id: id, name: name, nameEn: "Collage Work", cat: "item", src: savedPath });
          this.setData({
            stickers: [item].concat(this.data.stickers),
            filteredStickers: [item].concat(this.data.filteredStickers),
            collageStickers: [item].concat(this.data.collageStickers)
          });
          wx.hideLoading();
          wx.showToast({ title: isEn ? "Saved to Sticker Library" : "作品已存入贴纸库", icon: "success" });
        }).catch(() => {
          wx.hideLoading();
          wx.showToast({ title: isEn ? "Save failed" : "保存失败", icon: "none" });
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: isEn ? "Save failed" : "保存失败", icon: "none" });
      }
    });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab }, () => {
      if (tab === "doodle" && !doodleCtx) {
        setTimeout(() => this.initDoodleCanvas(), 100);
      }
      if (tab === "collage") {
        setTimeout(() => this.initCollageCanvas(), 100);
      }
    });
  },

  onPromptInput(e) {
    this.setData({ aiPrompt: e.detail.value });
  },

  onStickerNameInput(e) {
    this.setData({ stickerName: e.detail.value });
  },

  onCatChange(e) {
    this.setData({ stickerCatIndex: Number(e.detail.value) });
  },

  saveAiToLibrary() {
    const isEn = i18n.getLang() === "en";
    if (!this.data.selectedAiImg) {
      wx.showToast({ title: isEn ? "Select an artwork first" : "请先选中一张插画", icon: "none" });
      return;
    }
    const img = this.data.selectedAiImg;
    const name = (this.data.aiPrompt.trim().slice(0, isEn ? 16 : 6)) || (isEn ? "AI Spark" : "AI灵感");
    wx.showLoading({ title: isEn ? "Saving to library..." : "正在存入贴纸库..." });

    stickerStore.persistImage(img).then((savedPath) => {
      const id = "ai-" + Date.now();
      const newSticker = { id: id, name: name, nameEn: name, cat: "item", catName: isEn ? "Item" : "物品", src: savedPath };
      stickerStore.addMySticker(newSticker);
      const list = stickerStore.getAllStickers();
      this.setData({
        stickers: list,
        filteredStickers: list,
        collageStickers: this.toCollageStrip(list),
        activeTab: "db"
      });
      wx.hideLoading();
      wx.showToast({ title: isEn ? "Saved to Sticker Library!" : "已保存到贴纸库！", icon: "success" });
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({ title: isEn ? "Save failed" : "保存失败", icon: "none" });
    });
  },

  generateAi() {
    const isEn = i18n.getLang() === "en";
    const prompt = this.data.aiPrompt.trim();
    if (!prompt) {
      wx.showToast({ title: isEn ? "Enter a prompt first" : "请输入描述词", icon: "none" });
      return;
    }
    if (this.data.isGenerating) return;
    if (!ai.hasImageKey()) {
      wx.showModal({
        title: isEn ? "Image model required" : "需要生图大模型密钥",
        content: isEn
          ? "AI painting needs an image model. Add a Zhipu GLM (recommended) or OpenAI API key in Me → AI Model Settings."
          : "AI 绘制插画需要生图大模型，请先到「我的 → AI 模型设置」配置智谱 GLM（推荐）或 OpenAI 的 API Key。",
        confirmText: isEn ? "Settings" : "去设置",
        success: (res) => {
          if (res.confirm) wx.switchTab({ url: "/pages/settings/settings" });
        }
      });
      return;
    }

    this.setData({ isGenerating: true });
    wx.showLoading({ title: isEn ? "AI painting..." : "AI 绘制中", mask: true });

    ai.generateImage(prompt).then((url) => {
      return new Promise((resolve, reject) => {
        wx.getImageInfo({ src: url, success: resolve, fail: reject });
      });
    }).then((res) => {
      wx.hideLoading();
      this.setData({
        isGenerating: false,
        aiImages: [res.path, ...this.data.aiImages],
        selectedAiImg: res.path
      });
      wx.showToast({ title: isEn ? "Artwork generated" : "插画已生成", icon: "success" });
    }).catch((err) => {
      wx.hideLoading();
      this.setData({ isGenerating: false });
      wx.showModal({
        title: isEn ? "Generation failed" : "生成失败",
        content: (err && err.message) || (isEn ? "Check your API key and network, then retry." : "请检查 API Key 与网络后重试"),
        showCancel: false
      });
    });
  },

  uploadCustomImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const filePath = res.tempFiles[0].tempFilePath;
        const currentList = [filePath, ...this.data.aiImages];
        this.setData({
          aiImages: currentList,
          selectedAiImg: filePath
        });
        wx.showToast({ title: i18n.getLang() === "en" ? "Image added" : "图片已添加！", icon: "success" });
      }
    });
  },

  selectAiImg(e) {
    const img = e.currentTarget.dataset.img;
    this.setData({ selectedAiImg: img });
    wx.previewImage({
      urls: [img],
      current: img
    });
  },

  selectCategory(e) {
    const cat = e.currentTarget.dataset.cat;
    let list = this.data.stickers;
    if (cat !== "all") {
      list = list.filter(s => s.cat === cat);
    }
    this.setData({
      selectedCat: cat,
      filteredStickers: list
    });
  },

  previewSticker(e) {
    const item = e.currentTarget.dataset.item;
    const isEn = i18n.getLang() === "en";
    wx.showActionSheet({
      itemList: isEn ? ["Use in Collage Canvas", "Copy Sticker Name"] : ["在拼贴画板中使用", "复制贴纸名称"],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.setData({ activeTab: "collage" }, () => {
            setTimeout(() => {
              this.addStickerToCanvas({ currentTarget: { dataset: { src: item.src, name: item.name } } });
            }, 250);
          });
        } else if (res.tapIndex === 1) {
          wx.setClipboardData({ data: item.name });
        }
      }
    });
  },

  setColor(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({ curColor: color });
  },

  touchStart(e) {
    if (!doodleCtx) return;
    const touch = e.touches[0];
    lastX = touch.x;
    lastY = touch.y;
    doodleCtx.beginPath();
    doodleCtx.moveTo(lastX, lastY);
    doodleCtx.strokeStyle = this.data.curColor;
    doodleCtx.lineWidth = 4;
    doodleCtx.lineCap = "round";
    doodleCtx.lineJoin = "round";
  },

  touchMove(e) {
    if (!doodleCtx) return;
    const touch = e.touches[0];
    doodleCtx.lineTo(touch.x, touch.y);
    doodleCtx.stroke();
    lastX = touch.x;
    lastY = touch.y;
  },

  clearCanvas() {
    if (!doodleCtx || !this.canvasNode) return;
    doodleCtx.fillStyle = "#FFFFFF";
    doodleCtx.fillRect(0, 0, this.canvasNode.width, this.canvasNode.height);
    wx.showToast({ title: i18n.getLang() === "en" ? "Canvas cleared" : "画布已清空", icon: "none" });
  },

  saveDoodle() {
    const isEn = i18n.getLang() === "en";
    if (!this.canvasNode) return;
    const name = this.data.stickerName.trim() || (isEn ? "Hand-drawn Sticker" : "手绘贴纸");
    const cats = ["action", "item", "location", "emotion"];
    const cat = cats[this.data.stickerCatIndex] || "item";
    const catName = this.data.catOptions[this.data.stickerCatIndex] || (isEn ? "Item" : "物品");

    wx.showLoading({ title: isEn ? "Creating sticker..." : "正在生成贴纸..." });
    wx.canvasToTempFilePath({
      canvas: this.canvasNode,
      success: (res) => {
        stickerStore.persistImage(res.tempFilePath).then((savedPath) => {
          const id = "doodle-" + Date.now();
          const newSticker = { id: id, name: name, nameEn: name, cat: cat, catName: catName, src: savedPath };
          stickerStore.addMySticker(newSticker);
          const list = stickerStore.getAllStickers();
          this.setData({
            stickers: list,
            filteredStickers: list,
            collageStickers: this.toCollageStrip(list),
            stickerName: "",
            activeTab: "db"
          });
          wx.hideLoading();
          wx.showToast({ title: isEn ? "Sticker saved to library!" : "手绘贴纸已存入库！", icon: "success" });
        }).catch(() => {
          wx.hideLoading();
          wx.showToast({ title: isEn ? "Save failed" : "保存失败", icon: "none" });
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: isEn ? "Save failed" : "保存失败", icon: "none" });
      }
    });
  }
});
