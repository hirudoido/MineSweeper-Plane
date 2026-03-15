// main2.js
// 盤面全体で右クリックメニューを無効化
document.getElementById("board").addEventListener("contextmenu", e => {
  e.preventDefault();
});
// 地雷数を行列比率から自動計算して設定する
window.addEventListener("DOMContentLoaded", () => {
  // 初期呼び出し
  updateMineStepByRule();

  // ルール変更時に反映
  document.getElementById("placement").addEventListener("change", updateMineStepByRule);

  // 行列変更時にも反映（比率が変わるので）
  document.getElementById("rows").addEventListener("input", updateMineStepByRule);
  document.getElementById("cols").addEventListener("input", updateMineStepByRule);
    document.getElementById("mines").addEventListener("input", updateMineStepByRule);
 
});
// 地雷数をルールに合わせて補正する
function normalizeMinesForRule(rows, cols, mines, placementKey) {
  console.log(`normalizeMinesForRule: ${rows}x${cols}, mines=${mines}, rule=${placementKey}`);
  // ★ 3連続配置 3の倍数に丸める
  if (placementKey === "ThreeInRow") {
  return Math.round(mines /3) * 3;
  }

  //4分割 4の倍数に丸める
if (placementKey==="QuadrantEqual"||placementKey==="Cluster4Isolated"||placementKey==="TetrisMino") {
document.getElementById("rows").value=(Math.round(rows /2) * 2);
document.getElementById("cols").value=(Math.round(cols /2) * 2);
console.log(Math.round(mines /4) * 4);

  return Math.round(mines /4) * 4;
}
  // 正方形の場合は行数(=列数)の倍数に丸める
  if (rows === cols&&placementKey === "rowcolfixed"||placementKey === "bridge") {
    return Math.round(mines / rows) * rows;
  }
 // 行数または列数の倍数に丸める
  if (placementKey === "rowcolfixed"||placementKey === "bridge") {
 
  const rowMultiple = Math.round(mines / rows) * rows;
  const colMultiple = Math.round(mines / cols) * cols;

  return (Math.abs(rowMultiple - mines) < Math.abs(colMultiple - mines))
    ? rowMultiple : colMultiple}
    // ★ シグマ固まりルール：地雷数を三角数に丸める
if (placementKey === "SigmaCluster"||placementKey === "SigmaLine") {
  let k = Math.floor((Math.sqrt(8 * mines + 1) - 1) / 2);
  return k * (k + 1) / 2; // 下側の三角数
}
  // --- 面積ベースの上限処理 ---
  const area = rows * cols;
  let maxMines;
  switch (placementKey) {
    case "NoTouch": // 隣接禁止
      maxMines = Math.ceil(rows / 2) * Math.ceil(cols / 2);
      break;
    default: // 通常
      maxMines = Math.floor(area * 0.9); // 50%を上限
      //console.log(`maxMines: ${maxMines}`);
      break;
  }

  // 上限を超えたら丸める
  return Math.min(mines, maxMines);

}

/**
 * Compresses a sequence of values into a shorter form.
 * For example, [1, 1, 2, 2, 3] becomes ["1×2", "2×2", "3"].
 * @param {Array<number>} arr The sequence of values to compress.
 * @returns {Array<string>} The compressed sequence.
 */
//圧縮表記
function compressSequence(arr) {
  const out = [];
  let i = 0;
  while (i < arr.length) {
    const val = arr[i];
    let count = 1;
    while (i + count < arr.length && arr[i + count] === val) {
      count++;
    }
    if (count > 1) {
      out.push(`${val}×${count}`); // 中央揃えされる
    } else {
      out.push(String(val));
    }
    i += count;
  }
  return out;
}
// ====== 基本クラス ======
class Cell {
  constructor(r, c, board) {   // ★ board を引数で受け取る
    this.r = r;
    this.c = c;
    this.board = board;        // ★ 自分の盤面を参照できるようにする
    this.mine = false;
    this.open = false;
    this.flag = false;
    this.value = 0;
    this.el = null;
    
    this.displayRule = null;

  }
}

class Board {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.cells = this._createCells();
  }

  _createCells() {
    const cells = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        cells.push(new Cell(r, c, this)); // ★ board を渡す
      }
    }
    return cells;
  }

  getCell(r, c) {
    return this.cells[r * this.cols + c];
  }
}

