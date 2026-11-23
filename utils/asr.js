/**
 * 语音转文字（智谱 GLM-ASR-2512）
 *
 * 不依赖微信插件，直接复用用户已配置的智谱 API Key：
 *   POST https://open.bigmodel.cn/api/paas/v4/audio/transcriptions
 *   multipart: file=<音频>, model=glm-asr-2512
 * 返回 { text: "..." }
 *
 * 官方限制：音频时长 ≤ 30 秒、文件 ≤ 25 MB，支持 mp3 / wav。
 * 使用 wx.uploadFile 发送 multipart 请求。
 */

const ai = require("./ai");

const API_URL = "https://open.bigmodel.cn/api/paas/v4/audio/transcriptions";
const MODEL = "glm-asr-2512";
const MAX_DURATION = 30000;

let recorder = null;
let handlers = null;

function getKey() {
  const cfg = ai.getConfig();
  return ((cfg.keys && cfg.keys.zhipu) || "").trim();
}

function hasKey() {
  return !!getKey();
}

function emit(name, payload) {
  if (handlers && typeof handlers[name] === "function") {
    try {
      handlers[name](payload);
    } catch (e) {
      console.error("[asr] handler error", name, e);
    }
  }
}

/**
 * 录音器（RecorderManager 是单例，这里统一管理监听，避免重复注册）
 */
function createRecorder(h) {
  handlers = h || {};
  if (!recorder) recorder = wx.getRecorderManager();
  if (recorder.offStart) recorder.offStart();
  if (recorder.offStop) recorder.offStop();
  if (recorder.offError) recorder.offError();
  recorder.onStart(function () { emit("onStart", {}); });
  recorder.onStop(function (res) { emit("onStop", res || {}); });
  recorder.onError(function (res) { emit("onError", res || {}); });

  return {
    mode: "api",
    start: function () {
      try {
        recorder.start({
          duration: MAX_DURATION,
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 48000,
          format: "mp3"
        });
        return true;
      } catch (e) {
        emit("onError", { errMsg: (e && e.message) || "recorder_start_failed" });
        return false;
      }
    },
    stop: function () {
      try { recorder.stop(); } catch (e) {}
    },
    dispose: function () {
      handlers = null;
      if (recorder) {
        if (recorder.offStart) recorder.offStart();
        if (recorder.offStop) recorder.offStop();
        if (recorder.offError) recorder.offError();
      }
    }
  };
}

function parseBody(res) {
  let data = res && res.data;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch (e) { data = null; }
  }
  return data;
}

function errorMessage(data, statusCode, fallback) {
  if (data && data.error) {
    return data.error.message || data.error.code || fallback;
  }
  if (data && data.message) return data.message;
  if (statusCode) return "HTTP " + statusCode;
  return fallback;
}

function uploadMultipart(filePath, key) {
  return new Promise(function (resolve, reject) {
    wx.uploadFile({
      url: API_URL,
      filePath: filePath,
      name: "file",
      formData: { model: MODEL },
      header: { Authorization: "Bearer " + key },
      timeout: 60000,
      success: function (res) {
        const data = parseBody(res);
        const ok = res.statusCode >= 200 && res.statusCode < 300;
        if (ok && data && data.text) return resolve(String(data.text).trim());
        reject(new Error(errorMessage(data, res.statusCode, "transcription_failed")));
      },
      fail: function (err) {
        reject(new Error((err && err.errMsg) || "upload_failed"));
      }
    });
  });
}

function transcribe(filePath) {
  const key = getKey();
  if (!key) {
    return Promise.reject(new Error("missing_zhipu_key"));
  }
  if (!filePath) {
    return Promise.reject(new Error("missing_audio"));
  }
  return uploadMultipart(filePath, key);
}

module.exports = {
  createRecorder: createRecorder,
  transcribe: transcribe,
  hasKey: hasKey,
  MAX_DURATION: MAX_DURATION
};
