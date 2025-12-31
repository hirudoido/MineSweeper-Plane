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
  // ★ 3連のみルールの特別処理
  if (placementKey === "ThreeInRow") {
    if (mines === 4) return 5;
  }

  //4分割
if (placementKey==="QuadrantEqual"){
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

  init() {
    this.stopTimer();
    this._startTimer();

    const seed = document.getElementById("seed").value || "123456";
    const rng = makeRngFromSeed(seed);

    // 配置リトライ
    let success = false;
    for (let attempt = 0; attempt < 5000 && !success; attempt++) {
      try {
        this.board = new Board(this.board.rows, this.board.cols);
        this.placement.place(this.board, this.mineCount, rng);
        success = true;
      } catch (e) {
        console.warn("配置失敗 → リトライ", attempt + 1, e.message);
      }
    }
    if (!success) {
      this.stopTimer();
      document.getElementById("errorMsg").classList.remove("hidden");
      return;
    }

    document.getElementById("errorMsg").classList.add("hidden");

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
    // --- ヒント適用 ---
_applyHints(rng) {
  const hintRate = +document.getElementById("hintRate").value;

  let candidates = [];
  for (const cell of this.board.cells) {
    if (cell.open) continue;

    if (hintRate < 60) {
      // 60%未満 → 数字セルのみ（従来通り）
      if (!cell.mine && cell.value > 0) candidates.push(cell);

    } else if (hintRate < 70) {
      // 60〜69% → 数字セルを多めに開ける
      if (!cell.mine && cell.value > 0) candidates.push(cell);

    } else if (hintRate <= 90) {
      // 70〜90% → 数字セル＋地雷
      if ((cell.value > 0) || cell.mine) candidates.push(cell);

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

    d.addEventListener("click", () => this.openCell(cell));
    d.addEventListener("contextmenu", e => {
      e.preventDefault();
      this.toggleFlag(cell);
    });

    // ★ 探索範囲の可視化
// ハイライト
d.addEventListener("mouseenter", () => {
  const ns = this._getNeighbors(cell); // ← cell を渡す
  for (const nb of ns) {
    nb.el.classList.add("highlight");
  }
});

    d.addEventListener("mouseleave", () => {
      for (const c of this.board.cells) {
        c.el.classList.remove("highlight");
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
  if (this.explore instanceof ClusterDetectExplore) {
    const cross = new Cross4Explore();
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


if (cell.open) {
  if (cell.mine) {
    d.textContent = "💣";
  } else {
    const rendered = this.number.render ? this.number.render(cell) : cell.value;
    d.innerHTML = rendered;
    if (rendered.length >= 8&&number!="cluster") {

      d.classList.add("Superlonglong-text");
      
       }else  if (rendered.length >= 6&&number!="cluster") {

      d.classList.add("Superlong-text");
      
    }  else   if (rendered.length >= 3) {
      d.classList.add("long-text");
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
  // ★ ここを修正
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



// ====== 戦略実装 ======
// ====== ランダム配置 ======
class RandomPlacement extends PlacementStrategy {
    
  place(board, mineCount, rng, excludeIndex = -1) {
    let placed = 0;
    const total = board.rows * board.cols;
    while (placed < mineCount) {
      const idx = Math.floor(rng() * total);
      if (idx === excludeIndex) continue;
      const cell = board.cells[idx];
      if (!cell.mine) {
        cell.mine = true;
        placed++;
      }
    }
  }
  
}
// ====== クラスター配置 ======
class ClusterPlacement extends PlacementStrategy {

  place(board, mineCount, rng, excludeIndex = -1) {
    const total = board.rows * board.cols;
    let placed = 0;

    while (placed < mineCount) {
      // 1. クラスターの中心をランダムに選ぶ
      const centerIdx = Math.floor(rng() * total);
      const centerCell = board.cells[centerIdx];
      if (centerIdx === excludeIndex) continue;

      // 2. 中心に地雷を置く
      if (!centerCell.mine) {
        centerCell.mine = true;
        placed++;
      }

      // 3. 周囲のセルにも追加で地雷を置く（クラスター形成）
      const r = centerCell.r, c = centerCell.c;
      const neighbors = [
        [r-1,c],[r+1,c],[r,c-1],[r,c+1],
        [r-1,c-1],[r-1,c+1],[r+1,c-1],[r+1,c+1]
      ];
      for (const [rr, cc] of neighbors) {
        if (placed >= mineCount) break;
        if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
        const nb = board.getCell(rr, cc);
        if (!nb.mine && (rng() <0.82)) { // 80%の確率で置く
          nb.mine = true;
          placed++;
        }
      }
    }
    //console.log("4444ent used");
  }
}
// 斜め禁止配置
class NoDiagonalPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    let placed = 0;
    const total = board.rows * board.cols;

    while (placed < mineCount) {
      const idx = Math.floor(rng() * total);
      if (idx === excludeIndex) continue;
      const cell = board.cells[idx];
      if (cell.mine) continue;

      // 斜め方向に地雷があるかチェック
      const r = cell.r, c = cell.c;
      const diagonals = [
        [r-1, c-1], [r-1, c+1],
        [r+1, c-1], [r+1, c+1]
      ];
      let hasDiagonalMine = false;
      for (const [rr, cc] of diagonals) {
        if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
        if (board.getCell(rr, cc).mine) {
          hasDiagonalMine = true;
          break;
        }
      }

      if (hasDiagonalMine) continue; // 斜めに地雷があるなら置かない

      // 問題なければ地雷を置く
      cell.mine = true;
      placed++;
    }
    //console.log("NoDiagonalPlacement used");
  }
}
// 3連禁止配置
class NoThreeInRowPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    let placed = 0;
    const total = board.rows * board.cols;

    while (placed < mineCount) {
      const idx = Math.floor(rng() * total);
      if (idx === excludeIndex) continue;
      const cell = board.cells[idx];
      if (cell.mine) continue;

      // 置いてもOKかチェック
      if (this._wouldMakeThree(board, cell)) continue;

      // 問題なければ設置
      cell.mine = true;
      placed++;
    }
  }

  _wouldMakeThree(board, cell) {
    const dirs = [
      [1,0], [0,1], [1,1], [1,-1] // 縦・横・斜め
    ];
    for (const [dr, dc] of dirs) {
      let count = 1; // 自分を含めて数える

      // 前方向
      let r = cell.r + dr, c = cell.c + dc;
      while (r >= 0 && c >= 0 && r < board.rows && c < board.cols) {
        if (board.getCell(r,c).mine) {
          count++;
          r += dr; c += dc;
        } else break;
      }

      // 逆方向
      r = cell.r - dr; c = cell.c - dc;
      while (r >= 0 && c >= 0 && r < board.rows && c < board.cols) {
        if (board.getCell(r,c).mine) {
          count++;
          r -= dr; c -= dc;
        } else break;
      }

      if (count >= 3) return true; // 3連以上になる
    }
    return false;
  }
}
// ペア配置
class PairPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    let placed = 0;
    const total = board.rows * board.cols;

    while (placed < mineCount) {
      const idx = Math.floor(rng() * total);
      if (idx === excludeIndex) continue;
      const cell = board.cells[idx];
      if (cell.mine) continue;

      // 1個目を仮置き
      const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
      const [dr, dc] = dirs[Math.floor(rng() * dirs.length)];
      const rr = cell.r + dr, cc = cell.c + dc;
      if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
      const nb = board.getCell(rr, cc);
      if (nb.mine) continue;

      // ★ 隣接禁止チェック
      if (this._hasAdjacentMine(board, cell) || this._hasAdjacentMine(board, nb)) {
        continue; // このペアは無効
      }

      // 問題なければ確定
      cell.mine = true;
      nb.mine = true;
      placed += 2;
    }}
      _hasAdjacentMine(board, cell) {
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs) {
      const rr = cell.r + dr, cc = cell.c + dc;
      if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
      if (board.getCell(rr, cc).mine) return true;
    }
    return false;
  }
}

  // 行・列固定配置
class RowColFixedPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    const rows = board.rows;
    const cols = board.cols;

    // 正方形特別処理
  if (rows === cols) {
      if (mineCount % rows !== 0) {
        throw new Error("正方形では地雷数は行数(=列数)の倍数である必要があります");
      }
      const perLine = mineCount / rows;
      const colRemain = Array(cols).fill(perLine);

      for (let r = 0; r < rows; r++) {
        const colIndices = Array.from({length: cols}, (_, i) => i);
        // シャッフル
        for (let i = colIndices.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [colIndices[i], colIndices[j]] = [colIndices[j], colIndices[i]];
        }

        let placed = 0;
        for (let c of colIndices) {
          if (placed >= perLine) break;
          if (colRemain[c] <= 0) continue;
          const cell = board.getCell(r, c);
          if (cell.mine || (r * cols + c === excludeIndex)) continue;

          cell.mine = true;
          colRemain[c]--;
          placed++;
        }

        // 行に必要数置けなかったら失敗
        if (placed < perLine) {
          throw new Error("配置失敗");
        }
      }
      return;
    }



    // 通常処理（長方形）
    const byRow = (mineCount % rows === 0);
    const byCol = (mineCount % cols === 0);

    if (!byRow && !byCol) {
      throw new Error("地雷数は行数または列数の倍数である必要があります");
    }

    if (byRow) {
      const perRow = mineCount / rows;
      for (let r = 0; r < rows; r++) {
        let placed = 0;
        while (placed < perRow) {
          const c = Math.floor(rng() * cols);
          const cell = board.getCell(r, c);
          if (cell.mine || (r * cols + c === excludeIndex)) continue;
          cell.mine = true;
          placed++;
        }
      }
    } else if (byCol) {
  const perCol = mineCount / cols;
  for (let c = 0; c < cols; c++) {
    // 行インデックスをシャッフル
    const rowIndices = Array.from({length: rows}, (_, i) => i);
    for (let i = rowIndices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [rowIndices[i], rowIndices[j]] = [rowIndices[j], rowIndices[i]];
    }

    let placed = 0;
    for (let r of rowIndices) {
      if (placed >= perCol) break;
      const cell = board.getCell(r, c);
      if (cell.mine || (r * cols + c === excludeIndex)) continue;
      cell.mine = true;
      placed++;
    }
  }
}
  }
}
// 橋配置
class BridgePlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    const rows = board.rows;
    const cols = board.cols;

    const byRow = (mineCount % cols === 0);
    const byCol = (mineCount % rows === 0);

    if (!byRow && !byCol) {
      throw new Error("地雷数は行数または列数の倍数である必要があります");
    }

    if (byRow) {
      const bridges = mineCount / cols;
      const usedRows = new Set();
      while (usedRows.size < bridges) {
        let r = Math.floor(rng() * rows);
        if (usedRows.has(r)) continue;
        usedRows.add(r);

        const startRow = r;
        const path = [];

        for (let c = 0; c < cols; c++) {
          path.push([r, c]);

          if (c < cols - 1) {
            const offset = r - startRow;
            let choices = [0];
            if (offset > 0) choices.push(-1, -1), choices.push(1);
            else if (offset < 0) choices.push(1, 1), choices.push(-1);
            else choices.push(-1, 1);

            // ★ 合流禁止チェック
            const validMoves = choices.filter(delta => {
              const candidate = Math.max(0, Math.min(rows - 1, r + delta));
              const nextCell = board.getCell(candidate, c + 1);
              return !nextCell.mine; // 既に地雷があるなら除外
            });

            if (validMoves.length === 0) {
              // 進めない → この橋は失敗扱い（リトライ）
              return this.place(board, mineCount, rng, excludeIndex);
            }

            const delta = validMoves[Math.floor(rng() * validMoves.length)];
            r = Math.max(0, Math.min(rows - 1, r + delta));
          }
        }

        // 経路をユニーク化
        const unique = [...new Set(path.map(p => p.join(",")))];
        let placed = 0;
        for (const key of unique) {
          const [rr, cc] = key.split(",").map(Number);
          if (rr * cols + cc === excludeIndex) continue;
          const cell = board.getCell(rr, cc);
          if (!cell.mine) {
            cell.mine = true;
            placed++;
          }
        }

        // 足りなかった分は同じ行から補填
        while (placed < cols) {
          const cc = Math.floor(rng() * cols);
          const cell = board.getCell(r, cc);
          if (!cell.mine && (r * cols + cc !== excludeIndex)) {
            cell.mine = true;
            placed++;
          }
        }
      }
    } else if (byCol) {
      const bridges = mineCount / rows;
      const usedCols = new Set();
      while (usedCols.size < bridges) {
        let c = Math.floor(rng() * cols);
        if (usedCols.has(c)) continue;
        usedCols.add(c);

        const startCol = c;
        const path = [];

        for (let r = 0; r < rows; r++) {
          path.push([r, c]);

          if (r < rows - 1) {
            const offset = c - startCol;
            let choices = [0];
            if (offset > 0) choices.push(-1, -1), choices.push(1);
            else if (offset < 0) choices.push(1, 1), choices.push(-1);
            else choices.push(-1, 1);

            // ★ 合流禁止チェック
            const validMoves = choices.filter(delta => {
              const candidate = Math.max(0, Math.min(cols - 1, c + delta));
              const nextCell = board.getCell(r + 1, candidate);
              return !nextCell.mine;
            });

            if (validMoves.length === 0) {
              // 進めない → この橋は失敗扱い（リトライ）
              return this.place(board, mineCount, rng, excludeIndex);
            }

            const delta = validMoves[Math.floor(rng() * validMoves.length)];
            c = Math.max(0, Math.min(cols - 1, c + delta));
          }
        }

        // 経路をユニーク化
        const unique = [...new Set(path.map(p => p.join(",")))];
        let placed = 0;
        for (const key of unique) {
          const [rr, cc] = key.split(",").map(Number);
          if (rr * cols + cc === excludeIndex) continue;
          const cell = board.getCell(rr, cc);
          if (!cell.mine) {
            cell.mine = true;
            placed++;
          }
        }

        // 足りなかった分は同じ列から補填
        while (placed < rows) {
          const rr = Math.floor(rng() * rows);
          const cell = board.getCell(rr, c);
          if (!cell.mine && (rr * cols + c !== excludeIndex)) {
            cell.mine = true;
            placed++;
          }
        }
      }
    }
  }
}
//必ずくっつく
class NoIsolatedPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    const total = board.rows * board.cols;
    let attempt = 0;

    while (true) {
      attempt++;
      // 盤面をリセット
      for (const cell of board.cells) {
        cell.mine = false;
      }

      // ランダムに地雷を配置
      let placed = 0;
      while (placed < mineCount) {
        const idx = Math.floor(rng() * total);
        if (idx === excludeIndex) continue;
        const cell = board.cells[idx];
        if (!cell.mine) {
          cell.mine = true;
          placed++;
        }
      }

      // 孤立チェック
      let isolated = false;
      for (const cell of board.cells) {
        if (!cell.mine) continue;
        let hasNeighborMine = false;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const rr = cell.r + dr, cc = cell.c + dc;
            if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
            if (board.getCell(rr, cc).mine) {
              hasNeighborMine = true;
              break;
            }
          }
          if (hasNeighborMine) break;
        }
        if (!hasNeighborMine) {
          isolated = true;
          break;
        }
      }

      if (!isolated) {
        // 成功
        // console.log("配置成功 after", attempt, "attempts");
        return;
      }
      // 失敗ならリトライ
    }
  }
}
//大陸設置
class ContinentPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    const total = board.rows * board.cols;

    while (true) {
      // 盤面リセット
      for (const cell of board.cells) {
        cell.mine = false;
      }

      // ランダム配置
      let placed = 0;
      while (placed < mineCount) {
        const idx = Math.floor(rng() * total);
        if (idx === excludeIndex) continue;
        const cell = board.cells[idx];
        if (!cell.mine) {
          cell.mine = true;
          placed++;
        }
      }

      // --- 連結チェック ---
      if (this._isSingleContinent(board)) {
        return; // 成功
      }
      // 失敗ならリトライ
    }
  }

  _isSingleContinent(board) {
    // 地雷セルを探す
    const mines = board.cells.filter(c => c.mine);
    if (mines.length === 0) return false;

    // BFS/DFSで最初の地雷から連結成分を探索
    const visited = new Set();
    const start = mines[0];
    const stack = [start];
    visited.add(start);

    while (stack.length > 0) {
      const cur = stack.pop();
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = cur.r + dr, cc = cur.c + dc;
          if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
          const nb = board.getCell(rr, cc);
          if (nb.mine && !visited.has(nb)) {
            visited.add(nb);
            stack.push(nb);
          }
        }
      }
    }

    // すべての地雷が訪問済みなら「大陸」
    return visited.size === mines.length;
  }
}
//  3連のみ
class ThreeInRowPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    const total = board.rows * board.cols;

    while (true) {
      // 盤面リセット
      for (const cell of board.cells) cell.mine = false;

      // ランダム配置
      let placed = 0;
      while (placed < mineCount) {
        const idx = Math.floor(rng() * total);
        if (idx === excludeIndex) continue;
        const cell = board.cells[idx];
        if (!cell.mine) {
          cell.mine = true;
          placed++;
        }
      }

      // 条件チェック
      if (this._allInThree(board) && !this._hasFourOrMore(board)) {
        return; // 成功
      }
      // 失敗ならリトライ
    }
  }

  // 各地雷が必ず3連に属しているか
  _allInThree(board) {
    for (const cell of board.cells) {
      if (!cell.mine) continue;
      if (!this._isPartOfThree(board, cell)) return false;
    }
    return true;
  }

  _isPartOfThree(board, cell) {
    const dirs = [[1,0],[0,1],[1,1],[1,-1]];
    for (const [dr, dc] of dirs) {
      let count = 1; // 自分を含める
      // 前方向
      let r = cell.r + dr, c = cell.c + dc;
      while (r >= 0 && c >= 0 && r < board.rows && c < board.cols) {
        if (board.getCell(r,c).mine) { count++; r+=dr; c+=dc; }
        else break;
      }
      // 逆方向
      r = cell.r - dr; c = cell.c - dc;
      while (r >= 0 && c >= 0 && r < board.rows && c < board.cols) {
        if (board.getCell(r,c).mine) { count++; r-=dr; c-=dc; }
        else break;
      }
      if (count >= 3) return true; // 3連に属している
    }
    return false;
  }

  // 4連以上が存在するか
  _hasFourOrMore(board) {
    for (const cell of board.cells) {
      if (!cell.mine) continue;
      const dirs = [[1,0],[0,1],[1,1],[1,-1]];
      for (const [dr, dc] of dirs) {
        let count = 1;
        let r = cell.r + dr, c = cell.c + dc;
        while (r >= 0 && c >= 0 && r < board.rows && c < board.cols) {
          if (board.getCell(r,c).mine) { count++; r+=dr; c+=dc; }
          else break;
        }
        r = cell.r - dr; c = cell.c - dc;
        while (r >= 0 && c >= 0 && r < board.rows && c < board.cols) {
          if (board.getCell(r,c).mine) { count++; r-=dr; c-=dc; }
          else break;
        }
        if (count > 3) return true; // 4連以上がある
      }
    }
    return false;
  }
}
//4分割
class QuadrantEqualPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    const rows = board.rows;
    const cols = board.cols;

    if (rows % 2 !== 0 || cols % 2 !== 0) {
      throw new Error("行・列は偶数である必要があります");
    }
    if (mineCount % 4 !== 0) {
      throw new Error("地雷数は4の倍数である必要があります");
    }

    const perQuadrant = mineCount / 4;
    const halfR = rows / 2;
    const halfC = cols / 2;

    // 4つの領域を定義
    const quadrants = [
      { r0: 0,     r1: halfR, c0: 0,     c1: halfC }, // 左上
      { r0: 0,     r1: halfR, c0: halfC, c1: cols }, // 右上
      { r0: halfR, r1: rows,  c0: 0,     c1: halfC }, // 左下
      { r0: halfR, r1: rows,  c0: halfC, c1: cols }  // 右下
    ];

    for (const q of quadrants) {
      let placed = 0;
      while (placed < perQuadrant) {
        const r = q.r0 + Math.floor(rng() * (q.r1 - q.r0));
        const c = q.c0 + Math.floor(rng() * (q.c1 - q.c0));
        const idx = r * cols + c;
        if (idx === excludeIndex) continue;
        const cell = board.getCell(r, c);
        if (!cell.mine) {
          cell.mine = true;
          placed++;
        }
      }
    }
  }
}
//道