// ====== 戦略インターフェース ======
class PlacementStrategy {
  place(board, mineCount, rng, excludeIndex) {
    throw new Error("Not implemented");
  }
}
class ExploreStrategy {
  neighbors(board, r, c) {
    throw new Error("Not implemented");
  }
}
class NumberRule {
  calculate(cell, neighbors) {
    throw new Error("Not implemented");
  }

  render(cell) {
    return cell.value === 0 ? "" : String(cell.value);
  }

  isZero(cell) {
    return cell.value === 0;
  }

  // ★ 追加：数字セル判定（全ルール共通）
  isNumberCell(cell) {
    if (cell.mine) return false;

    // ゼロセルは数字扱いしない
    if (this.isZero(cell)) return false;

    // 空文字は数字扱いしない
    if (cell.value === "") return false;

    // 文字列でも数値でもOK
    return true;
  }
}
// ====== ゲーム進行管理 ======
// 内側：Gameクラス
class Game {
  constructor(rows, cols, mineCount, { placement, explore, number }) {
    this.board = new Board(rows, cols);
    this.mineCount = mineCount;
    this.placement = placement;
    this.explore = explore;
    this.number = number;
    this.opened = 0;
    this.gameOver = false;
    this.timer = null;
    this.elapsed = 0;
  }

async init() {
  this.stopTimer();
  this._startTimer();

  const seed = document.getElementById("seed").value || "123456";
  const rng = makeRngFromSeed(seed);

  let success = false;
  for (let attempt = 0; attempt < 3000 && !success; attempt++) {
    const counter = document.getElementById("attemptCounter");
    if (counter) counter.textContent = `試行中: ${attempt + 1}回`;

    // ★ 1フレーム待つことで描画を強制
    await new Promise(resolve => setTimeout(resolve));

    try {
      this.board = new Board(this.board.rows, this.board.cols);
      this.placement.place(this.board, this.mineCount, rng);
      success = true;
      console.log(attempt + 1, "回で配置成功");
    } catch (e) {
      // リトライ
    }
  }

  if (!success) {
    this.stopTimer();
    document.getElementById("errorMsg").classList.remove("hidden");
    return;
  }

  document.getElementById("errorMsg").classList.add("hidden");


  // ★ ここでセルごとの表示ルールを割り当てる
  this.assignDisplayRules(rng);


  this._calculateNumbers();
  this._buildBoardUI();
  this._updateHUD();
  this._applyHints(rng);
  this.logBoard();
}

  // --- タイマー ---
  _startTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.elapsed = 0;
    document.getElementById("time").textContent = this.elapsed;

    this.timer = setInterval(() => {
      this.elapsed += 1;
      document.getElementById("time").textContent = this.elapsed;
    }, 1000);
  }

  stopTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
assignDisplayRules(rng) {
  // 1〜10 のルールID
  const allRules = [1,2,3,4,5,6,7,8,9,10];
  let Number=document.getElementById("number").value 
  if (Number === "CompositeCell2") {

  const allRules = [2,3,4,5,6,7,8,9,10];
    const selected = [];
  while (selected.length < 2) {
    const r = allRules[Math.floor(rng() * allRules.length)];
    if (!selected.includes(r)) selected.push(r);
  }

  // ★ 盤面の各セルにランダムでどちらかを割り当てる
  for (const cell of this.board.cells) {
    const idx = Math.floor(rng() * selected.length);
    cell.displayRule = selected[idx];
  }
  }else{
  for (const cell of this.board.cells) {
    const idx = Math.floor(rng() * allRules.length);
    cell.displayRule = allRules[idx];
  }
  }

}
    // --- ヒント適用 ---
_applyHints(rng) {
  const hintRate = +document.getElementById("hintRate").value;

  let candidates = [];
  for (const cell of this.board.cells) {
    if (cell.open) continue;

    if (hintRate < 60) {
      // 60%未満 → 数字セルのみ（従来通り）
       if (this.number.isNumberCell(cell)) candidates.push(cell);


    } else if (hintRate < 70) {
      // 60〜69% → 数字セルを多めに開ける
        if (this.number.isNumberCell(cell)) candidates.push(cell);


    } else if (hintRate <= 90) {
      // 70〜90% → 数字セル＋地雷
       if (this.number.isNumberCell(cell) || cell.mine) candidates.push(cell);


    } else {
      // 90%以上 → 数字セル＋地雷＋空白
      candidates.push(cell);
    }
  }

  // 開ける数を決定
  let openCount = Math.floor(candidates.length * (hintRate / 100));

  // 60〜69%のときは数字セルを多めに開ける（例: 1.5倍）
  if (hintRate >= 60 && hintRate < 70) {
    openCount = Math.floor(candidates.length * (hintRate / 100) * 1.1);
  }

  for (let i = 0; i < openCount; i++) {
    if (candidates.length === 0) break;
    const idx = Math.floor(rng() * candidates.length);
    const cell = candidates.splice(idx, 1)[0];
    cell.open = true;
    this.paintCell(cell);
  }

  this._updateHUD(); // HUD同期
}
  // --- UI構築 ---
