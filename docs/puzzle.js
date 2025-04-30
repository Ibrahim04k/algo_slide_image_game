// الإعدادات
const ROWS = 3;
const COLUMNS = 3;
const EMPTY_TILE_VALUE = "3";
const GOAL_ORDER = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

// حالة اللعبة
let currTile;
let otherTile;
let turns = 0;
let imgOrder = [];
let initialImgOrder = [];
let isProcessing = false;

// -------------------- دوال مساعدة --------------------

// تشغيل أو إيقاف التفاعل مع كل الأزرار والبلاطات
function toggleInteraction(enable) {
  isProcessing = !enable;
  
  // تشغيل/إيقاف الأزرار
  ["shuffle", "solve", "solveBFS", "solveUCS", "initState"].forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) btn.disabled = !enable;
  });
  
  // تشغيل/إيقاف إمكانية سحب البلاطات
  const tiles = document.getElementById("board").getElementsByTagName("img");
  for (let tile of tiles) {
    tile.setAttribute("draggable", enable.toString());
  }
}

// دالة مساعدة عشان نشوف إذا كان فيه مصفوفتين زي بعض
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// نعد الانعكاسات في حالة اللغز
function countInversions(puzzle) {
  let inversions = 0;
  
  for (let i = 0; i < puzzle.length; i++) {
    if (puzzle[i] === EMPTY_TILE_VALUE) continue;
    
    for (let j = i + 1; j < puzzle.length; j++) {
      if (puzzle[j] === EMPTY_TILE_VALUE) continue;
      
      if (parseInt(puzzle[i]) > parseInt(puzzle[j])) {
        inversions++;
      }
    }
  }
  return inversions;
}

// نشوف إذا كان ترتيب اللغز ممكن يتحل ولا لأ
function isSolvable(puzzle) {
  // في اللغز 3×3، التكوين ممكن يتحل لو عدد الانعكاسات زوجي
  return countInversions(puzzle) % 2 === 0;
}

// عمل ترتيب عشوائي قابل للحل
function generateSolvableOrder(goal) {
  let order;
  do {
    order = [...goal].sort(() => Math.random() - 0.5);
  } while (!isSolvable(order));
  
  return order;
}

// نجيب حالة اللوحة الحالية
function getCurrentBoardState() {
  const board = document.getElementById("board");
  const tiles = Array.from(board.getElementsByTagName("img"));
  
  return tiles.map(tile => {
    let fileName = tile.src.split("/").pop();
    return fileName.replace(".jpg", "");
  });
}

// نلاقي مكان البلاطة الفاضية
function findEmptyTilePosition(boardState) {
  const emptyTilePos = boardState.indexOf(EMPTY_TILE_VALUE);
  return {
    row: Math.floor(emptyTilePos / COLUMNS),
    col: emptyTilePos % COLUMNS
  };
}

// ننفذ خطوات الحل مع الحركة
function applySolutionMoves(moves) {
  if (moves.length === 0) {
    alert("اللغز محلول بالفعل!");
    toggleInteraction(true);
    return;
  }
  
  let moveIndex = 0;
  let moveInterval = setInterval(() => {
    if (moveIndex >= moves.length) {
      clearInterval(moveInterval);
      alert("تم حل اللغز في " + moves.length + " خطوة!");
      toggleInteraction(true);
      return;
    }
    
    let move = moves[moveIndex];
    let fromTile = document.getElementById(move.from.row + "-" + move.from.col);
    let toTile = document.getElementById(move.to.row + "-" + move.to.col);
    
    // نبدل الصور
    let tempSrc = fromTile.src;
    fromTile.src = toTile.src;
    toTile.src = tempSrc;
    
    // نحدث عداد الحركات
    turns++;
    document.getElementById("turns").innerText = turns;
    
    moveIndex++;
  }, 300); // 300 مللي ثانية بين كل حركة عشان شكل الحركة
}

// -------------------- دوال منطق اللعبة --------------------

// ننشئ لوحة اللعبة
function createBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  
  // نعمل نسخة من ترتيب الصور الحالي
  let currentImgOrder = [...imgOrder];
  
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLUMNS; c++) {
      let tile = document.createElement("img");
      tile.id = r + "-" + c;
      tile.src = currentImgOrder.shift() + ".jpg";
      tile.setAttribute("draggable", "true");

      // نضيف أحداث السحب والإفلات
      tile.addEventListener("dragstart", dragStart);
      tile.addEventListener("dragover", dragOver);
      tile.addEventListener("dragenter", dragEnter);
      tile.addEventListener("dragleave", dragLeave);
      tile.addEventListener("drop", dragDrop);
      tile.addEventListener("dragend", dragEnd);

      board.append(tile);
    }
  }
}