// 端点数を数える（次数1のセル）
// 8方向の隣接セル取得
function neighbors8(board, cell) {
  const dirs = [
    [-1,0],[1,0],[0,-1],[0,1],
    [-1,-1],[-1,1],[1,-1],[1,1]
  ];
  const out = [];
  for (const [dr, dc] of dirs) {
    const n = board.getCell(cell.r + dr, cell.c + dc);
    if (n) out.push(n);
  }
  return out;
}

// 次数（隣接する地雷セル数）
function degree(board, cell) {
  return neighbors8(board, cell).filter(n => n.mine).length;
}

// 経路を伸ばせるか判定
function canExtendTo(board, currentEnd, next, startCell) {
  if (!next || next.mine) return false;
  if (startCell && next === startCell) return false; // ループ禁止

  const adjMines = neighbors8(board, next).filter(n => n.mine);
  if (!adjMines.includes(currentEnd)) return false; // 終端セルに隣接していない
  if (adjMines.some(m => m !== currentEnd)) return false; // 他の地雷に触れている

  // 斜めすり抜け禁止
  const dr = next.r - currentEnd.r;
  const dc = next.c - currentEnd.c;
  if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
    const side1 = board.getCell(currentEnd.r, currentEnd.c + dc);
    const side2 = board.getCell(currentEnd.r + dr, currentEnd.c);
    if ((side1 && side1.mine) || (side2 && side2.mine)) return false;
  }

  // 追加後の次数 <= 2
  const degEndAfter  = degree(board, currentEnd) + 1;
  const degNextAfter = degree(board, next) + 1;
  return degEndAfter <= 2 && degNextAfter <= 2;
}