_buildBoardUI() {
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateColumns = `repeat(${this.board.cols}, var(--cell))`;

  for (const cell of this.board.cells) {
    const d = document.createElement("div");
    d.className = "cell " + (((cell.r + cell.c) % 2 === 0) ? "light" : "dark");
// --- セルクリック ---
d.addEventListener("click", () => {
  if (longPress) return;
    this.openCell(cell);
  // pen / eraser のときは何もしない（canvas が描画を受け取る）
});
// --- 右クリックで旗 ---
    d.addEventListener("contextmenu", e => {
      e.preventDefault();
      this.toggleFlag(cell);
    });
// --- スマホ長押しで旗 ---
let pressTimer = null;
let longPress = false;

d.addEventListener("touchstart", () => {
  // document.getElementById("Msg").textContent = "タッチ";
  // document.getElementById("Msg").classList.remove("hidden");
  longPress = false;
  pressTimer = setTimeout(() => {
   // document.getElementById("Msg").textContent = "長押しタッチ";
    longPress = true;
    this.toggleFlag(cell);   // ★ 長押しで旗
  }, 500); // 0.5秒長押し
  console.log("touchstart",longPress);
});

// --- スマホ長押し解除 ---
d.addEventListener("touchcancel", () => {
  clearTimeout(pressTimer);
console.log("touchcancel",clearTimeout(pressTimer));
 //document.getElementById("Msg").classList.add("hidden");
  // 長押しでなければ通常の開く処理
  if (!longPress) {
    
    this.openCell(cell);
  }
});
    // ★ 探索範囲の可視化
// ハイライト
d.addEventListener("mouseenter", () => {

  // ★ StraightLineExplore のときだけ十字1マス
  if (this.explore instanceof StraightLineExplore) {
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]]; // 上下左右
    for (const [dr, dc] of dirs) {
      const rr = cell.r + dr;
      const cc = cell.c + dc;
      if (rr >= 0 && rr < this.board.rows && cc >= 0 && cc < this.board.cols) {
        const nb = this.board.getCell(rr, cc);
        nb.el.classList.add("highlight2");
      }
    }
    return; // ★ ここで終了（他ルールには行かない）
  }

  // ★ それ以外の探索ルールは従来どおり neighbors を光らせる
  const ns = this._getNeighbors(cell);
  for (const nb of ns) {
    //ルールによって色を変える
   let skip = ["clusterDetect","RippleImmutable", "UntilMine5x5Immutable","RandomBlindSpot","CrossBlindSpot"];
    //!skip.includes(search)
     let  search =document.getElementById("explore").value;
    if(skip.includes(search)){  
      nb.el.classList.add("highlight2");
    }else{
       nb.el.classList.add("highlight");
  }
}
});

    d.addEventListener("mouseleave", () => {
      for (const c of this.board.cells) {
        c.el.classList.remove("highlight");
        c.el.classList.remove("highlight2");
      }
    });

    cell.el = d;
    boardEl.appendChild(d);
  }
}

  // --- HUD更新 ---
_updateHUD() {
  const flags = this.board.cells.filter(c => c.flag).length;
  const left = this.mineCount - flags;

  // 未確定セル = 全セル - 開いたセル - 旗セル
  const total = this.board.rows * this.board.cols;
  const opened = this.board.cells.filter(c => c.open).length;
  const uncertain = total - opened - flags;

  document.getElementById("mineLeft").textContent = left;
  document.getElementById("uncertain").textContent = uncertain; // ★追加
  document.getElementById("size").textContent =
    `${this.board.rows}×${this.board.cols} 地雷${this.mineCount}`;
}

    // --- 数字計算 ---
 // --- 数字計算 ---