// نخلط اللغز
function shufflePuzzle() {
  if (isProcessing) return;
  toggleInteraction(false);
  
  // نعمل ترتيب جديد قابل للحل
  imgOrder = generateSolvableOrder(GOAL_ORDER);
  
  // نحدث اللوحة بالترتيب الجديد
  const tiles = document.getElementById("board").getElementsByTagName("img");
  let currentImgOrder = [...imgOrder];
  
  for (let i = 0; i < tiles.length; i++) {
    tiles[i].src = currentImgOrder[i] + ".jpg";
  }
  
  // نحفظ الحالة الأولية بعد الخلط
  initialImgOrder = [...imgOrder];
  
  // نعيد ضبط عداد الحركات
  turns = 0;
  document.getElementById("turns").innerText = turns;
  
  toggleInteraction(true);
}

// نرجع للحالة الأولية
function returnToInitialState() {
  if (isProcessing) return;
  toggleInteraction(false);
  
  if (initialImgOrder.length === 0) {
    alert("قم بخلط اللغز أولاً!");
    toggleInteraction(true);
    return;
  }
  
  // نحدث اللوحة بالترتيب الأولي
  const tiles = document.getElementById("board").getElementsByTagName("img");
  
  for (let i = 0; i < tiles.length; i++) {
    tiles[i].src = initialImgOrder[i] + ".jpg";
  }
  
  // نعيد ضبط عداد الحركات
  turns = 0;
  document.getElementById("turns").innerText = turns;
  
  toggleInteraction(true);
}

// نتأكد من انتهاء اللعبة
function checkWin() {
  const currentOrder = getCurrentBoardState();

  // نشوف لو الترتيب الحالي زي الترتيب المطلوب
  if (arraysEqual(currentOrder, GOAL_ORDER)) {
    setTimeout(() => {
      alert("مبروك! لقد حللت اللغز في " + turns + " حركة!");
    }, 300);
  }
}

// -------------------- دوال السحب والإفلات --------------------

function dragStart() {
  currTile = this;
}

function dragOver(e) {
  e.preventDefault();
}

function dragEnter(e) {
  e.preventDefault();
}

function dragLeave() {
  // مش محتاجين حاجة هنا، بس الدالة لازم تكون موجودة
}

function dragDrop() {
  otherTile = this;
}

function dragEnd() {
  // لو الخوارزمية شغالة، ما نسمحش بالحركة
  if (isProcessing) return;
  
  // نشوف لو البلاطة المستهدفة هي البلاطة الفاضية
  if (!otherTile.src.includes(EMPTY_TILE_VALUE + ".jpg")) {
    return;
  }

  let [r, c] = currTile.id.split("-").map(Number);
  let [r2, c2] = otherTile.id.split("-").map(Number);

  // نتأكد لو البلاطات متجاورة
  let isAdjacent = (
    (r === r2 && Math.abs(c - c2) === 1) ||
    (c === c2 && Math.abs(r - r2) === 1)
  );

  if (isAdjacent) {
    // نبدل البلاطات
    let currImg = currTile.src;
    currTile.src = otherTile.src;
    otherTile.src = currImg;

    // نحدث عداد الحركات
    turns++;
    document.getElementById("turns").innerText = turns;
    
    // نشوف لو خلصت اللعبة
    checkWin();
  }
}

// -------------------- دوال الحل بالذكاء الاصطناعي --------------------

// نحسب مسافة مانهاتن كمقياس استدلالي
function calculateHeuristic(state, goal) {
  let totalDistance = 0;
  
  for (let i = 0; i < state.length; i++) {
    if (state[i] !== EMPTY_TILE_VALUE) {
      // نلاقي فين المفروض تكون البلاطة دي في الحالة النهائية
      let goalIndex = goal.indexOf(state[i]);
      let goalRow = Math.floor(goalIndex / COLUMNS);
      let goalCol = goalIndex % COLUMNS;
      
      // نلاقي هي فين حالياً
      let currentRow = Math.floor(i / COLUMNS);
      let currentCol = i % COLUMNS;
      
      // نضيف مسافة مانهاتن
      totalDistance += Math.abs(goalRow - currentRow) + Math.abs(goalCol - currentCol);
    }
  }
  
  return totalDistance;
}