// ★ PlacementStrategy 実装
class PathPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    const total = board.rows * board.cols;
    let placed = 0;
    let retries = 0;
    const MAX_RETRY = 5000; // 大きめに設定

    while (placed < mineCount && retries < MAX_RETRY) {
      retries++;

      // 盤面クリア
      for (const c of board.cells) c.mine = false;
      placed = 0;

      // --- スタートセル選択 ---
      let start = null;
      for (let tries = 0; tries < 300; tries++) {
        const idx = Math.floor(rng() * total);
        const cand = board.cells[idx];
        if (cand.mine) continue;
        if (excludeIndex >= 0 && board.cells[excludeIndex] === cand) continue;
        if (neighbors8(board, cand).some(n => n.mine)) continue;
        if (degree(board, cand) > 1) { // ★ 次数2以上は不適格
          start = null;
          break;
        }
        start = cand;
        break;
      }
      if (!start) continue; // → リトライ

      // スタート確定
      start.mine = true;
      placed++;
      let current = start;

      // --- 経路を伸ばす ---
      while (placed < mineCount) {
        const cands = neighbors8(board, current)
          .filter(nb => canExtendTo(board, current, nb, start));

        if (cands.length === 0) break;

        // ヒューリスティック：自由度が少ない候補を優先
        cands.sort((a, b) =>
          neighbors8(board, a).filter(x => !x.mine).length -
          neighbors8(board, b).filter(x => !x.mine).length
        );

        const next = cands[Math.floor(rng() * Math.min(3, cands.length))];
        next.mine = true;
        placed++;
        current = next;
      }

      if (placed >= mineCount) break; // 成功
    }

    // --- 保険補充（孤立セルで埋める） ---
    while (placed < mineCount) {
      for (const cell of board.cells) {
        if (cell.mine) continue;
        if (excludeIndex >= 0 && board.cells[excludeIndex] === cell) continue;
        if (neighbors8(board, cell).some(n => n.mine)) continue;
        cell.mine = true;
        placed++;
        if (placed >= mineCount) break;
      }
    }
  }
}
//色ごとに均等に配置
class ColorBalancedPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    const rows = board.rows;
    const cols = board.cols;

    // 2色に分ける（チェス盤パターン）
    const groups = [[], []];
    for (const cell of board.cells) {
      const color = (cell.r + cell.c) % 2; // 0 or 1
      groups[color].push(cell);
    }

    // mineCount が2で割り切れるかチェック
    if (mineCount % 2 !== 0) {
      throw new Error("地雷数は色数で割り切れる必要があります");
    }
    const perGroup = mineCount / 2;

    // 各グループに均等配置
    for (const group of groups) {
      let placed = 0;
      while (placed < perGroup) {
        const idx = Math.floor(rng() * group.length);
        const cell = group[idx];
        if (cell.mine) continue;
        if (excludeIndex >= 0 && board.cells[excludeIndex] === cell) continue;
        cell.mine = true;
        placed++;
      }
    }
  }
}