_calculateNumbers() {
  for (const cell of this.board.cells) {
    if (cell.mine) continue;


    const ns = this.explore.neighbors(this.board, cell.r, cell.c);
    cell.value = this.number.calculate(cell, ns);
  }
}


// Game 内の neighbors 呼び出し部分をラップする
//ハイライトの可視化
_getNeighbors(cell) {
  // ★ StraightLineExplore のときだけ十字1マス
  let  search =document.getElementById("explore").value;
  if (this.explore instanceof ClusterDetectExplore||search =="RippleImmutable") {
    const cross = new Cross4Explore();
    return cross.neighbors(this.board, cell.r, cell.c);
  }
  //クイーンのときだけ
  if (search =="UntilMine5x5Immutable") {
    const cross = new UntilMine5x5Explore();
    return cross.neighbors(this.board, cell.r, cell.c);
  }
    if (search =="RandomBlindSpot") {
    const cross = new Normal8Explore();
    return cross.neighbors(this.board, cell.r, cell.c);
  }
   if (search =="CrossBlindSpot") {
    const cross = new Cross2Explore();
    return cross.neighbors(this.board, cell.r, cell.c);
  }
  return this.explore.neighbors(this.board, cell.r, cell.c);
}

// --- セル描画 ---
paintCell(cell) {
  const d = cell.el;
  const cheatOn = document.getElementById("cheatToggle").checked;
  const number = document.getElementById("number").value;

  d.className = "cell " + (((cell.r + cell.c) % 2 === 0) ? "light" : "dark") +
                (cell.open ? " open" : "") +
                (cell.flag ? " flag" : "");

  d.textContent = "";
  d.innerHTML = "";

// --- 描画 ---
if (cell.open) {
  if (cell.mine) {
    d.textContent = "💣";
  } else {
    const rendered = this.number.render ? this.number.render(cell) : cell.value;
    d.innerHTML = rendered;

    // --- safe-zone 色変更 ---
    if (cell.safeZone) {
   //   d.style.backgroundColor = "#b51e1e";   // ← 安全地帯の色
      d.style.color = "#fbff00";
    } else {
      d.style.color = "";         // ← 通常色に戻す
    }



// 除外ルール
const skip = ["cluster", "VerticalSplit", "HorizontalSplit","ManhattanVector","BiasDiff","CompositeCell","CompositeCell2"];

// 除外ルールならフォント調整しない
if (true) {
  if (rendered.length >= 8&&!skip.includes(number)) {
    d.classList.add("Superlonglong-text");
  } else if (rendered.length >= 6&&!skip.includes(number)) {
    d.classList.add("Superlong-text");
  } else if (rendered.length >= 3) {
    d.classList.add("long-text");
  }
}
 }

  } else {
    if (cell.flag) {
      d.textContent = "⚑";
    } else if (cheatOn && cell.mine) {
      d.textContent = "💣";
      d.classList.add("cheat");
    }
  }
}

  // --- セル操作 ---

openCell(cell) {
  if (this.gameOver || cell.open) return;
  cell.open = true;
  this.paintCell(cell);

  if (cell.mine) {
    this.gameOver = true;
    this.stopTimer();
    document.getElementById("gameover").classList.remove("hidden");
    return;
  }
  // 数字セル
  if (this.number.isZero(cell)) {
    this.floodOpen(cell);
  }


  // 勝利判定
  if (this._checkWin()) {
    this.gameOver = true;
    this.stopTimer();
    document.getElementById("gameclear").classList.remove("hidden");
  }
    this._updateHUD();
}

_checkWin() {
  // 開いたセル数 = 全セル数 - 地雷数
  const totalSafe = this.board.rows * this.board.cols - this.mineCount;
  const opened = this.board.cells.filter(c => c.open).length;
  return opened >= totalSafe;
}




floodOpen(start) {
  const q = [start];
  const seen = new Set([start.r * this.board.cols + start.c]);

  while (q.length) {
    const cur = q.shift();
    //const ns = this.explore.neighbors(this.board, cur.r, cur.c); // ★ 選択中の探索ルールを使用
    const ns = this._getNeighbors(cur);
    for (const nb of ns) {
      if (nb.open || nb.flag) continue;
      if (!nb.mine) {
        nb.open = true;
        this.paintCell(nb);

        // ★ そのセルもゼロならさらに広げる
        if (this.number.isZero(nb) && !seen.has(nb.r * this.board.cols + nb.c)) {
          seen.add(nb.r * this.board.cols + nb.c);
          q.push(nb);
        }
      }
    }
  }
}


