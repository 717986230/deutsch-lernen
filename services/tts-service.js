// ──────────────────────────────────────────────────────────────
// tts-service.js — 德语朗读（微信同声传译插件 WechatSI）
// 接入方式：
//   1) 先在小程序后台「设置 → 第三方服务 → 插件管理」添加「同声传译」插件
//      （AppID wx069ba97219f66d99），再在 app.json 的 plugins 里声明 WechatSI；
//   2) 本服务调插件 textToSpeech 合成音频，再用 InnerAudioContext 播放，
//      语速用 InnerAudioContext.playbackRate 实现（0.5–1.5，存在 storage 'tts-rate'）。
// 不做跟读录音/评分：上游 site 2026-11-18 提交是“去掉词句卡跟读录音”，
// 恢复前需用户确认，所以这里只有朗读。
//
// ⚠️ 真机待验证（本机无法验证）：插件文档只明确列出中文/英文的朗读支持，
// 德语 lang 'de_DE' 是否可用、以及插件版本号 0.3.4 是否仍有效，
// 必须在微信开发者工具真机预览里点一次 🔊 确认；若插件报不支持，
// 把下面 LANG 改成插件实际支持的德语值，或改走云端 TTS 方案。
// 失败时只弹 toast，不抛错、不阻塞页面。
// ──────────────────────────────────────────────────────────────

const PLUGIN_NAME = 'WechatSI'
const LANG = 'de_DE'
const RATE_KEY = 'tts-rate'
const DEFAULT_RATE = 1.0

let _audio = null // InnerAudioContext 单例
let _speakingText = ''

function _hasWx() {
  return typeof wx !== 'undefined' && wx !== null
}

/** 当前语速（0.5–1.5），默认 1.0 */
function getRate() {
  if (!_hasWx()) return DEFAULT_RATE
  try {
    const r = wx.getStorageSync(RATE_KEY)
    return typeof r === 'number' && r >= 0.5 && r <= 1.5 ? r : DEFAULT_RATE
  } catch (e) {
    return DEFAULT_RATE
  }
}

function setRate(rate) {
  const n = Number(rate)
  const r = Math.min(1.5, Math.max(0.5, isNaN(n) ? DEFAULT_RATE : n))
  if (!_hasWx()) return r
  try {
    wx.setStorageSync(RATE_KEY, r)
  } catch (e) {}
  if (_audio) {
    try {
      _audio.playbackRate = r
    } catch (e) {}
  }
  return r
}

function stop() {
  _speakingText = ''
  if (_audio) {
    try {
      _audio.stop()
    } catch (e) {}
  }
}

function _playFile(filename) {
  if (!_hasWx()) return
  try {
    if (!_audio) {
      _audio = wx.createInnerAudioContext()
      _audio.onEnded(() => {
        _speakingText = ''
      })
      _audio.onError(() => {
        _speakingText = ''
      })
    }
    _audio.stop()
    _audio.src = filename
    try {
      _audio.playbackRate = getRate()
    } catch (e) {}
    _audio.play()
  } catch (e) {
    wx.showToast({ title: '朗读播放失败', icon: 'none' })
  }
}

/**
 * 朗读一段德语。插件不可用/合成失败时弹 toast 并返回 false。
 * @param {string} text 德语文本
 * @returns {boolean} 是否已发起合成
 */
function speak(text) {
  if (!text || !_hasWx()) return false
  // 点同一句正在读时，再点一次即停止（切换式）
  if (_speakingText === text) {
    stop()
    return true
  }
  let plugin
  try {
    plugin = requirePlugin(PLUGIN_NAME)
  } catch (e) {
    wx.showToast({ title: '朗读插件未添加，请先在后台添加同声传译插件', icon: 'none' })
    return false
  }
  _speakingText = text
  try {
    plugin.textToSpeech({
      lang: LANG,
      tts: true,
      content: text,
      success(res) {
        if (res && res.filename) {
          _playFile(res.filename)
        } else {
          _speakingText = ''
          wx.showToast({ title: '朗读失败，请重试', icon: 'none' })
        }
      },
      fail() {
        _speakingText = ''
        wx.showToast({ title: '德语朗读暂不可用，请检查插件与网络', icon: 'none' })
      },
    })
  } catch (e) {
    _speakingText = ''
    wx.showToast({ title: '朗读暂不可用', icon: 'none' })
    return false
  }
  return true
}

module.exports = { speak, stop, getRate, setRate, LANG }