// 周囲8マスに地雷がない場所をランダムに配置
class NoTouchPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    // 全セルを候補に入れる
    let candidates = board.cells.map(c => c);

    let placed = 0;
    while (placed < mineCount && candidates.length > 0) {
      // ランダムに候補を選ぶ
      const idx = Math.floor(rng() * candidates.length);
      const cell = candidates[idx];

      if (cell.r * board.cols + cell.c === excludeIndex) {
        candidates.splice(idx, 1);
        continue;
      }

      // 地雷を置く
      cell.mine = true;
      placed++;

      // このセルと周囲8マスを候補から削除
      candidates = candidates.filter(c => {
        return Math.abs(c.r - cell.r) > 1 || Math.abs(c.c - cell.c) > 1;
      });
    }

    if (placed < mineCount) {
      throw new Error("指定数の地雷を配置できませんでした");
    }
  }
}

// 縦横禁止配置（斜めはOK）
class NoOrthogonalPlacement extends PlacementStrategy {
  place(board, mineCount, rng, excludeIndex = -1) {
    let placed = 0;
    const total = board.rows * board.cols;

    while (placed < mineCount) {
      const idx = Math.floor(rng() * total);
      if (idx === excludeIndex) continue;

      const cell = board.cells[idx];
      if (cell.mine) continue;

      // 上下左右に地雷があるかチェック
      const r = cell.r, c = cell.c;
      const orthogonals = [
        [r-1, c], [r+1, c],
        [r, c-1], [r, c+1]
      ];
      let hasNeighborMine = false;
      for (const [rr, cc] of orthogonals) {
        if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
        if (board.getCell(rr, cc).mine) {
          hasNeighborMine = true;
          break;
        }
      }

      if (hasNeighborMine) continue; // 縦横に地雷があるなら置かない

      // 問題なければ設置
      cell.mine = true;
      placed++;
    }
  }
}

//探索範囲  の実装
// 8方向探索（標準マインスイーパー）
class Normal8Explore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
          out.push(board.getCell(rr, cc));
        }
      }
    }
    return out;
  }
}

// ナイト移動（チェスのナイト型）
class KnightExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const moves = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
    return moves
      .map(([dr, dc]) => [r+dr, c+dc])
      .filter(([rr, cc]) => rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols)
      .map(([rr, cc]) => board.getCell(rr, cc));
  }
}

// クイーン視線型（一直線に伸びる）
class QueenSightExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
    const out = [];
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
        out.push(board.getCell(rr, cc));
        rr += dr; cc += dc;
      }
    }
    return out;
  }
}
// 5×5探索（上下左右2マスまで）
class Big25Explore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (dr === 0 && dc === 0) continue; // 自分は除外
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
          out.push(board.getCell(rr, cc));
        }
      }
    }
    return out;
  }
}
// 色別探索：lightマスは縦のみ、darkマスは横のみ
class ColorAxisExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const isLight = ((r + c) % 2 === 0);

    if (isLight) {
      // 縦方向に端まで
      for (let rr = 0; rr < board.rows; rr++) {
        if (rr === r) continue;
        out.push(board.getCell(rr, c));
      }
    } else {
      // 横方向に端まで
      for (let cc = 0; cc < board.cols; cc++) {
        if (cc === c) continue;
        out.push(board.getCell(r, cc));
      }
    }

    return out;
  }
}
// 色別探索：lightは縦横、darkは斜めに端まで
class ColorAxisDiagonalExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const isLight = ((r + c) % 2 === 0);

    if (isLight) {
      // 縦横に端まで
      // 縦
      for (let rr = 0; rr < board.rows; rr++) {
        if (rr !== r) out.push(board.getCell(rr, c));
      }
      // 横
      for (let cc = 0; cc < board.cols; cc++) {
        if (cc !== c) out.push(board.getCell(r, cc));
      }
    } else {
      // 斜めに端まで
      const dirs = [[1,1], [1,-1], [-1,1], [-1,-1]];
      for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc;
        while (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
          out.push(board.getCell(rr, cc));
          rr += dr;
          cc += dc;
        }
      }
    }

    return out;
  }
}
// 地雷が見つかるまで直線探索
class UntilMineExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const dirs = [
      [1,0], [-1,0], [0,1], [0,-1],   // 縦横
      [1,1], [1,-1], [-1,1], [-1,-1] // 斜め
    ];

    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
        const cell = board.getCell(rr, cc);
        out.push(cell);
        if (cell.mine) {
          // 地雷を見つけたらこの方向はストップ
          break;
        }
        rr += dr;
        cc += dc;
      }
    }

    return out;
  }
}
// 周囲から同心円状に広げ、地雷が見つかるまで探索
class ExpandUntilMineExplore extends ExploreStrategy {
   neighbors(board, r, c) {
    const out = [];
    const maxRadius = Math.max(board.rows, board.cols);

    for (let radius = 1; radius <= maxRadius; radius++) {
      let foundMine = false;

      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const dist = Math.sqrt(dr*dr + dc*dc);
          // ★ 内側はすべて含める
          if (dist <= radius) {
            const rr = r + dr, cc = c + dc;
            if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;

            const cell = board.getCell(rr, cc);
            if (!out.includes(cell)) {
              out.push(cell);
            }
            if (cell.mine) {
              foundMine = true;
            }
          }
        }
      }

      if (foundMine) break; // この半径で地雷を見つけたら終了
    }

    return out;
  }
}

