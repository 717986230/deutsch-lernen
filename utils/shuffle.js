// ──────────────────────────────────────────────────────────────
// utils/shuffle.js — 通用工具
// ──────────────────────────────────────────────────────────────

/**
 * 返回数组的随机打乱副本（Fisher-Yates 洗牌）
 * @param {Array} arr
 * @returns {Array}
 */
function shuffle(arr) {
  var copy = arr.slice();
  for (var i = copy.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

/**
 * 从 pool 中随机取 n 个与 current 不同的干扰项
 * @param {Array} pool 候选池
 * @param {*} current 当前正确答案
 * @param {number} n 取几个
 * @param {Function} keyFn 取比较用 key 的函数，默认 identity
 * @returns {Array}
 */
function pickWrong(pool, current, n, keyFn) {
  keyFn = keyFn || function (x) { return x; };
  var currentKey = keyFn(current);
  var candidates = pool.filter(function (item) {
    return keyFn(item) !== currentKey;
  });
  var shuffled = shuffle(candidates);
  return shuffled.slice(0, n);
}

module.exports = { shuffle, pickWrong };