// نجيب الحركات الممكنة من حالة معينة
function getPossibleMoves(state, isForAStar = true) {
  let moves = [];
  let directions = [
    { dr: -1, dc: 0, name: 'فوق' },
    { dr: 1, dc: 0, name: 'تحت' },
    { dr: 0, dc: -1, name: 'شمال' },
    { dr: 0, dc: 1, name: 'يمين' }
  ];
  
  for (let dir of directions) {
    let newRow = state.emptyPos.row + dir.dr;
    let newCol = state.emptyPos.col + dir.dc;
    
    // نشوف لو المكان الجديد صح
    if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLUMNS) {
      // نعمل حالة لوحة جديدة بعد تطبيق الحركة
      let newBoard = [...state.board];
      let oldPos = state.emptyPos.row * COLUMNS + state.emptyPos.col;
      let newPos = newRow * COLUMNS + newCol;
      
      // نبدل البلاطة الفاضية مع البلاطة في المكان الجديد
      [newBoard[oldPos], newBoard[newPos]] = [newBoard[newPos], newBoard[oldPos]];
      
      // نعمل معلومات الحركة
      let newMove = { 
        from: { row: newRow, col: newCol }, 
        to: { row: state.emptyPos.row, col: state.emptyPos.col } 
      };
      
      // نعمل حالة جديدة
      let newState = {
        board: newBoard,
        emptyPos: { row: newRow, col: newCol },
        moves: [...state.moves, newMove]
      };
      
      // نضيف خصائص خوارزمية A* لو محتاجينها
      if (isForAStar) {
        newState.cost = state.cost + 1;
        newState.heuristic = calculateHeuristic(newBoard, GOAL_ORDER);
      }
      
      moves.push(newState);
    }
  }
  
  return moves;
}

// خوارزمية البحث A*
function solvePuzzle() {
  if (isProcessing) return;
  toggleInteraction(false);
  
  // نجيب الحالة الحالية
  const currentState = getCurrentBoardState();
  const emptyPos = findEmptyTilePosition(currentState);
  
  // نعمل كائن الحالة الأولية
  let initialState = {
    board: currentState,
    emptyPos: emptyPos,
    moves: [],
    cost: 0,
    heuristic: calculateHeuristic(currentState, GOAL_ORDER)
  };
  
  // البحث بخوارزمية A*
  let solution = aStarSearch(initialState);
  
  if (solution) {
    applySolutionMoves(solution.moves);
  } else {
    alert("لا يمكن إيجاد حل للغز!");
    toggleInteraction(true);
  }
}

function aStarSearch(initialState) {
  let openSet = [initialState];
  let closedSet = new Set();
  let maxIterations = 10000;
  let iterations = 0;
  
  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // نرتب حسب f(n) = g(n) + h(n) - التكلفة زائد المقياس الاستدلالي
    openSet.sort((a, b) => (a.cost + a.heuristic) - (b.cost + b.heuristic));
    
    // ناخد الحالة الأكثر وعداً
    let current = openSet.shift();
    
    // نشوف لو وصلنا للهدف
    if (current.heuristic === 0) {
      return current; // لقينا الحل
    }
    
    // نعمل مفتاح للحالة دي عشان نتتبع الحالات اللي زرناها
    let stateKey = current.board.join(',');
    
    // نتخطى لو شفنا الحالة دي قبل كده
    if (closedSet.has(stateKey)) {
      continue;
    }
    
    // نعلم عليها كحالة زرناها
    closedSet.add(stateKey);
    
    // نولد الحركات الممكنة
    let possibleMoves = getPossibleMoves(current, true);
    
    // نضيف الحالات الجديدة للمجموعة المفتوحة
    for (let move of possibleMoves) {
      openSet.push(move);
    }
  }
  
  return null; // مفيش حل
}

// خوارزمية البحث BFS
function solvePuzzleBFS() {
  if (isProcessing) return;
  toggleInteraction(false);
  
  // نجيب الحالة الحالية
  const currentState = getCurrentBoardState();
  const emptyPos = findEmptyTilePosition(currentState);
  
  // نعمل كائن الحالة الأولية
  let initialState = {
    board: currentState,
    emptyPos: emptyPos,
    moves: []
  };
  
  // البحث بخوارزمية BFS
  let solution = bfsSearch(initialState);
  
  if (solution) {
    applySolutionMoves(solution.moves);
  } else {
    alert("لا يمكن إيجاد حل للغز!");
    toggleInteraction(true);
  }
}

