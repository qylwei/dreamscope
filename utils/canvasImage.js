/**
 * Canvas 2D 图片加载（兼容代码包路径 / 本机文件 / 网络图片）
 *
 * 小程序里 canvas.createImage() 对「代码包相对路径」的支持并不稳定：
 * 同一个路径在 <image> 里能显示，在 canvas 里却可能 onerror。
 * 这里依次尝试：
 *   1. /assets/xxx.png（带前导斜杠）
 *   2. assets/xxx.png（不带斜杠）
 *   3. wx.getImageInfo 解析出的本地路径
 * 任意一个成功即返回 Image。
 */

function candidates(src) {
  const raw = String(src || "").trim();
  if (!raw) return [];
  if (/^(wxfile:|http:\/\/|https:\/\/|data:)/.test(raw)) return [raw];
  const noLead = raw.charAt(0) === "/" ? raw.slice(1) : raw;
  return ["/" + noLead, noLead];
}

function load(canvas, src, timeoutMs) {
  return new Promise(function (resolve) {
    if (!canvas || !src) return resolve(null);
    const paths = candidates(src);
    let index = 0;
    let settled = false;

    const finish = function (img) {
      if (settled) return;
      settled = true;
      resolve(img || null);
    };

    const tryPath = function (path) {
      if (!path) return next();
      let img;
      try {
        img = canvas.createImage();
      } catch (e) {
        return next();
      }
      img.onload = function () { finish(img); };
      img.onerror = function () { next(); };
      img.src = path;
    };

    const next = function () {
      if (settled) return;
      if (index < paths.length) return tryPath(paths[index++]);
      if (index === paths.length) {
        index += 1;
        // 最后再尝试 getImageInfo 解析本地路径
        try {
          wx.getImageInfo({
            src: paths[paths.length - 1] || src,
            success: function (info) {
              if (info && info.path) tryPath(info.path);
              else finish(null);
            },
            fail: function () { finish(null); }
          });
        } catch (e) {
          finish(null);
        }
        return;
      }
      finish(null);
    };

    next();
    setTimeout(function () { finish(null); }, timeoutMs || 4000);
  });
}

module.exports = { load: load };
