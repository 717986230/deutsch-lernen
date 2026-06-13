// ──────────────────────────────────────────────────────────────
// utils/numbers.js — 数字数据（主包内联）
// ──────────────────────────────────────────────────────────────

const nums0 = [
  {n:0,de:'null',py:'努尔'},{n:1,de:'eins',py:'艾因斯'},{n:2,de:'zwei',py:'茨威'},
  {n:3,de:'drei',py:'德莱'},{n:4,de:'vier',py:'费尔'},{n:5,de:'fünf',py:'费因夫'},
  {n:6,de:'sechs',py:'泽克斯'},{n:7,de:'sieben',py:'泽本'},{n:8,de:'acht',py:'阿赫特'},
  {n:9,de:'neun',py:'诺伊因'},{n:10,de:'zehn',py:'泽恩'},{n:11,de:'elf',py:'埃尔夫'},
  {n:12,de:'zwölf',py:'茨沃尔夫'}
];

const numsBig = [
  {n:100,de:'hundert',py:'洪德特'},{n:1000,de:'tausend',py:'套森特'},
  {n:1000000,de:'eine Million',py:'艾嫩 米利昂'},{n:1000000000,de:'eine Milliarde',py:'艾嫩 米利阿德'},
  {n:0.5,de:'ein halb',py:'艾因 哈尔普'},{n:'1.',de:'erste',py:'尔斯特'}
];

// 数字测验题池：在 nums0 基础上追加常用数字
const quizPool = [
  {n:0,de:'null',py:'努尔'},
  {n:1,de:'eins',py:'艾因斯'},
  {n:2,de:'zwei',py:'茨威'},
  {n:3,de:'drei',py:'德莱'},
  {n:4,de:'vier',py:'费尔'},
  {n:5,de:'fünf',py:'费因夫'},
  {n:6,de:'sechs',py:'泽克斯'},
  {n:7,de:'sieben',py:'泽本'},
  {n:8,de:'acht',py:'阿赫特'},
  {n:9,de:'neun',py:'诺伊因'},
  {n:10,de:'zehn',py:'泽恩'},
  {n:11,de:'elf',py:'埃尔夫'},
  {n:12,de:'zwölf',py:'茨沃尔夫'},
  {n:13,de:'dreizehn',py:'德莱泽恩'},
  {n:20,de:'zwanzig',py:'茨万齐希'},
  {n:21,de:'einundzwanzig',py:'艾因温楚万齐希'},
  {n:30,de:'dreißig',py:'德莱西希'},
  {n:35,de:'fünfunddreißig',py:'菲因夫温德莱西希'},
  {n:50,de:'fünfzig',py:'菲因夫齐希'},
  {n:99,de:'neunundneunzig',py:'诺伊因温诺伊因齐希'},
  {n:100,de:'hundert',py:'洪德特'}
];

module.exports = { nums0, numsBig, quizPool };
