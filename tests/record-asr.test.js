const assert = require("node:assert/strict");
const test = require("node:test");

global.wx = {
  env: { USER_DATA_PATH: "wxfile://usr" },
  getStorageSync(name) {
    if (name === "dreamscope_ai_config") return { keys: { zhipu: "test-key" } };
    return "";
  },
  showToast() {}
};
global.getApp = () => ({});
let definition;
global.Page = (page) => { definition = page; };

const fileStore = require("../utils/fileStore");
const asr = require("../utils/asr");
require("../pages/record/record");

function makePage() {
  return Object.assign({}, definition, {
    data: Object.assign({}, definition.data, { recordDurationSec: 4, dreamText: "" }),
    setData(patch) { Object.assign(this.data, patch); },
    analyzeDreamKeywords() {}
  });
}

test("first transcription waits for the persisted recording path", async () => {
  let finishSave;
  fileStore.persistAudio = () => new Promise((resolve) => { finishSave = resolve; });
  const uploaded = [];
  asr.transcribe = (path) => {
    uploaded.push(path);
    return Promise.resolve("梦见一片海");
  };

  const page = makePage();
  page.handleRecordStop({ tempFilePath: "temp.mp3" });
  assert.equal(page.data.isTranscribing, true);
  assert.deepEqual(uploaded, []);

  finishSave("wxfile://usr/record.mp3");
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(uploaded, ["wxfile://usr/record.mp3"]);
  assert.equal(page.data.dreamText, "梦见一片海");
  assert.equal(page.data.tempAudioPath, "wxfile://usr/record.mp3");
  assert.equal(page.data.isTranscribing, false);
});

test("clearing while saving does not upload or restore the old recording", async () => {
  let finishSave;
  fileStore.persistAudio = () => new Promise((resolve) => { finishSave = resolve; });
  const uploaded = [];
  asr.transcribe = (path) => {
    uploaded.push(path);
    return Promise.resolve("旧录音");
  };

  const page = makePage();
  page.handleRecordStop({ tempFilePath: "temp.mp3" });
  page.clearText();
  finishSave("wxfile://usr/record.mp3");
  await Promise.resolve();
  assert.deepEqual(uploaded, []);
  assert.equal(page.data.tempAudioPath, "");
  assert.equal(page.data.dreamText, "");
});
