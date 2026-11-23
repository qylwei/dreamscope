const app = getApp();
const ai = require("../../utils/ai");
const i18n = require("../../utils/i18n");
const stickerStore = require("../../utils/stickers");
const asr = require("../../utils/asr");
const fileStore = require("../../utils/fileStore");
const canvasImage = require("../../utils/canvasImage");
let audioContext = null;
let dreamCanvasNode = null;
let dreamCtx = null;

Page({
  data: {
    currentLang: "zh",
    t: {},
    isRecording: false,
    recordTimerText: "00:00",
    recordDurationSec: 0,
    tempAudioPath: "",
    isPlayingAudio: false,
    asrReady: true,
    isTranscribing: false,
    canRetryTranscription: false,
    dreamText: "",
    aiDetectedStatus: "",
    emojiList: ["😰", "✨", "🐱", "🌧️", "🧗", "🔮", "🕊️", "🌊"],
    selectedEmoji: "✨",
    newTag: "",
    tags: [],
    pickedStickers: [],
    stickerLib: [],
    libList: [],
    libCats: [
      { key: "all", name: "全部" },
      { key: "action", name: "🏃 动作" },
      { key: "item", name: "📦 物品" },
      { key: "location", name: "📍 地点" },
      { key: "emotion", name: "🔮 情绪" }
    ],
    libCat: "all",
    libVisible: false,
    genPrompt: "",
    genCatOptions: ["动作", "物品", "地点", "情绪"],
    genCatIndex: 0,
    genLoading: false,

    // AI 画面预览与绘卷创作画板
    aiImagePreview: "",
    aiGenPrompt: "",
    isGeneratingAiImage: false,
    showCanvasStudio: false,
    collageMode: "move",       // "move" 或 "draw"
    collageColor: "#1A1A1A",
    canvasWidth: 320,
    canvasHeight: 320
  },

  onLoad() {
    this.initAudioAndRecognizer();
    this.loadStickerLib();
  },

  onShow() {
    const info = i18n.initPage(this, "nav_record");
    const isEn = info.lang === "en";
    this.saving = false;
    this._destroyed = false;
    this._cancelled = false;
    this.setData({
      currentLang: info.lang,
      t: info.t,
      asrReady: asr.hasKey(),
      genCatOptions: isEn ? ["Action", "Item", "Location", "Emotion"] : ["动作", "物品", "地点", "情绪"],
      libCats: [
        { key: "all", name: info.t.ws_cat_all || "全部" },
        { key: "action", name: info.t.ws_cat_action || "🏃 动作" },
        { key: "item", name: info.t.ws_cat_item || "📦 物品" },
        { key: "location", name: info.t.ws_cat_location || "📍 地点" },
        { key: "emotion", name: info.t.ws_cat_emotion || "🔮 情绪" }
      ]
    }, () => this.refreshLib());
  },

  onUnload() {
    this._destroyed = true;
    this.teardownRecognizer(true);
    if (audioContext) {
      try {
        audioContext.stop();
        audioContext.destroy();
      } catch (e) {}
      audioContext = null;
    }
    dreamCanvasNode = null;
    dreamCtx = null;
    this.collageBgImg = null;
    this.collageLoadedImages = {};
    this.canvasItems = [];
    this.canvasStrokes = [];
  },

  onHide() {
    // 切到后台/跳走时立刻停止录音，避免麦克风一直占用
    if (this.data.isRecording) this.stopRecord();
  },

  teardownRecognizer(stopFirst) {
    if (this.recInterval) {
      clearInterval(this.recInterval);
      this.recInterval = null;
    }
    if (!this.recognizer) return;
    if (stopFirst && this.data.isRecording) {
      try { this.recognizer.stop(); } catch (e) {}
    }
    this.recognizer.dispose();
    this.recognizer = null;
  },

  initAudioAndRecognizer() {
    audioContext = wx.createInnerAudioContext();

    audioContext.onPlay(() => { this.setData({ isPlayingAudio: true }); });
    audioContext.onEnded(() => { this.setData({ isPlayingAudio: false }); });
    audioContext.onStop(() => { this.setData({ isPlayingAudio: false }); });
    audioContext.onError(() => {
      const isEn = i18n.getLang() === "en";
      this.setData({ isPlayingAudio: false });
      wx.showToast({ title: isEn ? "Audio playback failed" : "播放音频失败", icon: "none" });
    });

    this.recognizer = asr.createRecorder({
      onStart: () => this.handleRecordStart(),
      onStop: (res) => this.handleRecordStop(res),
      onError: (err) => this.handleRecordError(err)
    });

    this.setData({ asrReady: asr.hasKey() });
  },

  handleRecordStart() {
    const t = this.data.t || {};
    const isEn = i18n.getLang() === "en";
    this.asrBaseText = String(this.data.dreamText || "").trim();
    this.setData({
      isRecording: true,
      canRetryTranscription: false,
      recordDurationSec: 0,
      recordTimerText: "00:00",
      aiDetectedStatus: t.rec_listening || (isEn ? "🎙️ Listening… speak now" : "🎙️ 正在录音，请对着手机说…")
    });
    this.startTimer();
  },

  handleRecordStop(res) {
    if (this.recInterval) {
      clearInterval(this.recInterval);
      this.recInterval = null;
    }
    // 用户点了取消/已经离开页面：不要再发起转写
    if (this._destroyed || this._cancelled) return;
    const isEn = i18n.getLang() === "en";
    const durationSec = Math.max(1, this.data.recordDurationSec || 1);
    const tempFilePath = (res && res.tempFilePath) || "";

    this.setData({
      isRecording: false,
      canRetryTranscription: false,
      tempAudioPath: tempFilePath || this.data.tempAudioPath,
      recordDurationSec: durationSec,
      recordTimerText: this.formatTime(durationSec)
    });

    if (!tempFilePath) {
      this.setData({
        aiDetectedStatus: isEn ? "Recording failed — please try again" : "录音失败，请重试"
      });
      return;
    }

    const token = (this.transcribeToken || 0) + 1;
    this.transcribeToken = token;
    this.setData({
      isTranscribing: true,
      aiDetectedStatus: isEn ? "Saving audio…" : "正在保存录音…"
    });
    fileStore.persistAudio(tempFilePath).then((saved) => {
      if (this._destroyed || this._cancelled || token !== this.transcribeToken) return;
      const audioPath = saved || tempFilePath;
      this.setData({ tempAudioPath: audioPath });

      if (asr.hasKey()) {
        this.transcribeAudio(audioPath, durationSec);
      } else {
        this.setData({
          isTranscribing: false,
          asrReady: false,
          aiDetectedStatus: isEn
            ? "✅ Audio saved · add a Zhipu API key to auto-transcribe"
            : "✅ 录音已保存 · 配置智谱 API Key 后可自动转写"
        });
        wx.showToast({ title: isEn ? "Audio saved" : "录音已保存", icon: "success" });
      }
    });
  },

  transcribeAudio(filePath, durationSec) {
    const isEn = i18n.getLang() === "en";
    const token = (this.transcribeToken || 0) + 1;
    this.transcribeToken = token;
    this.setData({
      isTranscribing: true,
      canRetryTranscription: false,
      aiDetectedStatus: isEn ? "🎧 Transcribing with GLM-ASR…" : "🎧 正在用 GLM-ASR 转写…"
    });

    asr.transcribe(filePath).then((text) => {
      if (this._destroyed || token !== this.transcribeToken) return;
      const clean = String(text || "").trim();
      const merged = clean ? this.joinTranscript(this.asrBaseText, clean) : this.data.dreamText;

      this.setData({ isTranscribing: false, canRetryTranscription: !clean, dreamText: merged });
      if (merged) this.analyzeDreamKeywords(merged, { silent: true });
      this.setData({
        aiDetectedStatus: clean
          ? (isEn
            ? `✅ Transcribed (${durationSec}s) · Edit below if needed`
            : `✅ 转写完成（${durationSec}秒）· 可继续编辑`)
          : (isEn ? "No speech detected — try again" : "没有识别到语音，请重试")
      });
      if (clean) wx.showToast({ title: isEn ? "Transcribed" : "转写完成", icon: "success" });
    }).catch((err) => {
      if (this._destroyed || token !== this.transcribeToken) return;
      const message = this.asrErrorMessage(err, isEn);
      this.setData({
        isTranscribing: false,
        canRetryTranscription: true,
        aiDetectedStatus: "⚠️ " + message
      });
      wx.showModal({
        title: isEn ? "Transcription failed" : "语音转写失败",
        content: message + (isEn ? "\nYou can still type the dream manually." : "\n可以直接手动输入梦境内容。"),
        showCancel: false
      });
    });
  },

  retryTranscription() {
    if (!this.data.tempAudioPath || this.data.isRecording || this.data.isTranscribing) return;
    if (!asr.hasKey()) {
      wx.showToast({
        title: i18n.getLang() === "en" ? "Add a Zhipu API key first" : "请先配置智谱 API Key",
        icon: "none"
      });
      return;
    }
    this.asrBaseText = String(this.data.dreamText || "").trim();
    this.setData({ canRetryTranscription: false });
    this.transcribeAudio(this.data.tempAudioPath, this.data.recordDurationSec);
  },

  asrErrorMessage(err, isEn) {
    const raw = String((err && err.message) || err || "");
    if (raw.indexOf("missing_zhipu_key") >= 0) {
      return isEn ? "Add a Zhipu GLM API key in Settings first." : "请先在「我的 → AI 模型设置」填写智谱 API Key。";
    }
    if (raw.indexOf("missing_audio") >= 0 || raw.indexOf("read_audio_failed") >= 0) {
      return isEn ? "Audio file not found. Please record again." : "没有找到录音文件，请重新录制。";
    }
    if (/401|403|invalid.*(key|token)|unauthorized/i.test(raw)) {
      return isEn ? "API key is invalid or has no GLM-ASR access." : "API Key 无效，或没有开通 GLM-ASR 权限。";
    }
    if (raw.indexOf("timeout") >= 0) {
      return isEn ? "Request timed out. Check your network and retry." : "请求超时，请检查网络后重试。";
    }
    if (/429|rate.?limit/i.test(raw)) {
      return isEn ? "Too many requests. Retry in a moment." : "请求过于频繁，请稍后重试。";
    }
    if (raw.indexOf("domain list") >= 0) {
      return isEn
        ? "Domain not whitelisted. Add open.bigmodel.cn to uploadFile domains."
        : "域名未加入白名单：请把 open.bigmodel.cn 加入 uploadFile 合法域名。";
    }
    return raw || (isEn ? "Unknown transcription error" : "转写失败，请稍后重试");
  },

  handleRecordError(err) {
    if (this.recInterval) {
      clearInterval(this.recInterval);
      this.recInterval = null;
    }
    const t = this.data.t || {};
    const isEn = i18n.getLang() === "en";
    this.setData({
      isRecording: false,
      aiDetectedStatus: t.rec_record_fail || (isEn ? "Recording failed — check microphone permission" : "录音失败，请检查麦克风权限")
    });
  },

  joinTranscript(base, addition) {
    const b = String(base || "").trim();
    const a = String(addition || "").trim();
    if (!b) return a;
    if (!a) return b;
    const sep = i18n.getLang() === "en" ? " " : "";
    return b + sep + a;
  },

  startTimer() {
    let sec = 0;
    if (this.recInterval) clearInterval(this.recInterval);
    this.recInterval = setInterval(() => {
      sec++;
      this.setData({
        recordDurationSec: sec,
        recordTimerText: this.formatTime(sec)
      });
      if (sec >= Math.round(asr.MAX_DURATION / 1000)) this.stopRecord();
    }, 1000);
  },

  formatTime(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
  },

  toggleRecord() {
    if (this.data.isRecording) {
      this.stopRecord();
    } else {
      this.startRecord();
    }
  },

  startRecord() {
    const isEn = i18n.getLang() === "en";
    if (this.data.isTranscribing) {
      wx.showToast({ title: isEn ? "Transcribing, please wait…" : "正在转写，请稍候…", icon: "none" });
      return;
    }
    if (audioContext && this.data.isPlayingAudio) {
      audioContext.stop();
    }
    if (!this.recognizer) this.initAudioAndRecognizer();

    this.runWithPrivacy(() => {
      wx.authorize({
        scope: "scope.record",
        success: () => {
          const ok = this.recognizer.start();
          if (!ok) {
            wx.showToast({ title: isEn ? "Cannot start recording" : "无法开始录音", icon: "none" });
          }
        },
        fail: () => this.showMicDenied()
      });
    });
  },

  runWithPrivacy(done) {
    // 未配置隐私指引时 needAuthorization 为 false，不影响现有演示
    if (!wx.getPrivacySetting || !wx.requirePrivacyAuthorize) return done();
    wx.getPrivacySetting({
      success: (res) => {
        if (res && res.needAuthorization) {
          wx.requirePrivacyAuthorize({
            success: done,
            fail: () => {
              const isEn = i18n.getLang() === "en";
              wx.showModal({
                title: isEn ? "Privacy consent required" : "需要同意隐私保护指引",
                content: isEn ? "Recording uses the microphone. Please accept the privacy policy to continue." : "录音需要使用麦克风，请先同意隐私保护指引后重试。",
                showCancel: false
              });
            }
          });
        } else {
          done();
        }
      },
      fail: done
    });
  },

  showMicDenied() {
    const t = this.data.t || {};
    wx.showModal({
      title: t.rec_mic_deny_title || "麦克风权限未开启",
      content: t.rec_mic_deny_msg || "录音功能需要使用麦克风，请在设置中允许访问。",
      confirmText: t.rec_btn_setting || "去设置",
      success: (res) => {
        if (res.confirm) wx.openSetting();
      }
    });
  },

  stopRecord() {
    if (!this.recognizer) return;
    try { this.recognizer.stop(); } catch (e) {}
  },

  togglePlayAudio() {
    if (!this.data.tempAudioPath) return;
    if (this.data.isPlayingAudio) {
      audioContext.stop();
    } else {
      audioContext.src = this.data.tempAudioPath;
      audioContext.play();
    }
  },

  onTextInput(e) {
    const text = e.detail.value;
    this.setData({ 
      dreamText: text,
      aiGenPrompt: text ? text.slice(0, 40) : ""
    });
    this.analyzeDreamKeywords(text);
  },

  analyzeDreamKeywords(text, options) {
    const silent = !!(options && options.silent);
    const isEn = i18n.getLang() === "en";

    if (!text || text.trim().length === 0) {
      this.setData({ tags: [], aiDetectedStatus: "" });
      return;
    }

    // 中英双语关键词，保证英文模式下也能即时高亮意象
    const dict = [
      { words: ["深海", "deep sea", "sea", "ocean"], tag: "深海", tagEn: "Deep Abyss", emoji: "🌊" },
      { words: ["水", "water", "swim", "swimming"], tag: "水流", tagEn: "Water Stream", emoji: "🌊" },
      { words: ["猫", "cat", "kitten"], tag: "橘猫", tagEn: "Orange Cat", emoji: "🐱" },
      { words: ["狗", "dog", "puppy"], tag: "小狗", tagEn: "Puppy", emoji: "🐶" },
      { words: ["钥匙", "key"], tag: "发光钥匙", tagEn: "Glowing Key", emoji: "✨" },
      { words: ["沙漏", "hourglass"], tag: "沙漏", tagEn: "Hourglass", emoji: "⏳" },
      { words: ["水母", "jellyfish"], tag: "发光水母", tagEn: "Glowing Jellyfish", emoji: "🔮" },
      { words: ["飞", "fly", "flying", "soar"], tag: "高空飞行", tagEn: "Sky Flight", emoji: "🕊️" },
      { words: ["跑", "run", "running", "chase", "追逐"], tag: "追逐奔跑", tagEn: "Chasing & Running", emoji: "🏃" },
      { words: ["学校", "school", "classroom", "exam", "考试"], tag: "废弃学校", tagEn: "Deserted School", emoji: "🏫" },
      { words: ["时钟", "钟", "clock", "countdown", "倒计时"], tag: "倒转时钟", tagEn: "Rewinding Clock", emoji: "⏰" },
      { words: ["哭", "cry", "crying", "tears", "泪"], tag: "悲伤泪流", tagEn: "Tearful Grief", emoji: "😰" },
      { words: ["笑", "laugh", "laughing", "smile"], tag: "惊喜欢笑", tagEn: "Surprise Laughter", emoji: "✨" },
      { words: ["雨", "rain", "storm"], tag: "倾盆大雨", tagEn: "Torrential Rain", emoji: "🌧️" },
      { words: ["彩虹", "rainbow"], tag: "彩虹滑梯", tagEn: "Rainbow Slide", emoji: "🌈" },
      { words: ["帽子", "hat", "top hat"], tag: "魔术礼帽", tagEn: "Magic Top Hat", emoji: "🎩" },
      { words: ["飞船", "ufo", "spaceship"], tag: "UFO飞船", tagEn: "UFO Craft", emoji: "🛸" },
      { words: ["宇宙", "universe", "space", "galaxy"], tag: "浩瀚星空", tagEn: "Starry Galaxy", emoji: "✨" },
      { words: ["星", "star", "stars"], tag: "星空", tagEn: "Starry Sky", emoji: "✨" },
      { words: ["月", "moon"], tag: "月亮", tagEn: "Moon", emoji: "🌙" },
      { words: ["鸟", "bird"], tag: "飞鸟", tagEn: "Flying Bird", emoji: "🕊️" },
      { words: ["火", "fire", "flame"], tag: "火焰", tagEn: "Flames", emoji: "🔥" },
      { words: ["森林", "forest"], tag: "迷雾森林", tagEn: "Misty Forest", emoji: "🌲" },
      { words: ["树", "tree"], tag: "古树", tagEn: "Ancient Tree", emoji: "🌳" },
      { words: ["桌子", "table"], tag: "云上桌子", tagEn: "Table on Cloud", emoji: "☁️" }
    ];

    const haystack = isEn ? text.toLowerCase() : text;
    const detected = [];
    let matchedEmoji = this.data.selectedEmoji;

    dict.forEach((item) => {
      const hit = item.words.some((w) => haystack.indexOf(isEn ? String(w).toLowerCase() : w) >= 0);
      if (!hit) return;
      const tag = isEn ? item.tagEn : item.tag;
      if (detected.indexOf(tag) >= 0) return;
      detected.push(tag);
      if (item.emoji) matchedEmoji = item.emoji;
    });

    if (detected.length > 0) {
      this.setData({
        tags: detected,
        selectedEmoji: matchedEmoji,
        aiDetectedStatus: isEn
          ? "✨ Motifs detected: " + detected.join(", ")
          : "✨ 识别到意象：" + detected.join("、")
      });
    } else if (!silent) {
      this.setData({
        tags: [],
        aiDetectedStatus: isEn
          ? "✨ Keep describing — motifs are detected automatically"
          : "✨ 继续描述，意象会自动识别"
      });
    }
  },

  cancelRecord() {
    this._cancelled = true;
    this.transcribeToken = (this.transcribeToken || 0) + 1;
    this.setData({ isTranscribing: false });
    if (this.data.isRecording && this.recognizer) {
      try { this.recognizer.stop(); } catch (e) {}
    }
    if (audioContext && this.data.isPlayingAudio) audioContext.stop();
    wx.navigateBack({
      fail: () => wx.switchTab({ url: "/pages/timeline/timeline" })
    });
  },

  clearText() {
    this.transcribeToken = (this.transcribeToken || 0) + 1;
    if (audioContext && this.data.isPlayingAudio) audioContext.stop();
    this.setData({
      dreamText: "",
      aiGenPrompt: "",
      aiImagePreview: "",
      showCanvasStudio: false,
      aiDetectedStatus: "",
      tempAudioPath: "",
      canRetryTranscription: false,
      recordDurationSec: 0,
      recordTimerText: "00:00",
      isTranscribing: false,
      tags: []
    });
    this.canvasItems = [];
    this.canvasStrokes = [];
    this.collageBgImg = null;
    this.previewIsAi = false;
  },

  selectEmoji(e) {
    this.setData({ selectedEmoji: e.currentTarget.dataset.emoji });
  },

  onTagInput(e) {
    this.setData({ newTag: e.detail.value });
  },

  addTag() {
    const val = this.data.newTag.trim();
    if (!val) return;
    if (this.data.tags.includes(val)) {
      const isEn = i18n.getLang() === "en";
      wx.showToast({ title: isEn ? "Tag already exists" : "标签已存在", icon: "none" });
      return;
    }
    this.setData({
      tags: [...this.data.tags, val],
      newTag: ""
    });
  },

  delTag(e) {
    const idx = e.currentTarget.dataset.index;
    const list = [...this.data.tags];
    list.splice(idx, 1);
    this.setData({ tags: list });
  },

  loadStickerLib() {
    const list = stickerStore.getAllStickers().map((s) => ({
      key: "lib-" + s.id,
      name: s.name,
      nameEn: s.nameEn || i18n.translateMotif(s.name, "en"),
      cat: s.cat,
      src: s.src
    }));
    this.setData({ stickerLib: list }, () => this.refreshLib());
  },

  refreshLib() {
    const cat = this.data.libCat;
    const pickedKeys = this.data.pickedStickers.map((p) => p.key);
    const list = this.data.stickerLib
      .filter((s) => cat === "all" || s.cat === cat)
      .map((s) => Object.assign({}, s, { picked: pickedKeys.indexOf(s.key) >= 0 }));
    this.setData({ libList: list });
  },

  toggleLib() {
    this.setData({ libVisible: !this.data.libVisible }, () => this.refreshLib());
  },

  selectLibCat(e) {
    this.setData({ libCat: e.currentTarget.dataset.cat }, () => this.refreshLib());
  },

  toggleSticker(e) {
    const key = e.currentTarget.dataset.key;
    const item = this.data.stickerLib.find((s) => s.key === key);
    if (!item) return;
    const picked = this.data.pickedStickers.slice();
    const idx = picked.findIndex((p) => p.key === key);
    if (idx >= 0) {
      picked.splice(idx, 1);
    } else {
      picked.push({ key: item.key, name: item.name, cat: item.cat, src: item.src });
    }
    this.setData({ pickedStickers: picked }, () => this.refreshLib());
  },

  removePicked(e) {
    const index = e.currentTarget.dataset.index;
    const picked = this.data.pickedStickers.slice();
    picked.splice(index, 1);
    this.setData({ pickedStickers: picked }, () => this.refreshLib());
  },

  onGenPromptInput(e) {
    this.setData({ genPrompt: e.detail.value });
  },

  onGenCatChange(e) {
    this.setData({ genCatIndex: Number(e.detail.value) });
  },

  generateSticker() {
    const prompt = this.data.genPrompt.trim();
    const t = this.data.t || {};
    const isEn = this.data.currentLang === "en";
    if (!prompt) {
      wx.showToast({ title: isEn ? "Enter sticker description" : "先写一句贴纸描述", icon: "none" });
      return;
    }
    if (this.data.genLoading) return;
    if (!ai.hasImageKey()) {
      wx.showModal({
        title: isEn ? "Image Model Needed" : "需要生图大模型",
        content: isEn ? "Sticker creation requires an image generation model. Please configure Zhipu GLM or OpenAI key in Settings." : "生成贴纸需要生图能力，请先到「我的 → AI 模型设置」配置智谱 GLM（推荐）或 OpenAI 密钥。",
        confirmText: isEn ? "Settings" : "去设置",
        success: (res) => {
          if (res.confirm) wx.switchTab({ url: "/pages/settings/settings" });
        }
      });
      return;
    }

    const cats = ["action", "item", "location", "emotion"];
    const cat = cats[this.data.genCatIndex] || "item";
    const name = prompt.slice(0, isEn ? 16 : 8);
    const nameEn = isEn ? name : i18n.translateMotif(name, "en");
    const stylePrompt = isEn
      ? prompt + ", single sticker, white background, cute illustration style"
      : prompt + "，单个贴纸，白色背景，可爱插画风格";

    this.setData({ genLoading: true });
    wx.showLoading({ title: isEn ? "Creating sticker..." : "生成贴纸中", mask: true });

    ai.generateImage(stylePrompt)
      .then((url) => new Promise((resolve, reject) => {
        wx.getImageInfo({ src: url, success: resolve, fail: reject });
      }))
      .then((res) => stickerStore.persistImage(res.path))
      .then((savedPath) => {
        const id = "my-" + Date.now();
        stickerStore.addMySticker({ id: id, name: name, nameEn: nameEn, cat: cat, src: savedPath });
        const item = { key: "lib-" + id, name: name, nameEn: nameEn, cat: cat, src: savedPath };
        this.setData({
          genLoading: false,
          genPrompt: "",
          stickerLib: [item].concat(this.data.stickerLib),
          pickedStickers: [item].concat(this.data.pickedStickers)
        }, () => this.refreshLib());

        // 如果画布已开启，直接自动贴上画布！
        if (dreamCanvasNode) {
          this.addStickerToDreamCanvas({ currentTarget: { dataset: { src: savedPath, name: name } } });
        }

        wx.hideLoading();
        wx.showToast({ title: t.rec_toast_sticker_done || "新贴纸已生成并上屏", icon: "success" });
      })
      .catch((err) => {
        wx.hideLoading();
        this.setData({ genLoading: false });
        wx.showModal({
          title: isEn ? "Failed" : "生成失败",
          content: (err && err.message) || (isEn ? "Check API key and network connection" : "请检查 API Key 与网络后重试"),
          showCancel: false
        });
      });
  },

  saveDream() {
    const isEn = i18n.getLang() === "en";
    if (this.data.isTranscribing) {
      wx.showToast({ title: isEn ? "Transcribing, please wait…" : "正在转写，请稍候…", icon: "none" });
      return;
    }
    if (!this.data.dreamText.trim() && !this.data.tempAudioPath) {
      wx.showToast({ title: isEn ? "Please record or input dream content first" : "请先录音或输入梦境内容", icon: "none" });
      return;
    }
    if (this.saving) return;
    this.saving = true;

    const text = this.data.dreamText.trim();
    if (!text) {
      this.saving = false;
      this.persistDream(null, "", { aiImage: false });
      return;
    }

    // 如果用户已经在画布上创作了（或者生成了预览），合成为最终图片
    const hasStickersOnCanvas = (this.canvasItems && this.canvasItems.length > 0) || (this.canvasStrokes && this.canvasStrokes.length > 0);

    if (dreamCanvasNode && hasStickersOnCanvas) {
      wx.showLoading({ title: isEn ? "Compositing artwork..." : "正在合成画卷...", mask: true });
      wx.canvasToTempFilePath({
        canvas: dreamCanvasNode,
        success: (res) => {
          stickerStore.persistImage(res.tempFilePath).then((savedFinalPath) => {
            // 拼贴画是用户创作，不标记为 AI 生成
            this.finishSaveDream(text, savedFinalPath, { aiImage: false });
          });
        },
        fail: () => {
          this.finishSaveDream(text, this.data.aiImagePreview, { aiImage: !!this.previewIsAi });
        }
      });
    } else if (this.data.aiImagePreview) {
      // 用户选择了纯净 AI 图片，无需重新生成，直接入库
      this.finishSaveDream(text, this.data.aiImagePreview, { aiImage: !!this.previewIsAi });
    } else {
      // 用户未提前点击生成 AI 预览，自动后台生成并入库
      const canGenImage = ai.hasImageKey();
      wx.showLoading({ title: isEn ? "Analyzing & painting..." : "AI 解析与绘图中", mask: true });

      this.analyzeByAI(text)
        .then((result) => {
          if (result) this.applyAiResult(result);
          if (canGenImage) {
            return this.generateDreamImage(result, text);
          }
          return "";
        })
        .then((imagePath) => {
          wx.hideLoading();
          this.saving = false;
          const finalPath = imagePath || this.pickFallbackImage(text, this.data.tags);
          this.persistDream(null, finalPath, {
            aiImage: !!imagePath,
            imageFailed: canGenImage && !imagePath
          });
        })
        .catch(() => {
          wx.hideLoading();
          this.saving = false;
          this.persistDream(null, this.pickFallbackImage(text, this.data.tags), {
            aiImage: false,
            imageFailed: canGenImage
          });
        });
    }
  },

  finishSaveDream(text, finalImagePath, options) {
    const isEn = i18n.getLang() === "en";
    wx.showLoading({ title: isEn ? "Saving dream archive..." : "整理梦境档案...", mask: true });
    this.analyzeByAI(text)
      .then((aiResult) => {
        wx.hideLoading();
        this.saving = false;
        this.persistDream(aiResult, finalImagePath, options || {});
      })
      .catch(() => {
        wx.hideLoading();
        this.saving = false;
        this.persistDream(null, finalImagePath, options || {});
      });
  },

  generateDreamImage(aiResult, text) {
    const isEn = i18n.getLang() === "en";
    const sep = isEn ? ", " : "、";
    const parts = [];
    if (aiResult && aiResult.summary) parts.push(aiResult.summary);
    else parts.push(String(text).slice(0, 80));

    const cleanName = (n) => String(n || "").replace(/[^一-龥A-Za-z0-9]/g, "");
    const picked = (this.data.pickedStickers || []).map((p) => cleanName(p.name));
    const aiNames = aiResult && Array.isArray(aiResult.stickers)
      ? aiResult.stickers.map((s) => cleanName(s.name))
      : [];
    const names = picked.concat(aiNames).filter(Boolean);
    if (names.length) parts.push(names.join(sep));
    if (aiResult && aiResult.emotion) parts.push((isEn ? "Mood: " : "情绪：") + aiResult.emotion);

    const prompt = parts.join(isEn ? ", " : "，") + (isEn
      ? ", dream illustration, retro pop Memphis style, flat hand-drawn, bright yellow and blue palette, surreal, no text"
      : "，梦境插画，复古波普孟菲斯风格，扁平手绘，明亮黄蓝配色，超现实，无文字");

    return ai.generateImage(prompt)
      .then((url) => new Promise((resolve, reject) => {
        wx.getImageInfo({ src: url, success: resolve, fail: reject });
      }))
      .then((res) => this.compressImage(res.path))
      .then((path) => stickerStore.persistImage(path))
      .catch(() => "");
  },

  compressImage(path) {
    return new Promise((resolve) => {
      wx.compressImage({
        src: path,
        quality: 60,
        success: (res) => resolve(res.tempFilePath),
        fail: () => resolve(path)
      });
    });
  },

  analyzeByAI(text) {
    if (!ai.hasKey()) return Promise.resolve(null);
    return ai.analyzeDream(text).catch(() => null);
  },

  applyAiResult(r) {
    const tags = Array.isArray(r.tags) ? r.tags : [];
    this.setData({
      selectedEmoji: r.emoji || this.data.selectedEmoji,
      tags: tags.length ? tags : this.data.tags,
      aiDetectedStatus: r.summary ? "✨ " + r.summary : this.data.aiDetectedStatus
    });
  },

  pickFallbackImage(text, tags) {
    const combined = ((text || "") + " " + (tags || []).join(" ")).toLowerCase();
    const has = (list) => list.some((w) => combined.indexOf(w) >= 0);
    if (has(["海", "水", "鱼", "潜水", "sea", "ocean", "water", "fish", "dive", "jellyfish"])) {
      return "/assets/ai/ai_deep_sea.png";
    }
    if (has(["学校", "考", "书", "教室", "school", "exam", "class", "study"])) {
      return "/assets/ai/ai_abandoned_school.png";
    }
    if (has(["彩虹", "滑梯", "天空", "飞", "rainbow", "slide", "sky", "fly", "flying"])) {
      return "/assets/ai/ai_rainbow_slide.png";
    }
    const presets = [
      "/assets/ai/1.png",
      "/assets/ai/2.png",
      "/assets/ai/3.png",
      "/assets/ai/4.png",
      "/assets/ai/ai_deep_sea.png",
      "/assets/ai/ai_rainbow_slide.png",
      "/assets/ai/ai_abandoned_school.png"
    ];
    return presets[Math.floor(Math.random() * presets.length)];
  },

  persistDream(aiResult, imagePath, options) {
    const opts = options || {};
    const isEn = i18n.getLang() === "en";
    this.saving = false;

    const descText = this.data.dreamText.trim() || (isEn
      ? "(Voice memo — listen anytime in Details)"
      : "（原声语音记录，点击详情页可随时收听）");
    const storedDreams = wx.getStorageSync("dreamscope_dreams");
    const currentList = Array.isArray(storedDreams)
      ? storedDreams
      : (app.globalData.defaultDreams || []).slice();

    const aiTagList = aiResult && Array.isArray(aiResult.tags) ? aiResult.tags : [];
    const localTags = this.data.tags;
    const finalTags = aiTagList.length
      ? aiTagList
      : (localTags.length ? localTags : [this.data.selectedEmoji + (isEn ? " Untitled Motif" : " 未命名意象")]);

    const now = new Date();
    const bDate = i18n.formatBilingualDate(now);
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const clipLen = isEn ? 30 : 12;
    const descClip = descText.length > clipLen ? descText.slice(0, clipLen) + "…" : descText;

    const titleText = aiResult && aiResult.title
      ? aiResult.title + (aiResult.emotion ? " · " + aiResult.emotion : "")
      : finalTags[0] + " · " + descClip;

    let titleTextEn;
    if (isEn) {
      titleTextEn = titleText;
    } else if (aiResult && aiResult.titleEn) {
      titleTextEn = aiResult.titleEn + (aiResult.emotionEn ? " · " + aiResult.emotionEn : "");
    } else {
      titleTextEn = i18n.translateMotif(finalTags[0], "en") + " · " + descClip;
    }

    const picked = this.data.pickedStickers || [];
    const aiStickers = aiResult && Array.isArray(aiResult.stickers) ? aiResult.stickers : [];

    let stickers;
    if (picked.length) {
      stickers = picked.map((p) => ({
        name: p.name,
        nameEn: isEn ? p.name : (p.nameEn || i18n.translateMotif(p.name, "en")),
        cat: p.cat || "item",
        src: p.src || ""
      }));
    } else if (aiStickers.length) {
      stickers = aiStickers.map((s) => ({
        name: s.name,
        nameEn: isEn ? s.name : (s.nameEn || i18n.translateMotif(s.name, "en")),
        cat: s.cat || "item",
        src: s.src || ""
      }));
    } else {
      stickers = finalTags.map((t, i) => ({
        name: t,
        nameEn: isEn ? t : i18n.translateMotif(t, "en"),
        cat: i % 4 === 0 ? "action" : (i % 4 === 1 ? "location" : (i % 4 === 2 ? "item" : "emotion"))
      }));
    }

    const finalTagsEn = isEn ? finalTags.slice() : finalTags.map((t) => i18n.translateMotif(t, "en"));
    const aiImage = !!opts.aiImage && !!imagePath;
    const finalImage = imagePath || this.pickFallbackImage(descText, finalTags);

    const newDream = {
      id: "d" + now.getTime(),
      year: year,
      month: month,
      day: day,
      dateKey: year + "-" + month + "-" + day,
      date: bDate.date,
      dateEn: bDate.dateEn,
      emoji: (aiResult && aiResult.emoji) || this.data.selectedEmoji,
      emotion: (aiResult && aiResult.emotion) || "",
      title: titleText,
      titleEn: titleTextEn,
      desc: descText,
      descEn: isEn ? descText : "",
      image: finalImage,
      isAiGenerated: aiImage,
      audioUrl: this.data.tempAudioPath || "",
      audioLen: this.data.recordDurationSec ? this.data.recordDurationSec + "s" : "30s",
      stickers: stickers,
      tags: finalTags,
      tagsEn: finalTagsEn
    };

    currentList.unshift(newDream);
    wx.setStorageSync("dreamscope_dreams", currentList);

    // 若录音还没落盘（用户保存得很快），补一次持久化并回写路径
    if (newDream.audioUrl && !fileStore.isUserFile(newDream.audioUrl)) {
      const dreamId = newDream.id;
      fileStore.persistAudio(newDream.audioUrl).then((savedAudio) => {
        if (!savedAudio || savedAudio === newDream.audioUrl) return;
        const latest = wx.getStorageSync("dreamscope_dreams") || [];
        const target = latest.find((item) => item.id === dreamId);
        if (target) {
          target.audioUrl = savedAudio;
          wx.setStorageSync("dreamscope_dreams", latest);
        }
      });
    }

    if (aiImage) {
      wx.showToast({ title: isEn ? "✨ AI artwork generated" : "✨ 梦境插画已生成", icon: "success" });
    } else if (opts.imageFailed) {
      wx.showToast({ title: isEn ? "Image failed — dream saved" : "生图失败，梦境已保存", icon: "none" });
    } else {
      wx.showToast({ title: isEn ? "Saved to Timeline" : "已保存到时间线", icon: "success" });
    }

    setTimeout(() => {
      wx.switchTab({ url: "/pages/timeline/timeline" });
    }, 800);
  },

  // 对话式一键生成 AI 梦境插画
  onAiGenPromptInput(e) {
    this.setData({ aiGenPrompt: e.detail.value });
  },

  generateAiDreamImage() {
    const text = (this.data.aiGenPrompt || this.data.dreamText).trim();
    const isEn = i18n.getLang() === "en";
    if (!text && !this.data.tempAudioPath) {
      wx.showToast({ title: isEn ? "Record audio or write details first" : "先录音或写点梦境细节吧", icon: "none" });
      return;
    }
    if (this.data.isGeneratingAiImage) return;

    this.setData({ isGeneratingAiImage: true });
    wx.showLoading({ title: isEn ? "AI generating scene..." : "AI 构思画面中...", mask: true });

    const canImage = ai.hasImageKey();

    this.analyzeByAI(text)
      .then((res) => {
        if (res) this.applyAiResult(res);
        if (canImage) {
          wx.showLoading({ title: isEn ? "AI painting artwork..." : "AI 绘制插画中...", mask: true });
          return this.generateDreamImage(res, text);
        }
        // 未配置 Key，使用艺术插画兜底
        return "";
      })
      .then((imgPath) => {
        const finalPath = imgPath || this.pickFallbackImage(text, this.data.tags);
        this.previewIsAi = !!imgPath;
        wx.hideLoading();
        this.setData({
          isGeneratingAiImage: false,
          aiImagePreview: finalPath,
          showCanvasStudio: true
        }, () => {
          setTimeout(() => this.initDreamCanvas(finalPath), 150);
        });
        if (imgPath) {
          wx.showToast({ title: isEn ? "AI artwork ready for collage!" : "AI 画面已生成，可自由拼贴", icon: "success" });
        } else {
          wx.showToast({ title: isEn ? "Matched a local art canvas" : "已为你匹配本地艺术画卷", icon: "none" });
        }
      })
      .catch(() => {
        wx.hideLoading();
        const fallback = this.pickFallbackImage(text, this.data.tags);
        this.previewIsAi = false;
        this.setData({
          isGeneratingAiImage: false,
          aiImagePreview: fallback,
          showCanvasStudio: true
        }, () => {
          setTimeout(() => this.initDreamCanvas(fallback), 150);
        });
        wx.showToast({ title: isEn ? "Matched a local art canvas" : "已为你匹配本地艺术画卷", icon: "none" });
      });
  },

  // 初始化梦境画卷 Canvas 2D
  initDreamCanvas(bgPath) {
    const query = wx.createSelectorQuery();
    query.select("#dreamStudioCanvas")
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext("2d");
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        dreamCanvasNode = canvas;
        dreamCtx = ctx;
        this.canvasW = res[0].width;
        this.canvasH = res[0].height;
        if (!this.canvasItems) this.canvasItems = [];
        if (!this.canvasStrokes) this.canvasStrokes = [];
        if (!this.collageLoadedImages) this.collageLoadedImages = {};

        this.loadBgImage(bgPath).then(() => {
          this.redrawDreamCanvas();
        });
      });
  },

  loadBgImage(src) {
    if (!src || !dreamCanvasNode) return Promise.resolve(null);
    return this.ensureCanvasImage(src).then((img) => {
      this.collageBgImg = img;
      return img;
    });
  },

  ensureCanvasImage(src) {
    if (!src || !dreamCanvasNode) return Promise.resolve(null);
    if (this.collageLoadedImages && this.collageLoadedImages[src]) {
      return Promise.resolve(this.collageLoadedImages[src]);
    }

    return canvasImage.load(dreamCanvasNode, src).then((img) => {
      if (img) this.collageLoadedImages[src] = img;
      return img;
    });
  },

  // 点击贴纸直接贴上 AI 画布
  addStickerToDreamCanvas(e) {
    const src = e.currentTarget.dataset.src;
    const name = e.currentTarget.dataset.name;
    if (!dreamCanvasNode) {
      this.initDreamCanvas(this.data.aiImagePreview);
      setTimeout(() => this.addStickerToDreamCanvas(e), 200);
      return;
    }

    this.ensureCanvasImage(src).then((img) => {
      if (!img) {
        const isEn = i18n.getLang() === "en";
        wx.showToast({ title: isEn ? "Failed to load sticker" : "贴纸加载失败", icon: "none" });
        return;
      }
      const size = Math.round(Math.min(this.canvasW, this.canvasH) * 0.28);
      const offset = (this.canvasItems.length % 5) * 24;
      this.canvasItems.push({
        src: src,
        name: name,
        x: Math.round((this.canvasW - size) / 2) + offset - 30,
        y: Math.round((this.canvasH - size) / 2) + offset - 30,
        size: size
      });

      // 同步加入已选意象贴纸
      const picked = this.data.pickedStickers.slice();
      if (!picked.some((p) => p.name === name)) {
        picked.push({
          key: "lib-" + Date.now(),
          name: name,
          nameEn: i18n.translateMotif(name, "en"),
          cat: "item",
          src: src
        });
        this.setData({ pickedStickers: picked });
      }

      this.redrawDreamCanvas();
      const isEn = this.data.currentLang === "en";
      wx.showToast({ title: isEn ? "Sticker pasted, drag to place" : "已贴上画卷，可拖动摆放", icon: "none" });
    });
  },

  // 重绘画布：底图 + 贴纸 + 手绘涂鸦
  redrawDreamCanvas() {
    const ctx = dreamCtx;
    if (!ctx || !this.canvasW) return;
    ctx.clearRect(0, 0, this.canvasW, this.canvasH);

    // 1. 绘制 AI 底图背景
    if (this.collageBgImg) {
      ctx.drawImage(this.collageBgImg, 0, 0, this.canvasW, this.canvasH);
    } else {
      ctx.fillStyle = "#FFFDF8";
      ctx.fillRect(0, 0, this.canvasW, this.canvasH);
    }

    // 2. 绘制粘贴的意象贴纸
    this.canvasItems.forEach((item) => {
      const img = this.collageLoadedImages[item.src];
      if (img) {
        ctx.drawImage(img, item.x, item.y, item.size, item.size);
        // 绘制贴纸精致黑边微框，凸显波普拼贴质感
        ctx.strokeStyle = "rgba(26, 26, 26, 0.45)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(item.x, item.y, item.size, item.size);
      }
    });

    // 3. 绘制手绘涂鸦线条
    this.canvasStrokes.forEach((stroke) => this.drawCanvasStroke(stroke));
    if (this.currentCanvasStroke) this.drawCanvasStroke(this.currentCanvasStroke);
  },

  drawCanvasStroke(stroke) {
    const pts = stroke.points || [];
    if (!pts.length || !dreamCtx) return;
    const ctx = dreamCtx;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    if (pts.length === 1) ctx.lineTo(pts[0].x + 0.1, pts[0].y + 0.1);
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width || 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  },

  // 触控交互：移动贴纸 / 画笔涂鸦
  canvasTouchStart(e) {
    if (!dreamCtx) return;
    const t = e.touches[0];

    if (this.data.collageMode === "draw") {
      this.currentCanvasStroke = {
        color: this.data.collageColor,
        width: 5,
        points: [{ x: t.x, y: t.y }]
      };
      return;
    }

    // 移动贴纸：从最上层贴纸开始命中检测
    for (let i = this.canvasItems.length - 1; i >= 0; i--) {
      const it = this.canvasItems[i];
      if (t.x >= it.x && t.x <= it.x + it.size && t.y >= it.y && t.y <= it.y + it.size) {
        this.dragCanvasItem = it;
        this.dragOffset = { x: t.x - it.x, y: t.y - it.y };
        this.canvasItems.splice(i, 1);
        this.canvasItems.push(it); // 移到最顶层
        this.redrawDreamCanvas();
        break;
      }
    }
  },

  canvasTouchMove(e) {
    if (!dreamCtx) return;
    const t = e.touches[0];

    if (this.data.collageMode === "draw" && this.currentCanvasStroke) {
      this.currentCanvasStroke.points.push({ x: t.x, y: t.y });
      this.redrawDreamCanvas();
      return;
    }

    if (this.dragCanvasItem) {
      this.dragCanvasItem.x = t.x - this.dragOffset.x;
      this.dragCanvasItem.y = t.y - this.dragOffset.y;
      this.redrawDreamCanvas();
    }
  },

  canvasTouchEnd() {
    if (this.currentCanvasStroke) {
      if (this.currentCanvasStroke.points.length > 1) {
        this.canvasStrokes.push(this.currentCanvasStroke);
      }
      this.currentCanvasStroke = null;
      this.redrawDreamCanvas();
    }
    this.dragCanvasItem = null;
  },

  setStudioMode(e) {
    this.setData({ collageMode: e.currentTarget.dataset.mode });
  },

  setStudioColor(e) {
    this.setData({ collageColor: e.currentTarget.dataset.color });
  },

  clearStudioDoodle() {
    this.canvasStrokes = [];
    this.canvasItems = [];
    this.currentCanvasStroke = null;
    this.dragCanvasItem = null;
    this.redrawDreamCanvas();
    const isEn = this.data.currentLang === "en";
    wx.showToast({ title: isEn ? "Reset to clean image" : "已恢复纯净底图", icon: "none" });
  },

  removeLastSticker() {
    if (this.canvasItems.length > 0) {
      this.canvasItems.pop();
      this.redrawDreamCanvas();
      const isEn = this.data.currentLang === "en";
      wx.showToast({ title: isEn ? "Sticker removed" : "已移除贴纸", icon: "none" });
    }
  }
});
