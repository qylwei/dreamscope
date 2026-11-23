const fileStore = require("./fileStore");

const STORAGE_KEY = "dreamscope_my_stickers";

function getMyStickers() {
  const list = wx.getStorageSync(STORAGE_KEY) || [];
  return list.map((s) => Object.assign({}, s, {
    nameEn: s.nameEn || s.name
  }));
}

function addMySticker(sticker) {
  const list = wx.getStorageSync(STORAGE_KEY) || [];
  const item = Object.assign({}, sticker);
  if (!item.nameEn) item.nameEn = item.name;
  list.unshift(item);
  wx.setStorageSync(STORAGE_KEY, list);
  return list;
}

function getAllStickers() {
  const app = getApp();
  const builtin = (app.globalData.stickers || []).map((s) => Object.assign({}, s, {
    nameEn: s.nameEn || s.name
  }));
  return getMyStickers().concat(builtin);
}

function persistImage(tempPath) {
  return fileStore.persistImage(tempPath);
}

function removeStickerFile(src) {
  return fileStore.removeSaved(src);
}

module.exports = {
  getMyStickers,
  addMySticker,
  getAllStickers,
  persistImage,
  removeStickerFile
};