// 縦横方向に地雷がつながっている部分を探索する
class ClusterDetectExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const seen = new Set();
    const start = board.getCell(r, c);

    // 自分が地雷ならそのクラスターを返す
    if (start.mine) {
      return this._collectCluster(board, start, seen);
    }

    // 自分が地雷でない場合 → 隣接セルに地雷があるか調べる
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dr, dc] of dirs) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
      const nb = board.getCell(rr, cc);
      if (nb.mine) {
        const cluster = this._collectCluster(board, nb, seen);
        for (const c of cluster) {
          if (!out.includes(c)) out.push(c);
        }
      }
    }
    return out;
  }

  _collectCluster(board, start, seen) {
    const cluster = [];
    const q = [start];
    while (q.length > 0) {
      const cur = q.pop();
      const key = cur.r + "," + cur.c;
      if (seen.has(key)) continue;
      seen.add(key);
      cluster.push(cur);

      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      for (const [dr, dc] of dirs) {
        const rr = cur.r + dr, cc = cur.c + dc;
        if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
        const nb = board.getCell(rr, cc);
        if (nb.mine && !seen.has(nb.r + "," + nb.c)) {
          q.push(nb);
        }
      }
    }
    return cluster;
  }
}
// 縦横1マスだけ探索する//ハイライト
class Cross4Explore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dr, dc] of dirs) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
      out.push(board.getCell(rr, cc));
    }
    return out;
  }
}
//十字
class Cross2Explore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const dirs = [
      [1, 0],  // 下
      [-1, 0], // 上
      [0, 1],  // 右
      [0, -1]  // 左
    ];
    for (const [dr, dc] of dirs) {
      for (let step = 1; step <= 2; step++) { // ★ 2マス先まで
        const rr = r + dr * step;
        const cc = c + dc * step;
        if (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
          out.push(board.getCell(rr, cc));
        }
      }
    }
    return out;
  }
}
//リング
class RingExplore extends ExploreStrategy {
  constructor(radius = 2) {
    super();
    this.radius = radius;
  }

  neighbors(board, r, c) {
    const ns = [];
    const R = this.radius;

    for (let dr = -R; dr <= R; dr++) {
      for (let dc = -R; dc <= R; dc++) {
        if (dr === 0 && dc === 0) continue; // 自分自身は除外
        const dist = Math.max(Math.abs(dr), Math.abs(dc));
        if (dist === R) { // ★ちょうど半径Rのマスだけ
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
            ns.push(board.getCell(rr, cc));
          }
        }
      }
    }
    return ns;
  }
}
//菱形
class DiamondExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const cell = board.getCell(r, c);
    if (!cell) return [];

    const radius = 2; // ★ シンプルに固定半径1（ダイヤ型）

    const out = [];
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (dr === 0 && dc === 0) continue;
        // マンハッタン距離で判定
        if (Math.abs(dr) + Math.abs(dc) <= radius) {
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && cc >= 0 && rr < board.rows && cc < board.cols) {
            out.push(board.getCell(rr, cc));
          }
        }
      }
    }

    return out;
  }
}
//地雷から地雷に接続
class RippleChainExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const seen = new Set();
    const queue = [[r, c, 0]]; // [行, 列, 現在の半径]

    while (queue.length > 0) {
      const [cr, cc, depth] = queue.shift();

      // 半径4を超えたら打ち切り
      if (depth >= 4) continue;

      let foundMine = false;

      // この半径で探索
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = cr + dr, cc2 = cc + dc;
          if (rr < 0 || cc2 < 0 || rr >= board.rows || cc2 >= board.cols) continue;

          const cell = board.getCell(rr, cc2);
          const key = rr + "," + cc2;
          if (!seen.has(key)) {
            out.push(cell);
            seen.add(key);
          }

          if (cell.mine) {
            foundMine = true;
            // ★ 地雷を起点にさらに波紋を広げる（ただし半径4まで）
            queue.push([rr, cc2, depth + 1]);
          }
        }
      }

      // 波紋状の性質を残すなら「地雷を見つけたら break」して次の起点へ
      if (foundMine) continue;
    }

    return out;
  }
}
//地雷から地雷に波紋
class RippleExplore extends ExploreStrategy {
    neighbors(board, r, c) {
    const out = [];
    const maxRadius = Math.max(board.rows, board.cols);

    for (let radius = 1; radius <= maxRadius; radius++) {
      let foundMine = 0;

      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const dist = (dr*dr + dc*dc);
          // ★ 内側はすべて含める
          if (dist <= radius) {
            const rr = r + dr, cc = c + dc;
            if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;

            const cell = board.getCell(rr, cc);
            if (!out.includes(cell)) {
              out.push(cell);
            }
            if (cell.mine) {
              foundMine += 1;
            }
          }
        }
      }

      if (foundMine<radius) break; // この半径で地雷を見つけたら終了
    }
    //console.log(maxRadius);
    return out;
  }
}
//地雷3つになるまで探索、三角
class ExpandUntil2MinesTriangleExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    const maxRadius = Math.max(board.rows, board.cols);
    let mineCount = 0;

    for (let radius = 1; radius <= maxRadius; radius++) {
      // 三角形の頂点を定義（中心を (0,0) とした座標系）
      const v1 = {x: 0, y: -radius};
      const v2 = {x: -Math.sqrt(3)/2 * radius, y: radius/2};
      const v3 = {x:  Math.sqrt(3)/2 * radius, y: radius/2};

      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;

          // (dc,dr) が三角形内か判定
          if (this._pointInTriangle({x: dc, y: dr}, v1, v2, v3)) {
            const cell = board.getCell(rr, cc);
            if (!out.includes(cell)) {
              out.push(cell);
              if (cell.mine) {
                mineCount++;
                if (mineCount >= 2) {
                  return out; // 地雷3つ見つけたら終了
                }
              }
            }
          }
        }
      }
    }
    return out;
  }

  // 三角形内判定（バリセントリック座標）
  _pointInTriangle(p, a, b, c) {
    const area = (a, b, c) => (b.x - a.x)*(c.y - a.y) - (c.x - a.x)*(b.y - a.y);
    const areaABC = area(a, b, c);
    const areaPAB = area(p, a, b);
    const areaPBC = area(p, b, c);
    const areaPCA = area(p, c, a);

    const hasNeg = (areaPAB < 0) || (areaPBC < 0) || (areaPCA < 0);
    const hasPos = (areaPAB > 0) || (areaPBC > 0) || (areaPCA > 0);

    return !(hasNeg && hasPos); // 全部同符号なら内側
  }
}

// 全盤面を探索範囲にする ExploreStrategy
class GlobalExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    const out = [];
    for (let rr = 0; rr < board.rows; rr++) {
      for (let cc = 0; cc < board.cols; cc++) {
        // 自分自身は除外
        if (rr === r && cc === c) continue;
        out.push(board.getCell(rr, cc));
      }
    }
    return out;
  }
}
// 地雷数に応じた探索範囲正方形
class SquareMineCountExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    let radius = 1;
    const maxRadius = Math.max(board.rows, board.cols);
    let totalMines = 0;

    while (radius <= maxRadius) {
      let newMines = 0;

      // この半径の正方形の外周だけを調べる
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue; // 外周のみ
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
          if (rr === r && cc === c) continue;

          const cell = board.getCell(rr, cc);
          if (cell.mine) newMines++;
        }
      }

      totalMines += newMines;

      // 2個以上見つかったら次の半径へ
      if (newMines >= 2) {
        radius++;
      } else {
        break;
      }
    }

    // 最終的な半径で neighbors を返す
    const out = [];
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
        if (rr === r && cc === c) continue;
        out.push(board.getCell(rr, cc));
      }
    }
    return out;
  }
}
// 地雷数に応じた探索範囲ひし形
class DiamondMineCountExplore extends ExploreStrategy {
  neighbors(board, r, c) {
    let radius = 1;
    const maxRadius = board.rows + board.cols;
    let mineCount = 0;
    let required = 2; // 最初に必要な地雷数

    while (radius <= maxRadius) {
      // この半径のひし形範囲を走査
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          if (Math.abs(dr) + Math.abs(dc) > radius) continue; // ひし形条件
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
          if (rr === r && cc === c) continue;

          const cell = board.getCell(rr, cc);
          if (cell.mine) mineCount++;
        }
      }

