/**
 * 本机文件持久化与回收
 * - 录音/插画都通过 saveFile 落到本机持久目录（否则临时路径重启即失效）
 * - 删除梦境时回收对应文件
 * - 启动时清理没有记录引用的孤儿文件，避免 10MB 配额被吃满
 */

const USER_ROOT = (wx.env && wx.env.USER_DATA_PATH) || "wxfile://usr";

function isUserFile(path) {
  if (!path || typeof path !== "string") return false;
  return (
    path.indexOf(USER_ROOT) === 0 ||
    path.indexOf("wxfile://usr") === 0 ||
    path.indexOf("http://usr") === 0
  );
}

function saveFile(tempPath) {
  return new Promise(function (resolve) {
    if (!tempPath) return resolve("");
    // 已经在持久目录，或本身就是代码包内资源（/assets/...），无需再存
    if (isUserFile(tempPath)) return resolve(tempPath);
    if (tempPath.charAt(0) === "/") return resolve(tempPath);
    try {
      wx.getFileSystemManager().saveFile({
        tempFilePath: tempPath,
        success: function (res) { resolve((res && res.savedFilePath) || ""); },
        fail: function () { resolve(""); }
      });
    } catch (e) {
      resolve("");
    }
  });
}

function listSaved() {
  return new Promise(function (resolve) {
    try {
      wx.getFileSystemManager().getSavedFileList({
        success: function (res) { resolve((res && res.fileList) || []); },
        fail: function () { resolve([]); }
      });
    } catch (e) {
      resolve([]);
    }
  });
}

function removeSaved(path) {
  if (!isUserFile(path)) return Promise.resolve(false);
  return new Promise(function (resolve) {
    const fs = wx.getFileSystemManager();
    const done = function (ok) { resolve(ok); };
    if (fs.removeSavedFile) {
      fs.removeSavedFile({
        filePath: path,
        success: function () { done(true); },
        fail: function () { done(false); }
      });
    } else {
      fs.unlink({ filePath: path, success: function () { done(true); }, fail: function () { done(false); } });
    }
  });
}

/**
 * 收集所有仍被记录引用的本机文件
 */
function collectRefs() {
  const refs = {};
  try {
    const dreams = wx.getStorageSync("dreamscope_dreams") || [];
    dreams.forEach(function (d) {
      if (!d) return;
      [d.image, d.audioUrl].forEach(function (p) { if (p) refs[p] = 1; });
      (d.stickers || []).forEach(function (s) { if (s && s.src) refs[s.src] = 1; });
    });
    const mine = wx.getStorageSync("dreamscope_my_stickers") || [];
    mine.forEach(function (s) { if (s && s.src) refs[s.src] = 1; });
  } catch (e) {}
  return refs;
}

function cleanupOrphans(extraRefs) {
  return listSaved().then(function (files) {
    const refs = collectRefs();
    Object.keys(extraRefs || {}).forEach(function (k) { refs[k] = 1; });
    let removed = 0;
    files.forEach(function (f) {
      const p = f && f.filePath;
      if (p && !refs[p]) {
        removed += 1;
        removeSaved(p);
      }
    });
    return removed;
  });
}

/**
 * 保存文件；配额不足时先清理孤儿文件再重试一次
 */
function persist(tempPath, extraRefs) {
  return saveFile(tempPath).then(function (saved) {
    if (saved) return saved;
    return cleanupOrphans(extraRefs).then(function () {
      return saveFile(tempPath);
    }).then(function (retry) {
      return retry || tempPath || "";
    });
  });
}

function persistImage(tempPath) {
  return persist(tempPath);
}

function persistAudio(tempPath) {
  return persist(tempPath);
}

function removeDreamFiles(dream) {
  if (!dream) return Promise.resolve();
  const tasks = [];
  if (dream.image) tasks.push(removeSaved(dream.image));
  if (dream.audioUrl) tasks.push(removeSaved(dream.audioUrl));
  // 贴纸可能被多条梦境共用，不在这里删除
  return Promise.all(tasks);
}

module.exports = {
  isUserFile: isUserFile,
  saveFile: saveFile,
  listSaved: listSaved,
  removeSaved: removeSaved,
  collectRefs: collectRefs,
  cleanupOrphans: cleanupOrphans,
  persistImage: persistImage,
  persistAudio: persistAudio,
  removeDreamFiles: removeDreamFiles
};
