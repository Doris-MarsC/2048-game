(function () {
  "use strict";

  var SIZE = 4;
  var CELL_COUNT = SIZE * SIZE;
  var WIN_VALUE = 2048;

  var boardEl = document.getElementById("board");
  var scoreEl = document.getElementById("score");
  var overlayEl = document.getElementById("overlay");
  var overlayMessageEl = document.getElementById("overlay-message");
  var overlayButtonEl = document.getElementById("overlay-button");
  var restartBtnEl = document.getElementById("restart");

  // 一维数组表示棋盘，索引 = 行 * SIZE + 列，0 表示空格。
  var board = [];

  // 游戏状态
  var score = 0;          // 当前分数
  var hasWon = false;     // 是否已经达成过 2048（只在第一次触发胜利）
  var isGameOver = false; // 是否已经分出胜负、无法继续
  var overlayVisible = false; // 遮罩是否正在显示（显示时暂停操作）

  /**
   * 创建并开始一局新游戏。
   */
  function init() {
    board = new Array(CELL_COUNT).fill(0);
    score = 0;
    hasWon = false;
    isGameOver = false;

    hideOverlay();
    addRandomTile();
    addRandomTile();
    render();
  }

  /**
   * 在随机空格处生成一个新方块（90% 为 2，10% 为 4）。
   */
  function addRandomTile() {
    var emptyIndexes = [];
    for (var i = 0; i < CELL_COUNT; i++) {
      if (board[i] === 0) {
        emptyIndexes.push(i);
      }
    }

    if (emptyIndexes.length === 0) {
      return;
    }

    var index = emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
    board[index] = Math.random() < 0.9 ? 2 : 4;
  }

  /**
   * 对一条长度为 4 的数字线执行“向左滑动并合并”。
   * 每个方块在一次操作中最多参与一次合并。
   * 例如 [2, 2, 2, 2] -> { line: [4, 4, 0, 0], score: 8 }
   * @returns {{line: number[], score: number}} 合并后的线与本次合并得分
   */
  function slideLeft(line) {
    var result = [];
    var i;

    // 去掉空格，得到紧凑排列的非零数字。
    for (i = 0; i < line.length; i++) {
      if (line[i] !== 0) {
        result.push(line[i]);
      }
    }

    // 合并相邻且相等的数字，合并后跳过下一个，避免重复合并。
    var merged = [];
    var gained = 0;
    for (i = 0; i < result.length; i++) {
      if (i + 1 < result.length && result[i] === result[i + 1]) {
        var value = result[i] * 2;
        merged.push(value);
        gained += value; // 合并后的数字即为本次得分
        i++; // 跳过已参与合并的下一个方块
      } else {
        merged.push(result[i]);
      }
    }

    // 末尾补 0 至固定长度。
    while (merged.length < SIZE) {
      merged.push(0);
    }

    return { line: merged, score: gained };
  }

  /**
   * 取出棋盘中的某一行（从左到右）。
   */
  function getRow(row) {
    var line = [];
    for (var col = 0; col < SIZE; col++) {
      line.push(board[row * SIZE + col]);
    }
    return line;
  }

  /**
   * 取出棋盘中的某一列（从上到下）。
   */
  function getColumn(col) {
    var line = [];
    for (var row = 0; row < SIZE; row++) {
      line.push(board[row * SIZE + col]);
    }
    return line;
  }

  /**
   * 将一条线写回某一行。
   */
  function setRow(row, line) {
    for (var col = 0; col < SIZE; col++) {
      board[row * SIZE + col] = line[col];
    }
  }

  /**
   * 将一条线写回某一列。
   */
  function setColumn(col, line) {
    for (var row = 0; row < SIZE; row++) {
      board[row * SIZE + col] = line[row];
    }
  }

  /**
   * 通用的向左移动逻辑：对每一行应用 slideLeft。
   * @returns {{moved: boolean, gained: number}}
   */
  function moveLeft() {
    var moved = false;
    var gained = 0;
    for (var row = 0; row < SIZE; row++) {
      var original = getRow(row);
      var result = slideLeft(original);
      if (!arraysEqual(original, result.line)) {
        moved = true;
        gained += result.score;
        setRow(row, result.line);
      }
    }
    return { moved: moved, gained: gained };
  }

  /**
   * 向右移动 = 每行反转变换后向左移动，再反转回来。
   */
  function moveRight() {
    var moved = false;
    var gained = 0;
    for (var row = 0; row < SIZE; row++) {
      var original = getRow(row);
      var reversed = original.slice().reverse();
      var result = slideLeft(reversed);
      var slid = result.line.slice().reverse();
      if (!arraysEqual(original, slid)) {
        moved = true;
        gained += result.score;
        setRow(row, slid);
      }
    }
    return { moved: moved, gained: gained };
  }

  /**
   * 向上移动 = 每列向左移动。
   */
  function moveUp() {
    var moved = false;
    var gained = 0;
    for (var col = 0; col < SIZE; col++) {
      var original = getColumn(col);
      var result = slideLeft(original);
      if (!arraysEqual(original, result.line)) {
        moved = true;
        gained += result.score;
        setColumn(col, result.line);
      }
    }
    return { moved: moved, gained: gained };
  }

  /**
   * 向下移动 = 每列反转变换后向左移动，再反转回来。
   */
  function moveDown() {
    var moved = false;
    var gained = 0;
    for (var col = 0; col < SIZE; col++) {
      var original = getColumn(col);
      var reversed = original.slice().reverse();
      var result = slideLeft(reversed);
      var slid = result.line.slice().reverse();
      if (!arraysEqual(original, slid)) {
        moved = true;
        gained += result.score;
        setColumn(col, slid);
      }
    }
    return { moved: moved, gained: gained };
  }

  /**
   * 比较两个数组是否完全相等。
   */
  function arraysEqual(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * 判断棋盘上是否还存在可移动的空间。
   * 只要有空格，或存在相邻且相等的方块，就还能继续。
   * @returns {boolean}
   */
  function canMove() {
    for (var row = 0; row < SIZE; row++) {
      for (var col = 0; col < SIZE; col++) {
        var index = row * SIZE + col;
        var value = board[index];

        if (value === 0) {
          return true;
        }
        // 与右侧相邻方块比较
        if (col + 1 < SIZE && value === board[index + 1]) {
          return true;
        }
        // 与下方相邻方块比较
        if (row + 1 < SIZE && value === board[index + SIZE]) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 根据滑动方向执行移动；仅当有效移动时生成新方块、计分并判定胜负。
   * @param {string} direction one of "left" | "right" | "up" | "down"
   */
  function move(direction) {
    if (isGameOver || overlayVisible) {
      return;
    }

    var result;
    if (direction === "left") {
      result = moveLeft();
    } else if (direction === "right") {
      result = moveRight();
    } else if (direction === "up") {
      result = moveUp();
    } else if (direction === "down") {
      result = moveDown();
    } else {
      return;
    }

    if (result.moved) {
      score += result.gained;
      addRandomTile();
      render();

      var justWon = checkWin();
      var over = checkGameOver();

      if (justWon) {
        showWinOverlay();
      } else if (over) {
        showGameOverOverlay();
      }
    }
  }

  /**
   * 检查是否第一次达成 2048。
   * @returns {boolean} 是否刚刚获胜
   */
  function checkWin() {
    if (hasWon) {
      return false;
    }
    if (board.indexOf(WIN_VALUE) !== -1) {
      hasWon = true;
      return true;
    }
    return false;
  }

  /**
   * 检查是否游戏结束（无空格且无可合并的相邻方块）。
   * @returns {boolean} 是否游戏结束
   */
  function checkGameOver() {
    if (!canMove()) {
      isGameOver = true;
      return true;
    }
    return false;
  }

  /**
   * 根据数值返回对应的 CSS 类名。
   */
  function getTileClass(value) {
    if (value === 0) {
      return "tile";
    }
    if (value <= 2048) {
      return "tile tile-" + value;
    }
    return "tile tile-super";
  }

  /**
   * 渲染棋盘与分数到页面。
   */
  function render() {
    // 首次渲染时创建 16 个格子，之后复用。
    if (boardEl.children.length !== CELL_COUNT) {
      boardEl.innerHTML = "";
      for (var i = 0; i < CELL_COUNT; i++) {
        var cell = document.createElement("div");
        cell.className = "tile";
        boardEl.appendChild(cell);
      }
    }

    for (var j = 0; j < CELL_COUNT; j++) {
      var tileEl = boardEl.children[j];
      var value = board[j];
      tileEl.className = getTileClass(value);
      tileEl.textContent = value === 0 ? "" : String(value);
    }

    if (scoreEl) {
      scoreEl.textContent = String(score);
    }
  }

  /**
   * 显示遮罩层。
   * @param {string} message 提示文字
   * @param {string} variant "win" | "lose"
   * @param {string} buttonLabel 按钮文字
   * @param {Function} onClick 点击按钮的回调
   */
  function showOverlay(message, variant, buttonLabel, onClick) {
    overlayMessageEl.textContent = message;
    overlayMessageEl.className = "overlay-message overlay-" + variant;
    overlayButtonEl.textContent = buttonLabel;
    overlayButtonEl.onclick = onClick;
    overlayEl.classList.remove("hidden");
    overlayVisible = true;
  }

  /**
   * 隐藏遮罩层。
   */
  function hideOverlay() {
    overlayEl.classList.add("hidden");
    overlayVisible = false;
  }

  /**
   * 胜利提示：首次达成 2048 时显示，可继续游戏。
   */
  function showWinOverlay() {
    showOverlay("恭喜你，达成 2048！", "win", "继续游戏", function () {
      hideOverlay();
    });
  }

  /**
   * 失败提示：无路可走时显示，可重新开始。
   */
  function showGameOverOverlay() {
    showOverlay("游戏结束！", "lose", "再玩一次", init);
  }

  /**
   * 键盘事件处理：方向键与 WASD。
   */
  function handleKeydown(event) {
    var key = event.key;
    var direction = null;

    if (key === "ArrowLeft" || key === "a" || key === "A") {
      direction = "left";
    } else if (key === "ArrowRight" || key === "d" || key === "D") {
      direction = "right";
    } else if (key === "ArrowUp" || key === "w" || key === "W") {
      direction = "up";
    } else if (key === "ArrowDown" || key === "s" || key === "S") {
      direction = "down";
    }

    if (direction !== null) {
      event.preventDefault();
      move(direction);
    }
  }

  document.addEventListener("keydown", handleKeydown);

  if (restartBtnEl) {
    restartBtnEl.addEventListener("click", init);
  }

  init();
})();
