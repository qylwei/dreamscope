const LANG_STORAGE_KEY = "dreamscope_lang";

const locales = {
  zh: {
    langName: "中文",
    // TabBar
    tab_home: "首页",
    tab_workshop: "贴纸库",
    tab_graph: "图谱",
    tab_insights: "洞察",
    tab_settings: "我的",

    // Navigation titles
    nav_home: "DreamScope",
    nav_record: "记录梦境",
    nav_workshop: "贴纸实验室",
    nav_graph: "意象图谱",
    nav_insights: "梦境洞察",
    nav_detail: "梦境详情",
    nav_settings: "设置",

    // Timeline (首页)
    tl_activity_high: "✨ 活跃度·高",
    tl_activity_wait: "✨ 等待记录",
    tl_badge_ai: "AI 绘梦",
    tl_calendar_all: "全部",
    tl_calendar_today: "今天",
    tl_calendar_collapse: "收起 ▲",
    tl_calendar_expand: "展开 ▼",
    tl_archive_title: "📜 梦境档案",
    tl_total_prefix: "共",
    tl_total_suffix: "篇",
    tl_filtered_prefix: "🔍 已筛选",
    tl_clear_filter: "查看全部 ✕",
    tl_empty_date_title: "该日暂无梦境记录",
    tl_empty_date_sub: "你可以点击「查看全部」或在这一天记录一个新梦",
    tl_empty_global_title: "还没有梦境记录",
    tl_empty_global_sub: "清晨是记忆最鲜活的时刻，点击下方按钮开始记录",
    tl_view_all_dreams: "查看全部梦境",
    tl_btn_record: "🎤 记录梦境",
    tl_btn_workshop: "✨ 创作贴纸",
    tl_del_confirm_title: "删除梦境档案",
    tl_del_confirm_msg: "确定要永久删除这篇梦境吗？",
    tl_del_success: "已删除",
    tl_weeks: ["日", "一", "二", "三", "四", "五", "六"],
    tl_month_suffix: "月",
    tl_year_suffix: "年",

    // Record (记录)
    rec_title: "Voice Memo",
    rec_sub_tip: "说出你的梦境，录音结束后自动转写与绘图",
    rec_listening: "🎙️ 正在录音中，对着手机说话...",
    rec_record_ready: "✅ 录音已保存",
    rec_record_fail: "录音失败，请检查麦克风权限",
    rec_textarea_placeholder: "点击麦克风开始录音，也可以直接输入梦境细节...",
    rec_audio_name: "原声录音试听",
    rec_playing: "正在播放",
    rec_click_play: "点击试听",
    rec_btn_gen_ai: "对话生成 AI 梦境画面",
    rec_btn_regen_ai: "重新生成 AI 画面",
    rec_studio_title: "🎨 梦境画布 · 自由拼贴与手绘",
    rec_restore_bg: "恢复纯净底图",
    rec_mode_move: "🖐 移动贴纸",
    rec_mode_draw: "🖌 画笔手绘",
    rec_studio_tip: "👇 点选下方贴纸贴到画面 · 手指拖拽摆放 · 切画笔涂鸦",
    rec_strip_title: "✨ 点选意象贴纸，贴到 AI 图片上：",
    rec_gen_mini_placeholder: "没有想要的贴纸？现场生成一个（如：发光的钥匙）",
    rec_btn_make_sticker: "🪄 现场做贴纸",
    rec_sticker_card_title: "🎨 梦境贴纸",
    rec_sticker_open_lib: "从贴纸库选择",
    rec_sticker_close_lib: "收起贴纸库",
    rec_empty_stickers_tip: "点击上方「对话生成 AI 梦境画面」即可在画卷上自由拖拽粘贴贴纸与画笔涂鸦。",
    rec_cancel: "取消",
    rec_save_timeline: "💾 存入梦境时间线",
    rec_toast_saved: "梦境已存入时间线",
    rec_toast_sticker_added: "已贴上画卷，可拖动摆放",
    rec_toast_input_first: "请先录音或输入梦境内容",
    rec_toast_generating: "AI 构思画面中...",
    rec_toast_drawing: "AI 绘制插画中...",
    rec_toast_compositing: "正在合成画卷...",
    rec_toast_sticker_done: "新贴纸已生成并上屏",
    rec_mic_deny_title: "麦克风权限未开启",
    rec_mic_deny_msg: "录音功能需要使用麦克风，请在设置中允许访问。",
    rec_btn_setting: "去设置",
    rec_asr_off: "语音转文字需要智谱 API Key（我的 → AI 模型设置）；未配置时只保存录音",

    // Workshop (贴纸实验室)
    ws_tab_ai: "🤖 AI 生成",
    ws_tab_doodle: "✏️ 手绘",
    ws_tab_collage: "🧩 拼贴",
    ws_tab_db: "🎨 贴纸库",
    ws_ai_placeholder: "一只戴礼帽的猫咪在云朵上飞",
    ws_btn_ai_gen: "🪄 AI 实时生成",
    ws_btn_upload: "📷 上传图片",
    ws_btn_save_work: "保存到我的创作",
    ws_doodle_name_placeholder: "贴纸名称",
    ws_btn_doodle_save: "生成贴纸",
    ws_collage_tip: "点下面的贴纸放到画布；「移动」拖位置，「画笔」在贴纸上继续画。",
    ws_btn_clear_canvas: "清空画布",
    ws_btn_save_collage: "💾 保存作品",
    ws_cat_all: "全部",
    ws_cat_action: "🏃 动作",
    ws_cat_item: "📦 物品",
    ws_cat_location: "📍 地点",
    ws_cat_emotion: "🔮 情绪",
    ws_action_sheet_use: "在拼贴画板中使用",
    ws_action_sheet_copy: "复制贴纸名称",
    ws_toast_saved_to_db: "已存入贴纸库！",
    ws_toast_cleared: "画布已清空",

    // Graph (意象图谱)
    gp_title: "全量意象与关联",
    gp_nodes: "意象",
    gp_edges: "关联",
    gp_mode_sphere: "3D球体",
    gp_mode_obsidian: "Obsidian",
    gp_tip_sphere: "🌐 手指滑动可 360° 滚动球体 · 点击意象聚焦网络",
    gp_tip_obsidian: "🕸️ Obsidian 点状力导向关联图 · 拖拽平移探索",
    gp_hint_default: "💡 所有意象已全量呈现在上方图谱中；轻点任意节点即可高亮其关联网络与梦境溯源",
    gp_detail_close: "✕ 取消聚焦",
    gp_stat_occ: "🔥 出现",
    gp_stat_deg: "🔗 关联度",
    gp_sec_neighbors: "常伴意象：",
    gp_sec_dreams: "相关梦境档案 (点击查阅)：",
    gp_empty: "先记录一场梦，意象图谱会自动生成",
    gp_reset_toast: "视角已重置",
    gp_focused_toast: "已聚焦意象：",

    // Mine / Insights (洞察)
    in_emotion_spectrum: "🔮 本月情绪频谱",
    in_anxious: "焦虑",
    in_calm: "平静",
    in_joy: "喜悦",
    in_sad: "感伤",
    in_ai_monthly_title: "🧠 AI 月度总结",
    in_btn_generate: "生成",
    in_btn_generating: "生成中…",
    in_ai_empty_desc: "根据你的梦境记录，让 AI 总结本月的情绪走向和高频意象。",
    in_rank_title: "🏆 意象出场排行 Top5",
    in_trend_up: "▲上升",
    in_trend_flat: "持平",
    in_trend_down: "▼下降",
    in_trend_new: "▲新上榜",
    in_monthly_summary_card: "📋 本月总结",
    in_stat_stickers: "创作贴纸",
    in_stat_streak: "连续天数",
    in_stat_dreams: "梦境档案",
    in_stat_accuracy: "识别准确率",
    in_stat_ai: "AI 插画",
    in_empty_emotion: "记录梦境后，这里会自动生成情绪频谱",
    in_empty_rank: "还没有足够的意象记录",
    in_stat_note: "统计来自本机梦境记录，实时计算",

    // Detail (详情)
    dt_back: "← 返回",
    dt_stickers_title: "🏷️ 贴纸意象",
    dt_mini_graph_title: "🔗 微型关联图谱",
    dt_open_graph: "进入大图谱 ›",
    dt_related_tags: "📎 关联意象",
    dt_ai_interp_title: "🧠 AI 梦境解读",
    dt_btn_interp: "开始解读",
    dt_btn_interp_loading: "解读中…",
    dt_interp_empty: "点击「开始解读」，让 AI 从意象和情绪角度聊一聊这个梦。",
    dt_btn_play_audio: "🎧 播放原声",
    dt_btn_archive: "保存归档",
    dt_del_dream: "🗑️ 删除此篇梦境档案",
    dt_del_confirm_title: "删除梦境档案",
    dt_del_confirm_msg: "确定要永久删除这篇梦境吗？",

    // Settings (设置)
    st_title: "Settings",
    st_lang_card_title: "🌐 双语模式 / Language",
    st_lang_zh: "中文",
    st_lang_en: "English",
    st_lang_en_sub: "国际赛道通用",
    st_ai_card_title: "🤖 AI 模型设置",
    st_show_key: "显示 Key",
    st_hide_key: "隐藏 Key",
    st_status_ready: "梦境绘图已就绪",
    st_status_ready_sub: "已配置生图模型密钥，记录梦境将自动生成插画与贴纸。",
    st_status_need: "梦境绘图需生图大模型",
    st_status_need_sub: "推荐配置「智谱 GLM」密钥，内置 CogView 生图，国内直连免费体验。",
    st_sec_img_models: "🎨 可生成图片的大模型",
    st_badge_rec_all: "推荐 · 绘图与解梦全功能",
    st_sec_text_models: "💬 纯文本大模型",
    st_badge_text_only: "仅意象分析与解梦 · 不生图",
    st_copy_portal: "复制申请网址 ↗",
    st_text_model_label: "文本模型",
    st_image_model_label: "生图模型",
    st_btn_clear: "清空",
    st_btn_save: "保存",
    st_btn_test: "测试连接",
    st_note_text_only: "💡 说明：该模型仅支持文本解析与解梦；生成插画将自动调用已配置的智谱或 OpenAI 密钥，若未配置将采用本地精美艺术插画兜底。",
    st_note_keys_safe: "每个服务商需要各自的 Key；点芯片快速填入，也可以手动输入其他模型名。Key 仅保存在本机缓存，只在你发起 AI 请求时发送给对应服务商。",
    st_stats_note: "统计来自本机记录，实时计算",
    st_stats_title: "📊 全局统计",
    st_stat_dreams: "🌙 梦境档案",
    st_stat_stickers: "🎨 贴纸数",
    st_stat_streak: "🔥 连续天数",
    st_stat_ai_gen: "🤖 AI生成",
    st_row_notify: "🔔 通知设置",
    st_row_theme: "🎨 主题偏好",
    st_row_privacy: "🔒 隐私与安全",
    st_row_export: "💾 数据导出",
    st_row_about: "ℹ️ 关于 DreamScope"
  },
  en: {
    langName: "English",
    // TabBar
    tab_home: "Home",
    tab_workshop: "Stickers",
    tab_graph: "Graph",
    tab_insights: "Insights",
    tab_settings: "Settings",

    // Navigation titles
    nav_home: "DreamScope",
    nav_record: "Record Dream",
    nav_workshop: "Sticker Lab",
    nav_graph: "Dream Graph",
    nav_insights: "Dream Insights",
    nav_detail: "Dream Detail",
    nav_settings: "Settings",

    // Timeline (Home)
    tl_activity_high: "✨ High Activity",
    tl_activity_wait: "✨ Awaiting Record",
    tl_badge_ai: "AI Artwork",
    tl_calendar_all: "All",
    tl_calendar_today: "Today",
    tl_calendar_collapse: "Collapse ▲",
    tl_calendar_expand: "Calendar ▼",
    tl_archive_title: "📜 Dream Archives",
    tl_total_prefix: "Total",
    tl_total_suffix: "dreams",
    tl_filtered_prefix: "🔍 Filtered",
    tl_clear_filter: "Show All ✕",
    tl_empty_date_title: "No dreams on this day",
    tl_empty_date_sub: "Tap 'Show All' or record a new dream for this date",
    tl_empty_global_title: "No dream records yet",
    tl_empty_global_sub: "Morning is when memories are freshest. Tap below to begin.",
    tl_view_all_dreams: "View All Dreams",
    tl_btn_record: "🎤 Record Dream",
    tl_btn_workshop: "✨ Create Sticker",
    tl_del_confirm_title: "Delete Dream Archive",
    tl_del_confirm_msg: "Are you sure you want to permanently delete this dream?",
    tl_del_success: "Deleted",
    tl_weeks: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    tl_month_suffix: "",
    tl_year_suffix: "",

    // Record
    rec_title: "Voice Memo",
    rec_sub_tip: "Speak your dream — auto-transcribed and painted when you stop",
    rec_listening: "🎙️ Recording... Speak into phone",
    rec_record_ready: "✅ Audio saved",
    rec_record_fail: "Recording failed, check mic permissions",
    rec_textarea_placeholder: "Tap mic to record audio, or type dream details directly...",
    rec_audio_name: "Original Voice Audio",
    rec_playing: "Playing",
    rec_click_play: "Tap to listen",
    rec_btn_gen_ai: "Generate AI Dream Scene",
    rec_btn_regen_ai: "Regenerate AI Scene",
    rec_studio_title: "🎨 Dream Canvas · Collage & Doodle",
    rec_restore_bg: "Reset to Clean Image",
    rec_mode_move: "🖐 Move Sticker",
    rec_mode_draw: "🖌 Draw Brush",
    rec_studio_tip: "👇 Tap stickers below to add · Drag to place · Switch to brush to paint",
    rec_strip_title: "✨ Tap imagery stickers to paste onto AI scene:",
    rec_gen_mini_placeholder: "Need a new sticker? Create here (e.g. glowing key)",
    rec_btn_make_sticker: "🪄 Make Sticker",
    rec_sticker_card_title: "🎨 Dream Stickers",
    rec_sticker_open_lib: "Choose from Library",
    rec_sticker_close_lib: "Collapse Library",
    rec_empty_stickers_tip: "Tap 'Generate AI Dream Scene' above to freely paste stickers and draw on the canvas.",
    rec_cancel: "Cancel",
    rec_save_timeline: "💾 Save to Timeline",
    rec_toast_saved: "Dream saved to timeline",
    rec_toast_sticker_added: "Pasted on canvas, drag to position",
    rec_toast_input_first: "Please record or input dream details first",
    rec_toast_generating: "AI generating scene...",
    rec_toast_drawing: "AI painting artwork...",
    rec_toast_compositing: "Compositing artwork...",
    rec_toast_sticker_done: "New sticker created on canvas",
    rec_mic_deny_title: "Microphone Access Denied",
    rec_mic_deny_msg: "Recording requires microphone access. Please allow in settings.",
    rec_btn_setting: "Settings",
    rec_asr_off: "Speech-to-text needs a Zhipu API key (Me → AI Model Settings). Audio is still saved without it.",

    // Workshop
    ws_tab_ai: "🤖 AI Generate",
    ws_tab_doodle: "✏️ Doodle",
    ws_tab_collage: "🧩 Collage",
    ws_tab_db: "🎨 Sticker Library",
    ws_ai_placeholder: "A cat in a top hat flying through pastel clouds",
    ws_btn_ai_gen: "🪄 AI Real-time Gen",
    ws_btn_upload: "📷 Upload Image",
    ws_btn_save_work: "Save to My Creations",
    ws_doodle_name_placeholder: "Sticker Name",
    ws_btn_doodle_save: "Generate Sticker",
    ws_collage_tip: "Tap stickers below to place on canvas. 'Move' to drag, 'Draw' to paint over.",
    ws_btn_clear_canvas: "Clear Canvas",
    ws_btn_save_collage: "💾 Save Artwork",
    ws_cat_all: "All",
    ws_cat_action: "🏃 Action",
    ws_cat_item: "📦 Item",
    ws_cat_location: "📍 Location",
    ws_cat_emotion: "🔮 Emotion",
    ws_action_sheet_use: "Use in Collage Canvas",
    ws_action_sheet_copy: "Copy Sticker Name",
    ws_toast_saved_to_db: "Saved to Sticker Library!",
    ws_toast_cleared: "Canvas cleared",

    // Graph
    gp_title: "Imagery Network & Links",
    gp_nodes: "Nodes",
    gp_edges: "Edges",
    gp_mode_sphere: "3D Sphere",
    gp_mode_obsidian: "Obsidian",
    gp_tip_sphere: "🌐 Swipe to rotate 360° · Tap node to focus network",
    gp_tip_obsidian: "🕸️ Obsidian Force-Directed Graph · Drag & pan to explore",
    gp_hint_default: "💡 All imagery nodes are rendered above; tap any node to highlight connections and dream origins",
    gp_detail_close: "✕ Unfocus",
    gp_stat_occ: "🔥 Occurred",
    gp_stat_deg: "🔗 Degree",
    gp_sec_neighbors: "Co-occurring Imagery:",
    gp_sec_dreams: "Related Dream Archives (Tap to inspect):",
    gp_empty: "Record a dream first, and the graph will automatically generate",
    gp_reset_toast: "View reset",
    gp_focused_toast: "Focused on: ",

    // Mine / Insights
    in_emotion_spectrum: "🔮 Monthly Emotion Spectrum",
    in_anxious: "Anxious",
    in_calm: "Calm",
    in_joy: "Joyful",
    in_sad: "Melancholy",
    in_ai_monthly_title: "🧠 AI Monthly Summary",
    in_btn_generate: "Generate",
    in_btn_generating: "Generating…",
    in_ai_empty_desc: "Let AI synthesize your emotional patterns and recurring dream motifs for this month.",
    in_rank_title: "🏆 Top 5 Recurring Imagery",
    in_trend_up: "▲ Up",
    in_trend_flat: "— Steady",
    in_trend_down: "▼ Down",
    in_trend_new: "▲ New",
    in_monthly_summary_card: "📋 Monthly Overview",
    in_stat_stickers: "Stickers Made",
    in_stat_streak: "Day Streak",
    in_stat_dreams: "Dream Archives",
    in_stat_accuracy: "Analysis Accuracy",
    in_stat_ai: "AI Artworks",
    in_empty_emotion: "Record a dream and your emotion spectrum will appear here",
    in_empty_rank: "Not enough motif records yet",
    in_stat_note: "Computed live from your on-device records",

    // Detail
    dt_back: "← Back",
    dt_stickers_title: "🏷️ Dream Stickers",
    dt_mini_graph_title: "🔗 Mini Graph Network",
    dt_open_graph: "Open Graph View ›",
    dt_related_tags: "📎 Connected Motifs",
    dt_ai_interp_title: "🧠 AI Dream Interpretation",
    dt_btn_interp: "Interpret Dream",
    dt_btn_interp_loading: "Interpreting…",
    dt_interp_empty: "Tap 'Interpret Dream' to let AI analyze motifs, psychology, and emotional reflections.",
    dt_btn_play_audio: "🎧 Play Voice",
    dt_btn_archive: "Save Archive",
    dt_del_dream: "🗑️ Delete Dream Archive",
    dt_del_confirm_title: "Delete Dream Archive",
    dt_del_confirm_msg: "Are you sure you want to permanently delete this dream?",

    // Settings
    st_title: "Settings",
    st_lang_card_title: "🌐 Dual-Language Mode / 双语模式",
    st_lang_zh: "中文",
    st_lang_en: "English",
    st_lang_en_sub: "International track ready",
    st_ai_card_title: "🤖 AI Model Configuration",
    st_show_key: "Show Key",
    st_hide_key: "Hide Key",
    st_status_ready: "Dream Painting Ready",
    st_status_ready_sub: "Image generation key active. Artwork & stickers will generate automatically.",
    st_status_need: "Image Generation Model Needed",
    st_status_need_sub: "Recommend configuring Zhipu GLM (CogView) or OpenAI key for real-time painting.",
    st_sec_img_models: "🎨 Image Generation AI Models",
    st_badge_rec_all: "Recommended · Painting + Text Analysis",
    st_sec_text_models: "💬 Text-Only AI Models",
    st_badge_text_only: "Motifs & Interpretation Only · No Image",
    st_copy_portal: "Copy Portal URL ↗",
    st_text_model_label: "Text Model",
    st_image_model_label: "Image Model",
    st_btn_clear: "Clear",
    st_btn_save: "Save",
    st_btn_test: "Test Connection",
    st_note_text_only: "💡 Note: This provider only analyzes dream text. Image painting will borrow Zhipu/OpenAI key, or fall back to high-res local pop-art.",
    st_note_keys_safe: "Each provider uses its own key. Keys stay in local cache and are only sent to that provider when you make an AI request.",
    st_stats_note: "Computed live from your on-device records",
    st_stats_title: "📊 Global Statistics",
    st_stat_dreams: "🌙 Dream Archives",
    st_stat_stickers: "🎨 Stickers",
    st_stat_streak: "🔥 Day Streak",
    st_stat_ai_gen: "🤖 AI Generated",
    st_row_notify: "🔔 Notifications",
    st_row_theme: "🎨 Theme Preferences",
    st_row_privacy: "🔒 Privacy & Security",
    st_row_export: "💾 Export Data",
    st_row_about: "ℹ️ About DreamScope"
  }
};

