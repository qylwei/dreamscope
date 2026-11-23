const app = getApp();
const graphStore = require("../../utils/graph");
const i18n = require("../../utils/i18n");

// 分类色彩映射
const CAT_COLORS = {
  action: "#FF5252",    // 动作 - 红色
  item: "#FFB300",      // 物品 - 明黄
  location: "#00E676",  // 地点 - 翠绿
  emotion: "#7C4DFF"    // 情绪 - 紫色
};

Page({
  data: {
    nodeCount: 0,
    edgeCount: 0,
    hasGraph: false,
    viewMode: "sphere",      // "sphere" (3D球体) 或 "obsidian" (点状平面网)
    autoRotate: true,        // 是否自动慢速旋转
    selectedNode: null,      // 当前点击选中的意象详情
    relatedDreams: [],       // 选中意象关联的梦境列表
    relatedNeighbors: []     // 选中意象直接相连的邻居
  },

  onReady() {
    this.initCanvas();
  },

  onShow() {
    i18n.initPage(this, "nav_graph");
    const dreams = wx.getStorageSync("dreamscope_dreams") || app.globalData.defaultDreams;
    const lang = i18n.getLang();
    this.graph = graphStore.buildGraph(dreams, lang);

    const focus = app.globalData.graphFocus;
    app.globalData.graphFocus = "";

    this.setData({
      nodeCount: this.graph.nodeCount,
      edgeCount: this.graph.edgeCount,
      hasGraph: this.graph.nodeCount > 0
    });

    this.setupNodesCoordinates();
    const focusKey = focus ? graphStore.normalizeMotif(focus) : "";
    if (focusKey && this.graph.nodes[focusKey]) {
      this.selectNodeByName(focusKey);
    }
    this.startRenderLoop();
  },

  onHide() {
    this.stopRenderLoop();
  },

  onUnload() {
    this.stopRenderLoop();
  },

  initCanvas() {
    const query = wx.createSelectorQuery();
    query.select("#graphCanvas").fields({ node: true, size: true }).exec((res) => {
      if (!res[0] || !res[0].node) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext("2d");
      const dpr = wx.getSystemInfoSync().pixelRatio;
      
      canvas.width = res[0].width * dpr;
      canvas.height = res[0].height * dpr;
      ctx.scale(dpr, dpr);
      
      this.canvas = canvas;
      this.ctx = ctx;
      this.dpr = dpr;
      this.canvasWidth = res[0].width;
      this.canvasHeight = res[0].height;

      this.setupNodesCoordinates();
      this.draw();
    });
  },

  // 初始化所有节点的 3D 球体坐标与 2D 平面坐标
  setupNodesCoordinates() {
    if (!this.graph || !this.graph.all || this.graph.all.length === 0) return;
    const list = this.graph.all;
    const n = list.length;
    
    // 球体半径：自适应屏幕大小
    const r = Math.min(this.canvasWidth || 350, this.canvasHeight || 400) * 0.42;
    this.sphereRadius = r;

    // 1. 斐波那契球面算法分配 3D 坐标
    list.forEach((node, i) => {
      const phi = Math.acos(1 - 2 * (i + 0.5) / n);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      
      node.ox = r * Math.cos(theta) * Math.sin(phi);
      node.oy = r * Math.sin(theta) * Math.sin(phi);
      node.oz = r * Math.cos(phi);
      node.x = node.ox;
      node.y = node.oy;
      node.z = node.oz;

      // 2. 同时生成 Obsidian 平面散点图坐标 (螺旋舒展)
      const pR = Math.sqrt(i / n) * (r * 1.05);
      const pTheta = i * 2.4;
      node.flatX = pR * Math.cos(pTheta);
      node.flatY = pR * Math.sin(pTheta);
    });

    // 旋转角速度和状态
    this.rotX = 0.002;
    this.rotY = 0.003;
    this.angleX = 0;
    this.angleY = 0;
  },

  startRenderLoop() {
    if (this._renderTimer) return;
    const loop = () => {
      if (this.data.viewMode === "sphere" && this.data.autoRotate && !this.isDragging) {
        this.rotateSphere(0.004, 0.003);
      }
      this.draw();
      if (this.canvas && this.canvas.requestAnimationFrame) {
        this._renderTimer = this.canvas.requestAnimationFrame(loop);
      } else {
        this._renderTimer = setTimeout(loop, 30);
      }
    };
    loop();
  },

  stopRenderLoop() {
    if (this._renderTimer) {
      if (this.canvas && this.canvas.cancelAnimationFrame) {
        this.canvas.cancelAnimationFrame(this._renderTimer);
      } else {
        clearTimeout(this._renderTimer);
      }
      this._renderTimer = null;
    }
  },

  rotateSphere(dx, dy) {
    if (!this.graph || !this.graph.all) return;
    const cosX = Math.cos(dy);
    const sinX = Math.sin(dy);
    const cosY = Math.cos(dx);
    const sinY = Math.sin(dx);

    this.graph.all.forEach((node) => {
      // 绕 Y 轴旋转
      const x1 = node.x * cosY - node.z * sinY;
      const z1 = node.x * sinY + node.z * cosY;
      // 绕 X 轴旋转
      const y2 = node.y * cosX - z1 * sinX;
      const z2 = node.y * sinX + z1 * cosX;

      node.x = x1;
      node.y = y2;
      node.z = z2;
    });
  },

  draw() {
    if (!this.ctx || !this.canvasWidth || !this.graph || !this.graph.all) return;
    const ctx = this.ctx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const cx = w / 2;
    const cy = h / 2;
    const isSphere = this.data.viewMode === "sphere";
    const selected = this.data.selectedNode;
    const fov = 340;

    ctx.clearRect(0, 0, w, h);

    // 1. 计算每个节点在屏幕上的投影坐标 (px, py, scale, alpha)
    const nodesMap = {};
    this.graph.all.forEach((node) => {
      if (isSphere) {
        const scale = fov / (fov + node.z);
        node.scale = scale;
        node.px = cx + node.x * scale;
        node.py = cy + node.y * scale;
        // 深度透明度：前面的清晰不透明，后面的半透明
        node.alpha = Math.max(0.18, Math.min(1.0, (node.z + this.sphereRadius) / (2 * this.sphereRadius) * 0.85 + 0.15));
      } else {
        // Obsidian 平面网格模式
        node.scale = 1;
        node.px = cx + (node.flatX || 0);
        node.py = cy + (node.flatY || 0);
        node.alpha = 0.9;
      }
      nodesMap[node.name] = node;
    });

    // 2. 绘制 Obsidian 质感关系连线
    const edges = this.graph.edgeList || [];
    edges.forEach((edge) => {
      const s = nodesMap[edge.source];
      const t = nodesMap[edge.target];
      if (!s || !t) return;

      const isHighlighted = selected && (selected.name === edge.source || selected.name === edge.target);
      const hasSelection = !!selected;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(s.px, s.py);
      ctx.lineTo(t.px, t.py);

      if (isHighlighted) {
        // 命中聚焦的连线：高亮粗线
        ctx.strokeStyle = "rgba(255, 107, 107, 0.9)";
        ctx.lineWidth = 2.4;
        ctx.stroke();
      } else if (!hasSelection) {
        // 普通状态连线：Obsidian 风格半透明淡线
        const avgAlpha = ((s.alpha || 0.6) + (t.alpha || 0.6)) / 2;
        ctx.strokeStyle = `rgba(30, 30, 30, ${Math.max(0.08, avgAlpha * 0.28)})`;
        ctx.lineWidth = Math.min(1.6, 0.8 + (edge.weight || 1) * 0.3);
        ctx.stroke();
      } else {
        // 选中其他节点时，未关联的连线淡出
        ctx.strokeStyle = "rgba(200, 200, 200, 0.08)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      ctx.restore();
    });

    // 3. 排序节点绘制顺序（Z 轴从后向前画，确保立体遮挡正确）
    const drawOrder = this.graph.all.slice().sort((a, b) => a.z - b.z);

    // 4. 绘制意象节点与标签
    drawOrder.forEach((node) => {
      const isSelected = selected && selected.name === node.name;
      const isNeighbor = selected && this.isNeighborOf(selected.name, node.name);
      const hasSelection = !!selected;

      let nodeAlpha = node.alpha;
      if (hasSelection && !isSelected && !isNeighbor) {
        nodeAlpha = 0.18; // 非关联节点弱化
      }

      const baseR = Math.max(4.5, Math.min(10, 4 + (node.count || 1) * 1.5));
      const r = baseR * (isSphere ? node.scale : 1);
      const color = CAT_COLORS[node.cat] || "#FFB300";

      ctx.save();
      ctx.globalAlpha = nodeAlpha;

      // 外圈光晕 (若是选中核心或邻居)
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.px, node.py, r + 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 235, 59, 0.55)";
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#1A1A1A";
        ctx.stroke();
      } else if (isNeighbor) {
        ctx.beginPath();
        ctx.arc(node.px, node.py, r + 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 230, 118, 0.3)";
        ctx.fill();
      }

      // 节点实体圆点
      ctx.beginPath();
      ctx.arc(node.px, node.py, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#1A1A1A";
      ctx.stroke();

      // 节点文本标签
      const fontSize = Math.max(9, Math.round(11 * (isSphere ? node.scale : 1)));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      const text = node.displayName || node.name;
      const textX = node.px + r + 4;
      const textY = node.py;

      // 标签背景轻微提亮，防止连线遮挡文本
      if (node.scale > 0.85 || !isSphere || isSelected || isNeighbor) {
        const metrics = ctx.measureText(text);
        ctx.fillStyle = isSelected ? "rgba(255, 235, 59, 0.88)" : "rgba(255, 255, 255, 0.75)";
        ctx.fillRect(textX - 2, textY - fontSize / 2 - 1, metrics.width + 4, fontSize + 2);

        ctx.fillStyle = isSelected ? "#000000" : (hasSelection && !isNeighbor ? "#888888" : "#1A1A1A");
        ctx.fillText(text, textX, textY);
      }

      ctx.restore();
    });
  },

  isNeighborOf(centerName, targetName) {
    if (!this.graph || !this.graph.adj || !this.graph.adj[centerName]) return false;
    return this.graph.adj[centerName].some((item) => item.name === targetName);
  },

  // 触摸手势交互：支持手指拖动旋转球体 / 平移
  onTouchStart(e) {
    if (!e.touches || !e.touches[0]) return;
    const t = e.touches[0];
    this.isDragging = true;
    this.lastTouchX = t.x;
    this.lastTouchY = t.y;
    this.touchStartX = t.x;
    this.touchStartY = t.y;
    this.touchStartTime = Date.now();
  },

  onTouchMove(e) {
    if (!this.isDragging || !e.touches || !e.touches[0]) return;
    const t = e.touches[0];
    const dx = t.x - this.lastTouchX;
    const dy = t.y - this.lastTouchY;
    this.lastTouchX = t.x;
    this.lastTouchY = t.y;

    if (this.data.viewMode === "sphere") {
      // 3D 旋转球体
      this.rotateSphere(dx * 0.008, dy * 0.008);
    } else {
      // 2D 平移所有点
      if (this.graph && this.graph.all) {
        this.graph.all.forEach((node) => {
          node.flatX = (node.flatX || 0) + dx;
          node.flatY = (node.flatY || 0) + dy;
        });
      }
    }
    this.draw();
  },

  onTouchEnd(e) {
    this.isDragging = false;
    const duration = Date.now() - (this.touchStartTime || 0);
    const dist = Math.hypot((this.lastTouchX || 0) - (this.touchStartX || 0), (this.lastTouchY || 0) - (this.touchStartY || 0));

    // 轻触判定：位移小于 10px 且时间较短，判定为点击选点
    if (dist < 10 && duration < 350) {
      this.handleClick(this.touchStartX, this.touchStartY);
    }
  },

  handleClick(clickX, clickY) {
    if (!this.graph || !this.graph.all) return;
    let hitNode = null;
    let minDist = 28; // 28px 容差半径

    // 优先匹配靠近前方的节点 (Z 越大越优先)
    const sorted = this.graph.all.slice().sort((a, b) => b.z - a.z);
    for (let i = 0; i < sorted.length; i++) {
      const node = sorted[i];
      const d = Math.hypot(clickX - node.px, clickY - node.py);
      if (d < minDist) {
        hitNode = node;
        minDist = d;
      }
    }

    if (hitNode) {
      this.selectNodeByName(hitNode.name);
    } else {
      // 点击空白处取消高亮
      this.setData({ selectedNode: null, relatedDreams: [], relatedNeighbors: [] });
      this.draw();
    }
  },

  selectNodeByName(rawName) {
    const name = graphStore.normalizeMotif(rawName);
    if (!this.graph || !this.graph.nodes || !this.graph.nodes[name]) return;
    const node = this.graph.nodes[name];
    const neighbors = this.graph.adj[name] || [];
    const isEn = i18n.getLang() === "en";
    const catLabels = {
      action: isEn ? "Action" : "动作",
      item: isEn ? "Item" : "物品",
      location: isEn ? "Location" : "地点",
      emotion: isEn ? "Emotion" : "情绪"
    };

    this.setData({
      selectedNode: {
        name: node.name,
        displayName: node.displayName || (isEn ? i18n.translateMotif(node.name, "en") : node.name),
        cat: node.cat || "item",
        catLabel: catLabels[node.cat] || catLabels.item,
        count: node.count || 1,
        degree: node.degree || neighbors.length
      },
      relatedNeighbors: neighbors.slice(0, 8).map(nb => ({
        name: nb.name,
        displayName: nb.displayName || (isEn ? i18n.translateMotif(nb.name, "en") : nb.name),
        weight: nb.weight
      })),
      relatedDreams: node.dreams || []
    });

    wx.showToast({ title: (isEn ? "Focused: " : "已聚焦意象：") + (node.displayName || name), icon: "none" });
    this.draw();
  },

  switchViewMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ viewMode: mode }, () => {
      this.draw();
    });
  },

  toggleAutoRotate() {
    this.setData({ autoRotate: !this.data.autoRotate });
  },

  resetView() {
    this.setupNodesCoordinates();
    this.setData({ selectedNode: null, relatedDreams: [], relatedNeighbors: [] }, () => {
      this.draw();
    });
    const isEn = i18n.getLang() === "en";
    wx.showToast({ title: isEn ? "View reset" : "视角已重置", icon: "none" });
  },

  navToDreamDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({ url: "/pages/detail/detail?id=" + id });
    }
  },

  clearSelection() {
    this.setData({ selectedNode: null, relatedDreams: [], relatedNeighbors: [] });
    this.draw();
  }
});