      // 累計地雷数が必要数を満たす限り、段階的に広げる
      while (mineCount >= required) {
        radius++;
        required += 1; // 次の半径に必要な地雷数を増やす
      }

      // まだ必要数に届かないなら終了
      if (mineCount < required) break;
    }

    // 最終的な半径で neighbors を返す
    const out = [];
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.abs(dr) + Math.abs(dc) > radius) continue;
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= board.rows || cc >= board.cols) continue;
        if (rr === r && cc === c) continue;

        out.push(board.getCell(rr, cc));
      }
    }
    return out;
  }
}

// ====== 数字ルール実装 ======
// 総数ルール（標準）
class TotalNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 周囲の地雷数を数値で返す
    return neighbors.filter(nb => nb.mine).length;
  }
  render(cell) {
    // 0なら空白、それ以外は数字
    return cell.value === 0 ? "" : String(cell.value);
  }
}

// クエスチョンルール（3以上は ?）
class QmarkNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    const count = neighbors.filter(nb => nb.mine).length;
    return count; // ← 数値を返す
  }
  render(cell) {
    if (cell.value === 0) return "";
    if (cell.value === 1) return "1";
    if (cell.value === 2) return "2";
    return "?";
  }
}

// ファジー（±1 誤差付き）
class FuzzyNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 正しい数値を保持
    return neighbors.filter(nb => nb.mine).length;
  }
  render(cell) {
    if (cell.value === 0) {
      return ""; // ← 周囲に地雷がないなら空白
    }
    const offset = Math.random() < 0.5 ? -1 : +1;
    const fuzzy = Math.max(0, cell.value + offset);
    return String(fuzzy);
  }
}

// 色別（白黒マスで分けて数える）
class ColorSplitNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    let lightCount = 0, darkCount = 0;
    for (const nb of neighbors) {
      if (nb.mine) {
        const isLight = ((nb.r + nb.c) % 2 === 0);
        if (isLight) lightCount++;
        else darkCount++;
      }
    }
    return { light: lightCount, dark: darkCount };
  }

  render(cell) {
    const { light, dark } = cell.value;
    if (light === 0 && dark === 0) return "";
    return `${light}:${dark}`;
  }

  isZero(cell) {
    return cell.value.light === 0 && cell.value.dark === 0;
  }
}
// 3で割った余りルール
class mod3NumberRule extends NumberRule {
  calculate(cell, neighbors) {
    const count = neighbors.filter(nb => nb.mine).length;

    // 周囲に地雷がない場合は特別扱い
    if (count === 0) {
      cell._rawCount = 0;
      return 0;
    }

    cell._rawCount = count;
    return count % 3;
  }

  render(cell) {
    if (cell.mine) {
      return "💣";
    }
    if (cell._rawCount === 0) {
      return ""; // 周囲に地雷がないときだけ空白
    }
    return String(cell.value); // 余りが0でも "0" を表示
  }

  // ★ floodOpen 判定用にオーバーライド
  isZero(cell) {
    return cell._rawCount === 0; 
  }
}
// 10で割った余りルール
class mod10NumberRule extends NumberRule {
  calculate(cell, neighbors) {
    const count = neighbors.filter(nb => nb.mine).length;

    // 周囲に地雷がない場合は特別扱い
    if (count === 0) {
      cell._rawCount = 0;
      return 0;
    }

    cell._rawCount = count;
    return count % 10;
  }

  render(cell) {
    if (cell.mine) {
      return "💣";
    }
    if (cell._rawCount === 0) {
      return ""; // 周囲に地雷がないときだけ空白
    }
    return String(cell.value); // 余りが0でも "0" を表示
  }

  // ★ floodOpen 判定用にオーバーライド
  isZero(cell) {
    return cell._rawCount === 0; 
  }
}
// 固まりごと数ルール
class ClusterNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    const mines = neighbors.filter(nb => nb.mine);
    const seen = new Set();
    const clusters = [];

    for (const m of mines) {
      const key = m.r + "," + m.c;
      if (seen.has(key)) continue;

      // 新しい固まりを探索
      let size = 0;
      const q = [m];
      while (q.length) {
        const cur = q.pop();
        const curKey = cur.r + "," + cur.c;
        if (seen.has(curKey)) continue;
        seen.add(curKey);
        size++;

        // ★ 縦横4方向だけで繋がっている地雷を追加
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dr, dc] of dirs) {
          const rr = cur.r + dr, cc = cur.c + dc;
          const nb = neighbors.find(n => n.r === rr && n.c === cc && n.mine);
          if (nb) q.push(nb);
        }
      }
      clusters.push(size);
    }

    // サイズを降順に並べる
    clusters.sort((a, b) => b - a);
    return clusters;
  }

   render(cell) {
    if (cell.mine) return "💣";
    if (!cell.value || cell.value.length === 0) return "";
//圧縮
    const compressed = compressSequence(cell.value);

    // ★ 各要素を <div> にして返す
    return `<div class="grid-cell">${compressed.map(v => `<span>${v}</span>`).join("")}</div>`;

  }

  isZero(cell) {
    return !cell.value || cell.value.length === 0;
  }
}
// 固まり数ルール（縦横4方向接続版）MAX,MIN表示
class ClusterMaxMixNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    const mines = neighbors.filter(nb => nb.mine);
    const seen = new Set();
    const clusters = [];

    for (const m of mines) {
      const key = m.r + "," + m.c;
      if (seen.has(key)) continue;

      // 新しい固まりを探索
      let size = 0;
      const q = [m];
      while (q.length) {
        const cur = q.pop();
        const curKey = cur.r + "," + cur.c;
        if (seen.has(curKey)) continue;
        seen.add(curKey);
        size++;

        // 縦横だけで繋がっている地雷を追加
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dr, dc] of dirs) {
          const rr = cur.r + dr, cc = cur.c + dc;
          const nb = neighbors.find(n => n.r === rr && n.c === cc && n.mine);
          if (nb) q.push(nb);
        }
      }
      clusters.push(size);
    }

    return clusters;
  }

  render(cell) {
    if (cell.mine) return "💣";
    if (!cell.value || cell.value.length === 0) return "";

    const clusters = cell.value;
    if (clusters.length === 1) {
      // 固まりが1つ → そのまま表示
      return String(clusters[0]);
    } else {
      // 固まりが複数 → 最大値と最小値を表示
      const max = Math.max(...clusters);
      const min = Math.min(...clusters);
      return `${max},${min}`;
    }
  }

  isZero(cell) {
    return !cell.value || cell.value.length === 0;
  }
}
// 色ごとの差だけを出すルール
class ColorDiffNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    if (!neighbors || neighbors.length === 0) {
      return null; // 検知対象がない → 空白
    }

    let lightCount = 0, darkCount = 0;
    for (const nb of neighbors) {
      if (nb.mine) {
        const isLight = ((nb.r + nb.c) % 2 === 0);
        if (isLight) lightCount++;
        else darkCount++;
      }
    }

    // 両方とも「差の絶対値」を返す
    const diff = Math.abs(lightCount - darkCount);

    // 検知なしなら空白
    if (lightCount === 0 && darkCount === 0) {
      return null;
    }
    return diff;
  }

  render(cell) {
    if (cell.value === null) return ""; // 検知なしは空白
    return String(cell.value);          // 0 も数字もそのまま表示
  }

  isZero(cell) {
    // floodOpen で「0」と「空白(null)」の両方を広げる
    return cell.value === null || cell.value === 0;
  }
}
//カラーごとに価値
class ColorWeightNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    let total = 0;
    for (const nb of neighbors) {
      if (nb.mine) {
        const isLight = ((nb.r + nb.c) % 2 === 0);
        total += isLight ? 1 : 2;
      }
    }
    return total;
  }

  render(cell) {
    if (cell.value === 0) return ""; // 0は空白
    return String(cell.value);
  }

  isZero(cell) {
    return cell.value === 0;
  }
}
//三つごと
class Range3NumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 周囲の地雷数を数える
    return neighbors.filter(nb => nb.mine).length;
  }

  render(cell) {
    if (cell.mine) return "💣"; // 地雷はそのまま

    const v = cell.value;
    if (v === 0) return ""; // 空白は空文字

    // 3ごとの区間にまとめる
    const start = Math.floor((v - 1) / 3) * 3 + 1;
    const end = start + 2;
    return `${start}~${end}`;
  }
}
// 分解表示ルール
class DecomposeNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 周囲の地雷数を数える
    return neighbors.filter(nb => nb.mine).length;
  }

  render(cell) {
    const n = cell.value;

    // 0は空白
    if (n === 0) return "";
    // 1と2はそのまま
    if (n === 1 || n === 2) return String(n);

    // --- 素因数分解 ---
    const factors = [];
    let num = n;
    for (let p = 2; p * p <= num; p++) {
      while (num % p === 0) {
        factors.push(p);
        num /= p;
      }
    }
    if (num > 1) factors.push(num);

    let parts = [];

    if (factors.length === 2) {
      // 素因数がちょうど2つ → そのまま
      parts = factors;
    } else if (factors.length > 2) {
      // 素因数が3つ以上 → 2項にまとめる
      const a = factors[0] * factors[1];
      const b = factors.slice(2).reduce((x, y) => x * y, 1);
      parts = [a, b];
    } else {
      // 素数（分解できない） → 和分解
      const a = Math.floor(n / 2);
      const b = n - a;
      parts = [a, b];
    }

    // 大きい順に並べて「、」で区切る
    parts.sort((a, b) => b - a);
    return parts.join(",");
  }

  isZero(cell) {
    return cell.value === 0;
  }
}
// 距離の合計
class DistanceSumRule extends NumberRule {
  constructor(explore) {
    super();
    this.explore = explore;
  }

