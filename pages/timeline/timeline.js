const app = getApp();
const i18n = require("../../utils/i18n");
const fileStore = require("../../utils/fileStore");

const weekDayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const monthEnNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

Page({
  data: {
    currentLang: "zh",
    t: {},
    calYear: 2026,
    calMonth: 10,
    selectedDateKey: "",      // 如 "10.23"，为空表示展示全部
    selectedDateLabel: "全部档案",
    calendarExpanded: true,
    calendarDays: [],
    allDreams: [],
    filteredDreams: [],
    featuredDream: null,
    dreamDateSet: {},         // 记录有梦境的 "M.D" 集合
    totalCount: 0
  },

  onLoad() {
    const now = new Date();
    const todayKey = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
    this.setData({
      calYear: now.getFullYear(),
      calMonth: now.getMonth() + 1,
      selectedDateKey: todayKey
    });
  },

  onShow() {
    i18n.initPage(this, "nav_home");
    this.loadDreams();
  },

  loadDreams() {
    const list = wx.getStorageSync("dreamscope_dreams") || app.globalData.defaultDreams;

    // 用「年-月-日」作为键，避免 2025-10-23 与 2026-10-23 互相串数据
    const dateSet = {};
    list.forEach((d) => {
      if (!d) return;
      if (!d.year || !d.month || !d.day) {
        const hit = String(d.date || "").match(/(\d{1,2})\s*[.\-/]\s*(\d{1,2})/);
        if (hit) {
          d.year = d.year || new Date().getFullYear();
          d.month = Number(hit[1]);
          d.day = Number(hit[2]);
        }
      }
      if (d.year && d.month && d.day) {
        d.dateKey = d.year + "-" + d.month + "-" + d.day;
        dateSet[d.dateKey] = (dateSet[d.dateKey] || 0) + 1;
      }
      if (!d.dateEn && d.date) {
        const parts = d.date.split(" ");
        const md = parts[0].split(".");
        if (md.length === 2) {
          const mIdx = parseInt(md[0], 10) - 1;
          const dayNum = md[1];
          const mName = monthEnNames[mIdx] || md[0];
          d.dateEn = `${mName} ${dayNum}`;
        }
      }
      if (!d.titleEn) {
        d.titleEn = i18n.translateMotif(d.title, "en");
      }
      if (Array.isArray(d.stickers)) {
        d.stickers.forEach((s) => {
          if (!s.nameEn) {
            s.nameEn = i18n.translateMotif(s.name, "en");
          }
        });
      }
      if (Array.isArray(d.tags) && (!d.tagsEn || !d.tagsEn.length)) {
        d.tagsEn = d.tags.map((t) => i18n.translateMotif(t, "en"));
      }
    });

    // 当前月份没有记录时，自动跳到最近一条记录所在月份
    let curYear = this.data.calYear;
    let curMonth = this.data.calMonth;
    const keys = Object.keys(dateSet);
    const hasInCurrentMonth = keys.some((k) => {
      const p = k.split("-");
      return Number(p[0]) === curYear && Number(p[1]) === curMonth;
    });
    if (!hasInCurrentMonth && keys.length > 0 && !this._hasManuallySwitchedMonth) {
      const sorted = keys.slice().sort();
      const latest = sorted[sorted.length - 1].split("-");
      curYear = Number(latest[0]) || curYear;
      curMonth = Number(latest[1]) || curMonth;
    }

    this.setData({
      allDreams: list,
      totalCount: list.length,
      dreamDateSet: dateSet,
      calYear: curYear,
      calMonth: curMonth
    }, () => {
      this.buildCalendar();
      this.applyFilter();
    });
  },

  buildCalendar() {
    const y = this.data.calYear;
    const m = this.data.calMonth;
    const firstDayIndex = new Date(y, m - 1, 1).getDay(); // 当月第一天星期几 (0-6)
    const daysInMonth = new Date(y, m, 0).getDate();       // 当月总天数
    const dateSet = this.data.dreamDateSet || {};
    const selectedKey = this.data.selectedDateKey;
    const now = new Date();

    const days = [];
    // 前置空白格
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNum: "", empty: true });
    }
    // 当月每一天
    for (let d = 1; d <= daysInMonth; d++) {
      const key = y + "-" + m + "-" + d;
      days.push({
        dayNum: d,
        empty: false,
        dateKey: key,
        hasDream: !!dateSet[key],
        dreamCount: dateSet[key] || 0,
        isToday: y === now.getFullYear() && m === now.getMonth() + 1 && d === now.getDate(),
        isSelected: key === selectedKey
      });
    }

    this.setData({ calendarDays: days });
  },

  applyFilter() {
    const selectedKey = this.data.selectedDateKey;
    const all = this.data.allDreams;
    const isEn = this.data.currentLang === "en";
    let filtered = all;
    let label = isEn ? "All Archives" : "全部档案";

    if (selectedKey) {
      const parts = selectedKey.split("-");
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const d = Number(parts[2]);
      filtered = all.filter((item) => {
        let iy = Number(item.year);
        let im = Number(item.month);
        let id = Number(item.day);
        if (!iy || !im || !id) {
          const hit = String(item.date || "").match(/(\d{1,2})\s*[.\-/]\s*(\d{1,2})/);
          if (!hit) return false;
          iy = new Date().getFullYear();
          im = Number(hit[1]);
          id = Number(hit[2]);
        }
        return iy === y && im === m && id === d;
      });
      label = isEn ? `${monthEnNames[m - 1] || m} ${d}` : `${m}月${d}日`;
    }

    this.setData({
      filteredDreams: filtered,
      featuredDream: filtered.length > 0 ? filtered[0] : null,
      selectedDateLabel: label
    });
  },

  prevMonth() {
    this._hasManuallySwitchedMonth = true;
    let y = this.data.calYear;
    let m = this.data.calMonth - 1;
    if (m < 1) { m = 12; y--; }
    this.setData({ calYear: y, calMonth: m }, () => {
      this.buildCalendar();
    });
  },

  nextMonth() {
    this._hasManuallySwitchedMonth = true;
    let y = this.data.calYear;
    let m = this.data.calMonth + 1;
    if (m > 12) { m = 1; y++; }
    this.setData({ calYear: y, calMonth: m }, () => {
      this.buildCalendar();
    });
  },

  onDayClick(e) {
    const item = e.currentTarget.dataset.item;
    if (!item || item.empty) return;
    const key = item.dateKey;
    // 如果再次点击已选中的日期，则取消过滤查看全部
    const nextKey = this.data.selectedDateKey === key ? "" : key;
    this.setData({ selectedDateKey: nextKey }, () => {
      this.buildCalendar();
      this.applyFilter();
    });
  },

  selectAllDates() {
    this.setData({ selectedDateKey: "" }, () => {
      this.buildCalendar();
      this.applyFilter();
    });
  },

  goToToday() {
    const now = new Date();
    const todayKey = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
    this._hasManuallySwitchedMonth = true;
    this.setData({
      calYear: now.getFullYear(),
      calMonth: now.getMonth() + 1,
      selectedDateKey: todayKey
    }, () => {
      this.buildCalendar();
      this.applyFilter();
    });
  },

  toggleCalendar() {
    this.setData({ calendarExpanded: !this.data.calendarExpanded });
  },

  deleteDream(e) {
    const id = e.currentTarget.dataset.id;
    const isEn = i18n.getLang() === "en";
    const t = this.data.t || {};
    const current = wx.getStorageSync("dreamscope_dreams") || app.globalData.defaultDreams;
    const target = current.find((d) => d.id === id) || null;

    // 删除确认里显示当前语言对应的标题，避免英文界面弹出中文标题
    const rawTitle = target
      ? (isEn ? (target.titleEn || target.title) : (target.title || target.titleEn))
      : "";
    // 英文界面下，若标题仍是中文（旧记录/未翻译），就不要把它拼进英文确认框
    const safeTitle = (isEn && /[\u4e00-\u9fa5]/.test(rawTitle)) ? "" : rawTitle;
    const title = safeTitle || (isEn ? "this dream" : "这篇梦境");
    const message = t.tl_del_confirm_msg || (isEn ? "Delete this dream permanently?" : "确定要永久删除这篇梦境吗？");

    wx.showModal({
      title: t.tl_del_confirm_title || (isEn ? "Delete Dream Archive" : "删除梦境档案"),
      content: message + (isEn ? ` ("${title}")` : `（${title}）`),
      confirmColor: "#FF3B30",
      confirmText: isEn ? "Delete" : "删除",
      cancelText: isEn ? "Cancel" : "取消",
      success: (res) => {
        if (res.confirm) {
          const list = current.filter((d) => d.id !== id);
          wx.setStorageSync("dreamscope_dreams", list);
          // 同步回收该条梦境的插画/录音文件
          if (target) fileStore.removeDreamFiles(target);
          wx.showToast({ title: t.tl_del_success || (isEn ? "Deleted" : "已删除"), icon: "success" });
          this.loadDreams();
        }
      }
    });
  },

  navToRecord() {
    wx.navigateTo({ url: "/pages/record/record" });
  },
  navToWorkshop() {
    getApp().globalData.workshopTab = "ai";
    wx.switchTab({ url: "/pages/workshop/workshop" });
  },
  navToMine() {
    wx.switchTab({ url: "/pages/mine/mine" });
  },
  navToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: "/pages/detail/detail?id=" + id });
  }
});