function bfsSearch(initialState) {
  // قائمة انتظار للحالات اللي هنستكشفها
  let queue = [initialState];
  
  // مجموعة عشان نتتبع الحالات اللي زرناها
  let visited = new Set();
  visited.add(initialState.board.join(','));
  
  // أقصى عدد من التكرارات عشان منقعش في حلقة لانهائية
  let maxIterations = 100000;
  let iterations = 0;
  
  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // ناخد الحالة التالية من قائمة الانتظار
    let current = queue.shift();
    
    // نشوف لو وصلنا للهدف
    if (arraysEqual(current.board, GOAL_ORDER)) {
      return current; // لقينا الحل
    }
    
    // نولد الحركات الممكنة
    let possibleMoves = getPossibleMoves(current, false);
    
    // نضيف الحالات الجديدة لقائمة الانتظار
    for (let move of possibleMoves) {
      let stateKey = move.board.join(',');
      if (!visited.has(stateKey)) {
        visited.add(stateKey);
        queue.push(move);
      }
    }
  }
  
  return null; // مفيش حل
}

// خوارزمية البحث UCS
function solvePuzzleUCS() {
  if (isProcessing) return;
  toggleInteraction(false);
  
  // نجيب الحالة الحالية
  const currentState = getCurrentBoardState();
  const emptyPos = findEmptyTilePosition(currentState);
  
  // نعمل كائن الحالة الأولية
  let initialState = {
    board: currentState,
    emptyPos: emptyPos,
    moves: [],
    cost: 0
  };
  
  // البحث بخوارزمية UCS
  let solution = ucsSearch(initialState);
  
  if (solution) {
    applySolutionMoves(solution.moves);
  } else {
    alert("لا يمكن إيجاد حل للغز باستخدام UCS!");
    toggleInteraction(true);
  }
}

function ucsSearch(initialState) {
  // قائمة الأولويات للحالات اللي هنستكشفها، مرتبة حسب التكلفة
  let priorityQueue = [initialState];
  
  // مجموعة عشان نتتبع الحالات اللي زرناها
  let visited = new Set();
  visited.add(initialState.board.join(','));
  
  // أقصى عدد من التكرارات عشان منقعش في حلقة لانهائية
  let maxIterations = 100000;
  let iterations = 0;
  
  while (priorityQueue.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // نرتب حسب التكلفة (البحث بالتكلفة الموحدة بيعطي أولوية للتكلفة الأقل)
    priorityQueue.sort((a, b) => a.cost - b.cost);
    
    // ناخد الحالة ذات التكلفة الأقل
    let current = priorityQueue.shift();
    
    // نشوف لو وصلنا للهدف
    if (arraysEqual(current.board, GOAL_ORDER)) {
      return current; // لقينا الحل
    }
    
    // نولد الحركات الممكنة
    let possibleMoves = getPossibleMoves(current, false);
    
    // نضيف الحالات الجديدة لقائمة الأولويات
    for (let move of possibleMoves) {
      let stateKey = move.board.join(',');
      
      // نضيف التكلفة للحالة الجديدة
      move.cost = current.cost + 1;
      
      if (!visited.has(stateKey)) {
        visited.add(stateKey);
        priorityQueue.push(move);
      }
    }
  }
  
  return null; // مفيش حل
}

// -------------------- التهيئة الأولية --------------------
window.onload = function() {
  // نتأكد إن الترتيب الأولي قابل للحل
  imgOrder = generateSolvableOrder(GOAL_ORDER);
  
  // نعمل اللوحة
  createBoard();
  
  // نحفظ الحالة الأولية
  initialImgOrder = [...imgOrder];
  
  // نمكن التفاعل
  toggleInteraction(true);
  
  // نعد مستمعي الأحداث للأزرار
  document.getElementById("shuffle")?.addEventListener("click", shufflePuzzle);
  document.getElementById("solve")?.addEventListener("click", solvePuzzle);
  document.getElementById("solveBFS")?.addEventListener("click", solvePuzzleBFS);
  document.getElementById("initState")?.addEventListener("click", returnToInitialState);
  document.getElementById("solveUCS")?.addEventListener("click", solvePuzzleUCS);
}