function getLang() {
  const saved = wx.getStorageSync(LANG_STORAGE_KEY);
  return saved === "en" ? "en" : "zh";
}

function setLang(lang) {
  const finalLang = lang === "en" ? "en" : "zh";
  wx.setStorageSync(LANG_STORAGE_KEY, finalLang);
  updateTabBar(finalLang);
  return finalLang;
}

function toggleLang() {
  const cur = getLang();
  const next = cur === "zh" ? "en" : "zh";
  return setLang(next);
}

function getLocaleData(lang) {
  const target = lang || getLang();
  return locales[target] || locales.zh;
}

function updateTabBar(lang) {
  const l = lang || getLang();
  const t = locales[l] || locales.zh;
  const tabs = [
    { index: 0, text: t.tab_home },
    { index: 1, text: t.tab_workshop },
    { index: 2, text: t.tab_graph },
    { index: 3, text: t.tab_insights },
    { index: 4, text: t.tab_settings }
  ];

  tabs.forEach((tab) => {
    try {
      wx.setTabBarItem({
        index: tab.index,
        text: tab.text,
        fail: () => {}
      });
    } catch (e) {}
  });
}

const MOTIF_DICT = {
  "橘猫": "Orange Cat",
  "猫": "Cat",
  "帽子": "Hat",
  "漂浮的人": "Floating Man",
  "哭泣": "Crying",
  "大笑": "Laughing",
  "沙漏": "Hourglass",
  "时钟": "Clock",
  "发光钥匙": "Glowing Key",
  "钥匙": "Key",
  "云上桌子": "Table on Cloud",
  "飞碟UFO": "UFO",
  "飞碟": "UFO",
  "UFO飞船": "UFO Craft",
  "深海": "Deep Abyss",
  "水母": "Jellyfish",
  "发光水母": "Glowing Jellyfish",
  "海洋": "Ocean",
  "水流": "Water Stream",
  "倒计时": "Countdown",
  "考试": "Exams",
  "密封试卷": "Sealed Exam",
  "星空": "Starry Sky",
  "浩瀚星空": "Starry Galaxy",
  "售票机": "Ticket Machine",
  "夏天": "Summer",
  "童年": "Childhood",
  "云朵": "Clouds",
  "甜点": "Dessert",
  "治愈": "Healing",
  "面包橘猫": "Bread Cat",
  "糖果天际": "Candy Sky",
  "云端漫步": "Cloud Stroll",
  "温暖治愈": "Sweet Healing",
  "深海潜泳": "Deep Diving",
  "霓虹深海": "Neon Abyss",
  "焦虑恐慌": "Panic Surge",
  "极速飞翔": "Cosmic Flight",
  "星环宇宙": "Ring World",
  "宿命释怀": "Serenity",
  "快乐": "Joy",
  "玩具": "Toys",
  "滑梯": "Slide",
  "积木": "Building Blocks",
  "气球": "Balloons",
  "飞盘": "Frisbee",
  "玩具乐园": "Toy Wonderland",
  "追逐奔跑": "Chasing & Running",
  "废弃学校": "Deserted School",
  "倒转时钟": "Rewinding Clock",
  "悲伤泪流": "Tearful Grief",
  "惊喜欢笑": "Surprise Laughter",
  "倾盆大雨": "Torrential Rain",
  "彩虹滑梯": "Rainbow Slide",
  "魔术礼帽": "Magic Top Hat",
  "月亮": "Moon",
  "小狗": "Puppy",
  "飞鸟": "Flying Bird",
  "火焰": "Flames",
  "迷雾森林": "Misty Forest",
  "古树": "Ancient Tree",
  "高空飞行": "Sky Flight",
  "未命名意象": "Dream Motif",
  "拼贴作品": "Collage Work",
  "梦境": "Dream",
  "拥抱": "Embrace",
  "温馨": "Warmth",
  "家庭": "Family",
  "舒适": "Comfort",
  "安宁": "Tranquility",
  "休闲": "Leisure",
  "电视": "Television",
  "遥控器": "Remote Control",
  "床": "Bed",
  "睡觉": "Sleep",
  "做梦": "Dreaming",
  "房间": "Room",
  "卧室": "Bedroom",
  "窗户": "Window",
  "门": "Door",
  "光": "Light",
  "影子": "Shadow",
  "镜子": "Mirror",
  "水": "Water",
  "雨": "Rain",
  "风": "Wind",
  "雪": "Snow",
  "太阳": "Sun",
  "白天": "Daytime",
  "夜晚": "Night",
  "黑夜": "Dark Night",
  "路": "Road",
  "桥": "Bridge",
  "车": "Car",
  "船": "Boat",
  "飞机": "Airplane",
  "车站": "Station",
  "机场": "Airport",
  "山": "Mountain",
  "河": "River",
  "湖": "Lake",
  "公园": "Park",
  "花园": "Garden",
  "书": "Book",
  "笔": "Pen",
  "手机": "Phone",
  "电脑": "Computer",
  "衣服": "Clothes",
  "鞋子": "Shoes",
  "食物": "Food",
  "咖啡": "Coffee",
  "茶": "Tea",
  "面包": "Bread",
  "蛋糕": "Cake",
  "水果": "Fruit",
  "苹果": "Apple",
  "音乐": "Music",
  "歌声": "Singing",
  "画": "Painting",
  "朋友": "Friends",
  "同学": "Classmates",
  "老师": "Teacher",
  "父母": "Parents",
  "孩子": "Child",
  "婴儿": "Baby",
  "鸟": "Bird",
  "鱼": "Fish",
  "花": "Flower",
  "草": "Grass",
  "害怕": "Fear",
  "担心": "Worry",
  "紧张": "Tension",
  "放松": "Relaxation",
  "自由": "Freedom",
  "迷茫": "Confusion",
  "孤独": "Loneliness",
  "想念": "Missing",
  "希望": "Hope",
  "爱": "Love",
  "飞翔": "Flying",
  "坠落": "Falling",
  "奔跑": "Running",
  "游泳": "Swimming",
  "迷路": "Lost",
  "寻找": "Searching",
  "逃跑": "Escaping",
  "说话": "Talking",
  "歌唱": "Singing",
  "跳舞": "Dancing"
};

