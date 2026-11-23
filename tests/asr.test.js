const assert = require("node:assert/strict");
const test = require("node:test");

let savedKey = "test-key";
let upload;
let uploadCount = 0;
let requestCount = 0;

global.wx = {
  getStorageSync(name) {
    if (name === "dreamscope_ai_config") return { keys: { zhipu: savedKey } };
    return "";
  },
  uploadFile(options) {
    uploadCount++;
    upload(options);
  },
  request() {
    requestCount++;
  }
};

const asr = require("../utils/asr");

test("requires a Zhipu key and a recorded file", async () => {
  savedKey = "";
  await assert.rejects(asr.transcribe("clip.mp3"), /missing_zhipu_key/);
  savedKey = "test-key";
  await assert.rejects(asr.transcribe(""), /missing_audio/);
});

test("uploads the mp3 as multipart and returns recognized text", async () => {
  upload = (options) => {
    assert.equal(options.filePath, "clip.mp3");
    assert.equal(options.name, "file");
    assert.deepEqual(options.formData, { model: "glm-asr-2512" });
    assert.equal(options.header.Authorization, "Bearer test-key");
    options.success({ statusCode: 200, data: '{"text":"梦见一片海"}' });
  };
  assert.equal(await asr.transcribe("clip.mp3"), "梦见一片海");
});

test("keeps the original API and network errors without a second upload", async () => {
  const before = uploadCount;
  upload = (options) => options.success({
    statusCode: 401,
    data: '{"error":{"message":"unauthorized"}}'
  });
  await assert.rejects(asr.transcribe("clip.mp3"), /unauthorized/);
  upload = (options) => options.fail({ errMsg: "uploadFile:fail timeout" });
  await assert.rejects(asr.transcribe("clip.mp3"), /timeout/);
  assert.equal(uploadCount - before, 2);
  assert.equal(requestCount, 0);
});
