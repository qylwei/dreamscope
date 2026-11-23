const config = require("./config");
const i18n = require("./utils/i18n");
const fileStore = require("./utils/fileStore");

const SCHEMA_KEY = "dreamscope_schema";
const SCHEMA_VERSION = 2;

// 给旧记录补齐「年 / 月 / 日」，避免跨年时日历与筛选串数据
function migrateDreams(list) {
  let changed = false;
  const nowYear = new Date().getFullYear();

  (list || []).forEach((d) => {
    if (!d) return;
    let y = Number(d.year);
    let m = Number(d.month);
    let day = Number(d.day);

    if (!y || !m || !day) {
      const hit = String(d.date || "").match(/(\d{1,2})\s*[.\-/]\s*(\d{1,2})/);
      if (hit) {
        y = y || nowYear;
        m = m || Number(hit[1]);
        day = day || Number(hit[2]);
      }
    }

    if (y && m && day) {
      if (d.year !== y || d.month !== m || d.day !== day) changed = true;
      d.year = y;
      d.month = m;
      d.day = day;
      d.dateKey = y + "-" + m + "-" + day;
    }

    if (d.isAiGenerated === undefined) {
      // 旧数据无法判断来源：只有落到本机持久目录的图片才认为是 AI 生成
      d.isAiGenerated = !!d.image && (d.image.indexOf("wxfile://") === 0 || d.image.indexOf("http://usr") === 0);
      changed = true;
    }
  });

  return changed;
}