function translateMotif(name, lang) {
  if (!name) return "";
  const target = lang || getLang();
  if (target !== "en") return name;
  
  const raw = String(name).trim();
  if (MOTIF_DICT[raw]) return MOTIF_DICT[raw];

  // 带 emoji 前缀的处理 (如 "🏃 深海潜泳" -> "🏃 Deep Diving")
  const emojiMatch = raw.match(/^(\p{Extended_Pictographic}|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83E[\uDD00-\uDDFF]|\u2728|\u2600-\u2B55)\s*(.+)$/u);
  if (emojiMatch) {
    const icon = emojiMatch[1];
    const text = emojiMatch[2].trim();
    if (MOTIF_DICT[text]) {
      return icon + " " + MOTIF_DICT[text];
    }
  }
  return raw;
}

function formatBilingualDate(dateObj) {
  const now = dateObj || new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const day = now.getDay();
  const weekZh = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const weekEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return {
    date: m + "." + d + " " + weekZh[day],
    dateEn: monthEn[m - 1] + " " + d + " " + weekEn[day]
  };
}

function initPage(pageInstance, navKey) {
  const lang = getLang();
  const t = getLocaleData(lang);

  pageInstance.setData({
    currentLang: lang,
    t: t
  });

  // 设置导航条标题
  const title = (navKey && t[navKey]) || t.nav_home;
  try {
    wx.setNavigationBarTitle({ title: title, fail: () => {} });
  } catch (e) {}

  // 更新 TabBar
  updateTabBar(lang);
  return { lang, t };
}

module.exports = {
  getLang,
  setLang,
  toggleLang,
  getLocaleData,
  updateTabBar,
  initPage,
  translateMotif,
  formatBilingualDate,
  MOTIF_DICT
};
