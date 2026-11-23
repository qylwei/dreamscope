const i18n = require("./i18n");

/**
 * 统一意象名：去掉前置 emoji / 标点，让「🌊 深海」与「深海」合并成同一个节点
 */
function normalizeMotif(name) {
  const raw = String(name == null ? "" : name).trim();
  if (!raw) return "";
  let stripped = raw;
  try {
    stripped = raw.replace(/^[^\p{L}\p{N}]+/u, "").trim();
  } catch (e) {
    stripped = raw.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, "").trim();
  }
  return stripped || raw;
}

function buildGraph(dreams, lang) {
  const nodes = {};
  const edges = {};
  const curLang = lang || i18n.getLang();

  (dreams || []).forEach((d) => {
    const listInDream = [];

    // 1. 贴纸意象
    (d.stickers || []).forEach((s) => {
      if (!s || !s.name) return;
      const raw = String(s.name).trim();
      const name = normalizeMotif(raw);
      if (!name) return;
      if (listInDream.indexOf(name) >= 0) return;
      listInDream.push(name);
      if (!nodes[name]) {
        let displayName = raw;
        if (curLang === "en") {
          displayName = s.nameEn || i18n.translateMotif(name, "en");
        }
        nodes[name] = { name: name, displayName: displayName, cat: s.cat || "item", count: 0, degree: 0, dreams: [] };
      }
      nodes[name].count += 1;
      if (s.cat) nodes[name].cat = s.cat;
      nodes[name].dreams.push({ id: d.id, title: d.title, titleEn: d.titleEn, date: d.date, dateEn: d.dateEn });
    });

    // 2. 标签若不在贴纸中，作为意象补充进入图谱
    (d.tags || []).forEach((t) => {
      const raw = String(t || "").trim();
      const name = normalizeMotif(raw);
      if (!name) return;
      if (listInDream.indexOf(name) >= 0) return;
      listInDream.push(name);
      if (!nodes[name]) {
        let displayName = raw;
        if (curLang === "en") {
          displayName = i18n.translateMotif(name, "en");
        }
        nodes[name] = { name: name, displayName: displayName, cat: "item", count: 0, degree: 0, dreams: [] };
      }
      nodes[name].count += 1;
      nodes[name].dreams.push({ id: d.id, title: d.title, titleEn: d.titleEn, date: d.date, dateEn: d.dateEn });
    });

    // 3. 构建共现关联边
    for (let i = 0; i < listInDream.length; i++) {
      for (let j = i + 1; j < listInDream.length; j++) {
        const a = listInDream[i];
        const b = listInDream[j];
        const key = a < b ? a + "||" + b : b + "||" + a;
        edges[key] = (edges[key] || 0) + 1;
      }
    }
  });

  const adj = {};
  Object.keys(nodes).forEach((n) => { adj[n] = []; });

  const edgeList = [];
  Object.keys(edges).forEach((key) => {
    const parts = key.split("||");
    const a = parts[0];
    const b = parts[1];
    if (!adj[a] || !adj[b]) return;
    adj[a].push({ name: b, displayName: nodes[b] ? nodes[b].displayName : b, weight: edges[key] });
    adj[b].push({ name: a, displayName: nodes[a] ? nodes[a].displayName : a, weight: edges[key] });
    edgeList.push({ source: a, target: b, weight: edges[key] });
  });

  const all = Object.keys(nodes).map((n) => {
    adj[n].sort((x, y) => y.weight - x.weight);
    nodes[n].degree = adj[n].length;
    return nodes[n];
  });

  all.sort((x, y) => (y.degree - x.degree) || (y.count - x.count));

  return {
    nodes: nodes,
    adj: adj,
    all: all,
    edgeList: edgeList,
    center: all.length ? all[0].name : "",
    nodeCount: all.length,
    edgeCount: edgeList.length
  };
}

module.exports = { buildGraph, normalizeMotif };