App({
  globalData: {
    workshopTab: "",
    graphFocus: "",
    stickers: [
      { id: 1, name: "橘猫", nameEn: "Orange Cat", cat: "item", catName: "物品", src: "/assets/stickers/sticker_cat.png" },
      { id: 2, name: "帽子", nameEn: "Hat", cat: "item", catName: "物品", src: "/assets/stickers/sticker_hat.png" },
      { id: 3, name: "漂浮的人", nameEn: "Floating Man", cat: "action", catName: "动作", src: "/assets/stickers/sticker_floating_man.png" },
      { id: 4, name: "哭泣", nameEn: "Crying", cat: "emotion", catName: "情绪", src: "/assets/stickers/sticker_cry.png" },
      { id: 5, name: "大笑", nameEn: "Laughing", cat: "emotion", catName: "情绪", src: "/assets/stickers/sticker_laugh.png" },
      { id: 6, name: "沙漏", nameEn: "Hourglass", cat: "item", catName: "物品", src: "/assets/stickers/sticker_hourglass.png" },
      { id: 7, name: "时钟", nameEn: "Clock", cat: "item", catName: "物品", src: "/assets/stickers/sticker_clock.png" },
      { id: 8, name: "发光钥匙", nameEn: "Glowing Key", cat: "item", catName: "物品", src: "/assets/stickers/sticker_key.png" },
      { id: 9, name: "云上桌子", nameEn: "Table on Cloud", cat: "location", catName: "地点", src: "/assets/stickers/sticker_table_cloud.png" },
      { id: 10, name: "飞碟UFO", nameEn: "UFO", cat: "location", catName: "地点", src: "/assets/stickers/sticker_ufo.png" }
    ],
    defaultDreams: [
      {
        id: "d1",
        date: "6.25 周四",
        dateEn: "Jun 25 Thu",
        emoji: "😰",
        title: "巨型水族馆 · 压抑焦虑",
        titleEn: "Giant Aquarium · Suffocating Anxiety",
        desc: "水族馆的玻璃突然变成一张张被红笔批改过的考卷，发光的水母在题目间游动，水压越来越大…",
        descEn: "Aquarium glass turns into exam papers graded in red ink. Bioluminescent jellyfish drift between questions as pressure mounts...",
        image: "/assets/images/aquarium.png",
        isAiGenerated: true,
        stickers: [
          { name: "🏃 深海潜泳", nameEn: "🏃 Deep Diving", cat: "action" },
          { name: "📍 霓虹深海", nameEn: "📍 Neon Abyss", cat: "location" },
          { name: "📦 密封试卷", nameEn: "📦 Sealed Exam", cat: "item" },
          { name: "😰 焦虑恐慌", nameEn: "😰 Panic Surge", cat: "emotion" }
        ],
        tags: ["考试", "深海", "水母", "倒计时"],
        tagsEn: ["Exams", "Abyss", "Jellyfish", "Countdown"],
        audioLen: "42s"
      },
      {
        id: "d2",
        date: "6.20 周六",
        dateEn: "Jun 20 Sat",
        emoji: "✨",
        title: "宇宙售票机 · 释怀与奇迹",
        titleEn: "Cosmic Ticket Booth · Wonder & Serenity",
        desc: "在一个漂浮在星环上的老旧电话亭里，投入一枚发光的硬币，就能买到通往任意童年夏天的车票。",
        descEn: "In an antique phone booth floating atop planetary rings, dropping a glowing coin grants a ticket to any childhood summer.",
        image: "/assets/images/stars.png",
        isAiGenerated: true,
        stickers: [
          { name: "🏃 极速飞翔", nameEn: "🏃 Cosmic Flight", cat: "action" },
          { name: "📍 星环宇宙", nameEn: "📍 Ring World", cat: "location" },
          { name: "📦 发光钥匙", nameEn: "📦 Glowing Key", cat: "item" },
          { name: "🔮 宿命释怀", nameEn: "🔮 Serenity", cat: "emotion" }
        ],
        tags: ["星空", "售票机", "夏天", "童年"],
        tagsEn: ["Galaxy", "Ticket Booth", "Summer", "Childhood"],
        audioLen: "1m 15s"
      },
      {
        id: "d3",
        date: "6.18 周四",
        dateEn: "Jun 18 Thu",
        emoji: "🐱",
        title: "云朵面包猫 · 治愈与温暖",
        titleEn: "Cloud Bread Cat · Sweet Healing",
        desc: "天上的云朵全部变成了刚出炉的面包，一只巨大的橘猫趴在云顶呼呼大睡，咬一口云朵是甜甜的蜂蜜味。",
        descEn: "All the clouds turned into freshly baked bread. A giant orange cat napped peacefully on the summit, tasting like honey cream.",
        image: "/assets/images/cat.png",
        isAiGenerated: true,
        stickers: [
          { name: "🏃 云端漫步", nameEn: "🏃 Cloud Stroll", cat: "action" },
          { name: "📍 糖果天际", nameEn: "📍 Candy Sky", cat: "location" },
          { name: "📦 面包橘猫", nameEn: "📦 Bread Cat", cat: "item" },
          { name: "💖 温暖治愈", nameEn: "💖 Comforting", cat: "emotion" }
        ],
        tags: ["橘猫", "云朵", "甜点", "治愈"],
        tagsEn: ["Cat", "Clouds", "Pastry", "Healing"],
        audioLen: "58s"
      }
    ]
  },
  onLaunch() {
    if (wx.cloud && config.cloudEnv) {
      wx.cloud.init({ env: config.cloudEnv, traceUser: true });
    }
    if (!wx.getStorageSync("dreamscope_dreams")) {
      wx.setStorageSync("dreamscope_dreams", this.globalData.defaultDreams);
    }

    const list = wx.getStorageSync("dreamscope_dreams") || [];
    const version = Number(wx.getStorageSync(SCHEMA_KEY) || 0);
    if (version < SCHEMA_VERSION) {
      if (migrateDreams(list)) {
        wx.setStorageSync("dreamscope_dreams", list);
      }
      wx.setStorageSync(SCHEMA_KEY, SCHEMA_VERSION);
    }

    // 清理没有记录引用的本机文件，避免 10MB 配额被旧图占满
    setTimeout(() => {
      fileStore.cleanupOrphans().catch(() => {});
    }, 1500);

    i18n.updateTabBar();
  }
});