toggleFlag(cell) {
  if (this.gameOver || cell.open) return;
  cell.flag = !cell.flag;
  cell.el.textContent = cell.flag ? "⚑" : "";

  this._updateHUD(); // ★ 旗を切り替えたらHUD更新
}
  logBoard() {
  let output = "";
  for (let r = 0; r < this.board.rows; r++) {
    let row = [];
    for (let c = 0; c < this.board.cols; c++) {
      const cell = this.board.getCell(r, c);
      if (cell.mine) row.push("💣");
      else row.push(cell.value);
    }
    output += row.join(" ") + "\n";
  }
  console.log(output);
}
}

// ====== チートモード制御 ======
//const cheatToggle = document.getElementById("cheatToggle");
// チート切替時に盤面を再描画
cheatToggle.addEventListener("change", () => {
  if (currentGame) {
    for (const cell of currentGame.board.cells) {
      currentGame.paintCell(cell);
    }
  }
});

// ====== RNG ======


function makeRngFromSeed(seedStr) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let state = h >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}



// ====== ゲーム開始処理 ======
// 外側：UIから呼ばれる唯一の開始関数
function startGame(seedOverride = null) {
  document.getElementById("attemptCounter").classList.remove("hidden");
  document.getElementById("attemptCounter").textContent = "試行中: 0 回";


  setTimeout(async () => {  // ← 非同期にするのがポイント
    // ★ ここから元の startGame の処理

    // ★ チートモードを強制オフにする
  const cheatToggle = document.getElementById("cheatToggle");
  cheatToggle.checked = false;

  if (currentGame) {
    currentGame.stopTimer();
    currentGame = null;
  }
  const rows = +document.getElementById("rows").value;
  const cols = +document.getElementById("cols").value;
  let mines = +document.getElementById("mines").value;

  let placementKey = document.getElementById("placement").value;
  const exploreKey   = document.getElementById("explore").value;
  const numberKey    = document.getElementById("number").value;




   // ★ 補正対象ルールなら normalize を適用

  mines = normalizeMinesForRule(rows, cols, mines, placementKey);
  document.getElementById("mines").value = mines; // UIにも反映

console.log("startGame params:", rows, cols, mines, placementKey, exploreKey, numberKey);

  const placement = new placementMap[placementKey]();
  const explore   = new exploreMap[exploreKey]();
  //ルール集大成
  let number;
if (numberKey === "CompositeCell"||numberKey === "CompositeCell2") {
    number = new CompositeCellRule(explore);
    console.log(number,numberKey);
} else {
    number = new numberMap[numberKey](explore);
}

  if (seedOverride !== null) {
    document.getElementById("seed").value = seedOverride;
  }
  const seed = document.getElementById("seed").value;

  currentGame = new Game(rows, cols, mines, { placement, explore, number });
  console.log(mines);
  await currentGame.init(seed);

  drawManager.init();
 resizeCanvasToBoard();
// ★ これを追加

document.getElementById("attemptCounter").classList.add("hidden");
// ← 完了で非表示
  }, 0.05);
}


let currentGame = null;
// フォーム送信時 → startGame() を呼ぶだけ
document.getElementById("settings").addEventListener("submit", e => {
  e.preventDefault();
  startGame();
});
//シードランダム
document.getElementById("startRandom").addEventListener("click", () => {
  const newSeed = Math.floor(Math.random() * 1e9).toString();
  document.getElementById("seed").value = newSeed; // ★ input に反映
  startGame(newSeed); // ★ そのシードで開始
});
//ルールもランダム

document.getElementById("startRandomRule").addEventListener("click", () => {

  // ▼ 1. placement を現在の select からランダム選択
  const placementSel = document.getElementById("placement");
  const placementOpts = Array.from(placementSel.querySelectorAll("option"));
  const randomPlacement = placementOpts[Math.floor(Math.random() * placementOpts.length)].value;
  placementSel.value = randomPlacement;

  // ▼ 2. explore を現在の select からランダム選択（Global は除外）
  const exploreSel = document.getElementById("explore");
  const exploreOpts = Array.from(exploreSel.querySelectorAll("option"))
    .filter(opt => opt.value !== "Global");
  const randomExplore = exploreOpts[Math.floor(Math.random() * exploreOpts.length)].value;
  exploreSel.value = randomExplore;

  // ▼ 3. number を現在の select からランダム選択
  const numberSel = document.getElementById("number");
  const numberOpts = Array.from(numberSel.querySelectorAll("option"));
  const randomNumber = numberOpts[Math.floor(Math.random() * numberOpts.length)].value;
  numberSel.value = randomNumber;

  // ▼ 4. シードもランダム
  const newSeed = Math.floor(Math.random() * 1e9).toString();
  document.getElementById("seed").value = newSeed;

  // ▼ 5. ゲーム開始
  startGame(newSeed);
});

