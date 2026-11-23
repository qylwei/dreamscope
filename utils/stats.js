/**
 * 洞察页 / 设置页的真实统计
 * 所有数字都从 dreamscope_dreams 现算，不再使用硬编码演示数据。
 */

const graphUtil = require("./graph");

const EMOTION_GROUPS = [
  {
    key: "anxious",
    words: ["焦虑", "恐慌", "害怕", "紧张", "压抑", "压力", "恐惧", "不安", "噩梦", "焦躁",
      "anxious", "panic", "fear", "stress", "nightmare", "dread", "worried"]
  },
  {
    key: "calm",
    words: ["平静", "安宁", "放松", "治愈", "温暖", "舒适", "安心", "宁静",
      "calm", "peace", "relax", "heal", "comfort", "warm", "soothe"]
  },
  {
    key: "joy",
    words: ["喜悦", "开心", "快乐", "惊喜", "幸福", "兴奋", "满足", "期待",
      "joy", "happy", "excite", "wonder", "delight", "love", "hope"]
  },
  {
    key: "sad",
    words: ["感伤", "悲伤", "难过", "孤独", "失落", "想念", "哭", "遗憾", "离别",
      "sad", "melancholy", "lonely", "grief", "tear", "miss", "sorrow", "loss"]
  }
];

function classifyEmotion(text) {
  const value = String(text || "").toLowerCase();
  if (!value) return "";
  for (let i = 0; i < EMOTION_GROUPS.length; i++) {
    const group = EMOTION_GROUPS[i];
    for (let j = 0; j < group.words.length; j++) {
      if (value.indexOf(group.words[j].toLowerCase()) >= 0) return group.key;
    }
  }
  return "";
}

function dayInfo(dream) {
  if (!dream) return null;
  let y = Number(dream.year);
  let m = Number(dream.month);
  let d = Number(dream.day);
  if (!y || !m || !d) {
    const hit = String(dream.date || "").match(/(\d{1,2})\s*[.\-/]\s*(\d{1,2})/);
    if (!hit) return null;
    y = y || new Date().getFullYear();
    m = Number(hit[1]);
    d = Number(hit[2]);
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y: y, m: m, d: d };
}

function dayNumber(info) {
  return Math.floor(new Date(info.y, info.m - 1, info.d, 12, 0, 0).getTime() / 86400000);
}

function computeStreak(dreams) {
  const set = {};
  (dreams || []).forEach(function (d) {
    const info = dayInfo(d);
    if (info) set[dayNumber(info)] = 1;
  });
  const keys = Object.keys(set).map(Number);
  if (!keys.length) return 0;

  const now = new Date();
  let cursor = dayNumber({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });
  if (!set[cursor]) cursor -= 1; // 今天还没记，从昨天起算
  let streak = 0;
  while (set[cursor]) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
}

function compute(dreams, options) {
  const list = Array.isArray(dreams) ? dreams : [];
  const opts = options || {};
  const emotion = { anxious: 0, calm: 0, joy: 0, sad: 0, other: 0, total: 0 };
  const motifCount = {};
  let aiCount = 0;
  let stickerUses = 0;

  list.forEach(function (d) {
    if (!d) return;
    if (d.isAiGenerated) aiCount += 1;

    const texts = [];
    if (d.emotion) texts.push(d.emotion);
    (d.tags || []).forEach(function (t) { texts.push(t); });
    (d.stickers || []).forEach(function (s) { if (s && s.name) texts.push(s.name); });
    const group = classifyEmotion(texts.join(" "));
    emotion[group || "other"] += 1;
    emotion.total += 1;

    (d.stickers || []).forEach(function (s) {
      if (!s || !s.name) return;
      const key = graphUtil.normalizeMotif(s.name);
      if (!key) return;
      motifCount[key] = (motifCount[key] || 0) + 1;
      stickerUses += 1;
    });
  });

  const topMotifs = Object.keys(motifCount)
    .map(function (name) { return { name: name, count: motifCount[name] }; })
    .sort(function (a, b) { return b.count - a.count; })
    .slice(0, 5);

  const labelled = emotion.anxious + emotion.calm + emotion.joy + emotion.sad;
  const emotionPct = {};
  ["anxious", "calm", "joy", "sad"].forEach(function (k) {
    emotionPct[k] = labelled ? Math.round((emotion[k] / labelled) * 100) : 0;
  });

  return {
    total: list.length,
    stickerUses: stickerUses,
    myStickers: Number(opts.myStickers) || 0,
    aiCount: aiCount,
    streak: computeStreak(list),
    topMotifs: topMotifs,
    emotion: emotion,
    emotionPct: emotionPct,
    hasEmotion: labelled > 0
  };
}

module.exports = {
  compute: compute,
  classifyEmotion: classifyEmotion,
  dayInfo: dayInfo
};