  calculate(cell, neighborsIgnored) {
    const board = cell.board;
    const r = cell.r, c = cell.c;
    const scope = this.explore.neighbors(board, r, c);

    let sum = 0;
    for (const nb of scope) {
      if (nb.mine) {
        const dx = r - nb.r;
        const dy = c - nb.c;
        sum += Math.sqrt(dx * dx + dy * dy);
      }
    }

    // 合計値を保存
    cell.value = sum;
    return sum;
  }

 render(cell) {
  if (cell.value === 0) return "";

  const squared = Math.round(cell.value * cell.value); // 合計を2乗して整数化
  const root = Math.sqrt(squared);

  if (Number.isInteger(root)) {
    return String(root); // 完全平方数なら整数表示
  } else {
    return `√${squared}`; // それ以外は√表記
  }
}


  isZero(cell) {
    return cell.value === 0;
  }
}


// 距離の積
class DistanceProductInExploreRule extends NumberRule {
  constructor(explore) {
    super();
    this.explore = explore;
  }

  calculate(cell, neighborsIgnored) {
    const board = cell.board;
    const r = cell.r, c = cell.c;
    const scope = this.explore.neighbors(board, r, c);

    let product = 1;
    let found = false;

    for (const nb of scope) {
      if (nb.mine) {
        const dx = r - nb.r;
        const dy = c - nb.c;
        const d = Math.sqrt(dx * dx + dy * dy);
        product *= d;
        found = true;
      }
    }

    cell.value = found ? product : 0;
    return cell.value;
  }

 render(cell) {
  if (cell.value === 0) return "";

  const squared = Math.round(cell.value * cell.value);

  // 平方数なら整数に
  const root = Math.sqrt(squared);
  if (Number.isInteger(root)) {
    return String(root);
  }

  // 平方数で割れる部分を探す（最大の平方因数を外に出す）
  let outside = 1;
  let inside = squared;
  for (let i = Math.floor(Math.sqrt(squared)); i >= 2; i--) {
    if (squared % (i * i) === 0) {
      outside = i;
      inside = squared / (i * i);
      break;
    }
  }

  if (inside === 1) {
    return String(outside); // ちょうど平方数
  } else {
    return `${outside === 1 ? "" : outside}√${inside}`;
  }
}

  isZero(cell) {
    return cell.value === 0;
  }
}
// 真偽の数
class TruthLieNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 通常の value 計算
    return neighbors.filter(nb => nb.mine).length;
  }

  render(cell) {
    if (cell.value === 0) return "";

    const truth = cell.value;
    let lie;

    if (truth <= 3) {
      lie = truth + Math.floor( Math.random() * 2 )+2; // 1,2,3 の場合は必ず +2か3
    } else {
      // それ以外は ±2 のどちらかをランダムに
      lie = (Math.random() < 0.5) ? truth - Math.floor( Math.random() * 2 )+2 : truth + Math.floor( Math.random() * 2 )+2;
      if (lie < 0) lie = truth + Math.floor( Math.random() * 2 )+2; // マイナスは避ける
    }

    // 大きい順に並べる
    const values = [truth, lie].sort((a, b) => b - a);

    return `${values[0]}, ${values[1]}`;
  }
}
// 隣接セルの平均値
class NeighborAverageNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 通常の真値を計算して保持
    cell.trueValue = neighbors.filter(nb => nb.mine).length;

    if (cell.trueValue === 0) {
      cell.displayValue = "";
      return cell.trueValue;
    }

    // 隣接セルを探索ルールに従って取得
    const ns = currentGame.explore.neighbors(cell.board, cell.r, cell.c);

    // 隣接セルの trueValue または地雷を1として扱う
    const valid = ns
      .map(nb => nb.mine ? 1 : nb.trueValue)
      .filter(v => v !== undefined && v > 0);

    if (valid.length === 0) {
      cell.displayValue = "";
    } else {
      const sum = valid.reduce((a, v) => a + v, 0);
      const avg = sum / valid.length;
      cell.displayValue = avg.toFixed(1);
    }

    return cell.trueValue;
  }

  render(cell) {
    return cell.displayValue ?? "";
  }
}


// 起点から最も近い地雷と、次に近い地雷の距離の積（探索範囲に従う）
class NearestTwoProductNumberRule extends NumberRule {
  constructor(explore) {
    super();
    this.explore = explore; // 探索ルールに従う
  }

