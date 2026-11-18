// ──────────────────────────────────────────────────────────────
// utils/conj.js — 动词变位测验题库（现在时）
// 原样移植自 tools/offline-template.html 的 VERB_CONJ / CONJ_PERSON
// （离线版已验证的 32 个高频动词），小程序测验直接复用。
// f 顺序固定：[ich, du, er/sie/es, wir, ihr, sie/Sie]
// ──────────────────────────────────────────────────────────────

const VERB_CONJ = [
  { inf: 'machen', zh: '做', f: ['mache', 'machst', 'macht', 'machen', 'macht', 'machen'] },
  { inf: 'lernen', zh: '学', f: ['lerne', 'lernst', 'lernt', 'lernen', 'lernt', 'lernen'] },
  { inf: 'spielen', zh: '玩', f: ['spiele', 'spielst', 'spielt', 'spielen', 'spielt', 'spielen'] },
  { inf: 'wohnen', zh: '住', f: ['wohne', 'wohnst', 'wohnt', 'wohnen', 'wohnt', 'wohnen'] },
  { inf: 'kommen', zh: '来', f: ['komme', 'kommst', 'kommt', 'kommen', 'kommt', 'kommen'] },
  { inf: 'gehen', zh: '走/去', f: ['gehe', 'gehst', 'geht', 'gehen', 'geht', 'gehen'] },
  { inf: 'sein', zh: '是', f: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'] },
  { inf: 'haben', zh: '有', f: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'] },
  { inf: 'fahren', zh: '开车/行驶', f: ['fahre', 'fährst', 'fährt', 'fahren', 'fahrt', 'fahren'] },
  { inf: 'sehen', zh: '看见', f: ['sehe', 'siehst', 'sieht', 'sehen', 'seht', 'sehen'] },
  { inf: 'essen', zh: '吃', f: ['esse', 'isst', 'isst', 'essen', 'esst', 'essen'] },
  { inf: 'sprechen', zh: '说', f: ['spreche', 'sprichst', 'spricht', 'sprechen', 'sprecht', 'sprechen'] },
  { inf: 'nehmen', zh: '拿', f: ['nehme', 'nimmst', 'nimmt', 'nehmen', 'nehmt', 'nehmen'] },
  { inf: 'lesen', zh: '读', f: ['lese', 'liest', 'liest', 'lesen', 'lest', 'lesen'] },
  { inf: 'geben', zh: '给', f: ['gebe', 'gibst', 'gibt', 'geben', 'gebt', 'geben'] },
  { inf: 'lachen', zh: '笑', f: ['lache', 'lachst', 'lacht', 'lachen', 'lacht', 'lachen'] },
  { inf: 'singen', zh: '唱', f: ['singe', 'singst', 'singt', 'singen', 'singt', 'singen'] },
  { inf: 'laufen', zh: '跑', f: ['laufe', 'läufst', 'läuft', 'laufen', 'lauft', 'laufen'] },
  { inf: 'trinken', zh: '喝', f: ['trinke', 'trinkst', 'trinkt', 'trinken', 'trinkt', 'trinken'] },
  { inf: 'schlafen', zh: '睡', f: ['schlafe', 'schläfst', 'schläft', 'schlafen', 'schlaft', 'schlafen'] },
  { inf: 'wissen', zh: '知道', f: ['weiß', 'weißt', 'weiß', 'wissen', 'wisst', 'wissen'] },
  { inf: 'finden', zh: '找到', f: ['finde', 'findest', 'findet', 'finden', 'findet', 'finden'] },
  { inf: 'helfen', zh: '帮助', f: ['helfe', 'hilfst', 'hilft', 'helfen', 'helft', 'helfen'] },
  { inf: 'sagen', zh: '说', f: ['sage', 'sagst', 'sagt', 'sagen', 'sagt', 'sagen'] },
  { inf: 'fragen', zh: '问', f: ['frage', 'fragst', 'fragt', 'fragen', 'fragt', 'fragen'] },
  { inf: 'brauchen', zh: '需要', f: ['brauche', 'brauchst', 'braucht', 'brauchen', 'braucht', 'brauchen'] },
  { inf: 'denken', zh: '认为', f: ['denke', 'denkst', 'denkt', 'denken', 'denkt', 'denken'] },
  { inf: 'glauben', zh: '相信', f: ['glaube', 'glaubst', 'glaubt', 'glauben', 'glaubt', 'glauben'] },
  { inf: 'hören', zh: '听', f: ['höre', 'hörst', 'hört', 'hören', 'hört', 'hören'] },
  { inf: 'schreiben', zh: '写', f: ['schreibe', 'schreibst', 'schreibt', 'schreiben', 'schreibt', 'schreiben'] },
  { inf: 'öffnen', zh: '打开', f: ['öffne', 'öffnest', 'öffnet', 'öffnen', 'öffnet', 'öffnen'] },
  { inf: 'kennen', zh: '认识', f: ['kenne', 'kennst', 'kennt', 'kennen', 'kennt', 'kennen'] },
]

const CONJ_PERSON = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie']

module.exports = { VERB_CONJ, CONJ_PERSON }