// リトライ処理
function setupRetryButtons() {
  document.getElementById("retrySame").addEventListener("click", () => {
    document.getElementById("gameover").classList.add("hidden");   // ★閉じる
    startGame(document.getElementById("seed").value);
  });
  document.getElementById("retryNew").addEventListener("click", () => {
    document.getElementById("gameover").classList.add("hidden");   // ★閉じる
    startGame(Math.floor(Math.random() * 1e9).toString());
  });
  document.getElementById("retrySameClear").addEventListener("click", () => {
    document.getElementById("gameclear").classList.add("hidden");  // ★閉じる
    startGame(document.getElementById("seed").value);
  });
  document.getElementById("retryNewClear").addEventListener("click", () => {
    document.getElementById("gameclear").classList.add("hidden");  // ★閉じる
    startGame(Math.floor(Math.random() * 1e9).toString());
  });
}

// 共通で使えるリトライ処理

setupRetryButtons();

// ====== 地雷数ステップ制御 ======
    function gcd(a,b){ return b===0?a:gcd(b,a%b); }
    function lcm(a,b){ return a*b/gcd(a,b); }

function updateMineStepByRule() {
  const minesInput = document.getElementById("mines");
  const rowsInput = document.getElementById("rows");
  const colsInput = document.getElementById("cols");
  const rule = document.getElementById("placement").value; // 例: random/cluster/pair/...
  const rows = +document.getElementById("rows").value;
  const cols = +document.getElementById("cols").value;



  // 比率に基づく基準ステップ（行×列の整合が取りやすい）
 let step = gcd(rows, cols);

  // ルール固有の制約を上書き・合成

  if (rule === "pair"||rule === "ColorBalanced") {
      minesInput.min = 0;
    minesInput.step = 2;
rowsInput.min = 1;
rowsInput.step = 1;
colsInput.min = 1;
colsInput.step = 1;
    // ★ 偶数に補正
    let val = +minesInput.value;
    console.log(`現在の地雷数: ${val}`);
    if (val % 2 !== 0) {
      val += 1; // 奇数なら次の偶数へ
      console.log("地雷数を偶数に補正");
    }
    minesInput.value = val;
  } else if (rule === "rowcolfixed") {
    // 行数と列数の最小公倍数を step にする
//const step = gcd(rows, cols);
    minesInput.step = 1;
    minesInput.min = 1;
    rowsInput.min = 1;
rowsInput.step = 1;
colsInput.min = 1;
colsInput.step = 1;
  }else if (rule === "ThreeInRow") {

//const step = gcd(rows, cols);
    minesInput.step = 1;
    minesInput.min = 3;
    rowsInput.min = 3;
rowsInput.step = 1;
colsInput.min = 3;
colsInput.step = 1;
  }else if (rule === "NoIsolated") {

//const step = gcd(rows, cols);
    minesInput.step = 1;
    minesInput.min = 2;
    rowsInput.min = 1;
rowsInput.step = 1;
colsInput.min = 1;
colsInput.step = 1;
  }else  if (rule === "QuadrantEqual") {
    // 4分割均等配置 → 行列は偶数、地雷数は4の倍数最後にするは
    minesInput.step = 1;
    minesInput.min = 4;
rowsInput.min = 2;
rowsInput.step = 1;
colsInput.min = 2;
colsInput.step = 1;
      
  }else{
      minesInput.min = 1;
    minesInput.step = 1; // 他ルールは自由
    rowsInput.min = 1;
rowsInput.step = 1;
colsInput.min = 1;
colsInput.step = 1;
    console.log("地雷数ステップを1に設定");
  }
    // 地雷数の最大値を更新
//console.log(`地雷数ステップを ${step} に設定 (ルール: ${rule})`);
}