  calculate(cell, neighborsIgnored) {
    const board = cell.board;
    const scope = this.explore.neighbors(board, cell.r, cell.c);

    // 距離の二乗（d^2）を収集（地雷のみ）
    const d2s = [];
    for (const nb of scope) {
      if (nb.mine) {
        const dx = cell.r - nb.r;
        const dy = cell.c - nb.c;
        d2s.push(dx * dx + dy * dy);
      }
    }

    if (d2s.length === 0) {
      cell.value = 0;
      cell.displayValue = "";
      return 0;
    }

    d2s.sort((a, b) => a - b);
    const d1 = d2s[0];

    if (d2s.length === 1) {
      // 地雷が1つ：√(d1) を簡約表示
      cell.value = Math.sqrt(d1);
      cell.displayValue = simplifySqrt(d1);
      return cell.value;
    }

    // d1 より大きい最小の距離^2 を二番目として採用
    let d2 = null;
    for (let i = 1; i < d2s.length; i++) {
      if (d2s[i] > d1) { d2 = d2s[i]; break; }
    }

    if (d2 === null) {
      // すべて同じ距離しかない → 1つ扱い（合算しない）
      cell.value = Math.sqrt(d1);
      cell.displayValue = simplifySqrt(d1);
      return cell.value;
    }

    // √(d1) × √(d2) = √(d1*d2) を簡約表示
    const n = d1 * d2;
    cell.value = Math.sqrt(n);
    cell.displayValue = simplifySqrt(n);
    return cell.value;
  }

  render(cell) {
    return cell.displayValue ?? "";
  }

  isZero(cell) {
    return cell.value === 0;
  }
}
// √(n) を「最大の平方因数」を外に出して k√m に整形
function simplifySqrt(n) {
  if (n <= 0) return "0";
  // 最大の平方因数 k^2 を探す（k は floor(sqrt(n)) から降順に）
  const maxK = Math.floor(Math.sqrt(n));
  for (let k = maxK; k >= 2; k--) {
    const sq = k * k;
    if (n % sq === 0) {
      const inside = n / sq;
      if (inside === 1) return String(k);    // ぴったり平方数
      return `${k}√${inside}`;
    }
  }
  // 何も外に出せない場合
  return `√${n}`;
}
// 偶数は「偶」、奇数は数字を表示するルール
class EvenOddNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    const count = neighbors.filter(nb => nb.mine).length;
    return count; // ← 数値を返す
  }
  render(cell) {
    if (cell.value === 0) return ""; // 0は空白のまま
    if (cell.value % 2 === 0) {
      return "偶"; // 偶数なら「偶」
    } else {
      return String(cell.value); // 奇数はそのまま数字
    }
  }
}
// 奇数は「奇」、偶数は数字を表示するルール
class OddNumberRule extends NumberRule {
    calculate(cell, neighbors) {
    const count = neighbors.filter(nb => nb.mine).length;
    return count; // ← 数値を返す
  }
  render(cell) {
    if (cell.value === 0) return ""; // 0は空白のまま
    if (cell.value % 2 === 1) {
      return "奇"; // 奇数なら「奇」
    } else {
      return String(cell.value); // 偶数はそのまま数字
    }
  }
}
// 素数は「素」、それ以外は数字を表示するルール

class PrimeNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 通常の数字計算（周囲の地雷数を数える）
    let count = 0;
    for (const nb of neighbors) {
      if (nb.mine) count++;
    }
    return count;
  }

  _isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false;
    }
    return true;
  }

  render(cell) {
    if (cell.value === 0) return "";
    if (this._isPrime(cell.value)) {
      return "素"; // 素数なら「素」
    } else {
      return String(cell.value); // 素数以外は数字
    }
  }
}
// 素数なら数字を表示、それ以外は空白
class PrimeOnlyNumberRule extends NumberRule {
  calculate(cell, neighbors) {
    // 周囲の地雷数を計算（通常通り）
    let count = 0;
    for (const nb of neighbors) {
      if (nb.mine) count++;
    }
    return count;
  }

  _isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false;
    }
    return true;
  }

  render(cell) {
    if (cell.value === 0) return "";
    if (this._isPrime(cell.value)) {
      return String(cell.value); // 素数なら数字を表示
    } else {
      return "?"; // 素数以外は空白
    }
  }
}
// ====== ★ここでマップを定義 ======
const placementMap = {
  random: RandomPlacement,
  cluster: ClusterPlacement,
  noDiagonal: NoDiagonalPlacement,
  noThree: NoThreeInRowPlacement,
  pair: PairPlacement,
    rowcolfixed: RowColFixedPlacement,
  bridge: BridgePlacement,
 NoIsolated: NoIsolatedPlacement,
 Continent:ContinentPlacement,
 ThreeInRow:ThreeInRowPlacement,
 QuadrantEqual:QuadrantEqualPlacement,
 Path:PathPlacement,
ColorBalanced:ColorBalancedPlacement,
NoTouch:NoTouchPlacement,
noOrthogonal: NoOrthogonalPlacement
};

const exploreMap = {
  normal8: Normal8Explore,
  knight: KnightExplore,
  queen: QueenSightExplore,
    big25: Big25Explore,
  colorAxis: ColorAxisExplore,
  colorAxisDiagonal: ColorAxisDiagonalExplore ,
  untilMine: UntilMineExplore ,
  expandUntilMine: ExpandUntilMineExplore ,
  clusterDetect: ClusterDetectExplore,
  Cross1: Cross4Explore,
  Cross2:Cross2Explore,
  Ring:RingExplore,
  Diamond:DiamondExplore,
  RippleChain:RippleChainExplore,
  Ripple:RippleExplore,
  ExpandUntil2MinesTriangle:ExpandUntil2MinesTriangleExplore,
   Global: GlobalExplore,
   SquareMineCount:SquareMineCountExplore,
   DiamondMineCount:DiamondMineCountExplore,

};

const numberMap = {
  total: TotalNumberRule,
  qmark: QmarkNumberRule,
  fuzzy: FuzzyNumberRule,
  colorSplit: ColorSplitNumberRule,
  mod3: mod3NumberRule,
  mod10: mod10NumberRule,
  cluster: ClusterNumberRule ,
  clusterMazMin: ClusterMaxMixNumberRule,
  colorDiff: ColorDiffNumberRule,
  ColorWeight:ColorWeightNumberRule ,
  range3: Range3NumberRule,
  decompose: DecomposeNumberRule ,
  distanceSum: DistanceSumRule,
  distanceProduct: DistanceProductInExploreRule,
  TruthLie:TruthLieNumberRule,
  NeighborAverage:NeighborAverageNumberRule,
  NearestTwoProduct: NearestTwoProductNumberRule,
  EvenOdd: EvenOddNumberRule,
  Odd:OddNumberRule,
  prime:PrimeNumberRule,
  PrimeOnly:PrimeOnlyNumberRule
};


// ====== ゲーム開始処理 ======
// 外側：UIから呼ばれる唯一の開始関数
function startGame(seedOverride = null) {
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
  const number    = new numberMap[numberKey](explore);

  if (seedOverride !== null) {
    document.getElementById("seed").value = seedOverride;
  }
  const seed = document.getElementById("seed").value;

  currentGame = new Game(rows, cols, mines, { placement, explore, number });
  currentGame.init(seed);

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
  // 配置ルールをランダム選択
  const placementKeys = Object.keys(placementMap);
  const randomPlacement = placementKeys[Math.floor(Math.random() * placementKeys.length)];
  document.getElementById("placement").value = randomPlacement;

  // 探索ルールをランダム選択
  const exploreKeys = Object.keys(exploreMap).filter(k => k !== "Global");
;
  const randomExplore = exploreKeys[Math.floor(Math.random() * exploreKeys.length)];
  document.getElementById("explore").value = randomExplore;

  // 表示ルールをランダム選択
  const numberKeys = Object.keys(numberMap);
  const randomNumber = numberKeys[Math.floor(Math.random() * numberKeys.length)];
  document.getElementById("number").value = randomNumber;

  // シードもランダムにする
  const newSeed = Math.floor(Math.random() * 1e9).toString();
  document.getElementById("seed").value = newSeed;

  // ゲーム開始
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
console.log(`地雷数ステップを ${step} に設定 (ルール: ${rule})`);
}




