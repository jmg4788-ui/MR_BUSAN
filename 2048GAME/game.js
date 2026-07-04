/**
 * Premium 2048 Game - Core Physics Engine & Systems (game.js)
 * 동화풍 파스텔 테마 및 자동 저장(Auto-save), 랭킹(Ranking), 모바일 터치 제어 탑재
 */

class Tile {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    
    // 유일한 ID 부여 (애니메이션 추적 및 DOM 관리를 위해 필요)
    this.id = '_' + Math.random().toString(36).substr(2, 9);
    
    // DOM 엘리먼트 생성
    this.element = this.createDOMElement();
    this.updatePosition();
  }

  createDOMElement() {
    const tileDiv = document.createElement('div');
    tileDiv.className = `tile tile-${this.value}`;
    tileDiv.id = this.id;
    
    const innerDiv = document.createElement('div');
    innerDiv.className = 'tile-inner';
    innerDiv.innerText = this.value;
    
    tileDiv.appendChild(innerDiv);
    return tileDiv;
  }

  updatePosition() {
    // CSS 변수를 수정하여 transform translate가 작동하도록 바인딩
    this.element.style.setProperty('--x', this.x);
    this.element.style.setProperty('--y', this.y);
  }

  updateValue(newValue) {
    this.value = newValue;
    // 기존의 값 클래스 삭제 후 새 값 클래스 추가
    this.element.className = `tile tile-${this.value}`;
    const inner = this.element.querySelector('.tile-inner');
    if (inner) {
      inner.innerText = this.value;
    }
  }

  remove() {
    this.element.remove();
  }
}

class GameManager {
  constructor() {
    this.size = 4;
    this.tileContainer = document.querySelector('.tile-container');
    this.currentScoreEl = document.getElementById('current-score');
    this.bestScoreEl = document.getElementById('best-score');
    
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem('best_score')) || 0;
    
    // 편의 기능 변수 초기화
    this.history = null; 
    this.lastTurnScore = 0;
    this.isSwapMode = false;
    this.selectedTiles = [];
    
    this.setupButtons();
    this.setupTouchEvents();
    
    // 로컬스토리지에 저장된 이전 상태가 있다면 복구하고, 없으면 새로 시작합니다.
    if (!this.loadGameState()) {
      this.startNewGame();
    }
  }

  setupButtons() {
    // New Game 버튼 이벤트 연동
    const btnNewGame = document.getElementById('btn-newgame');
    if (btnNewGame) {
      btnNewGame.addEventListener('click', () => {
        this.clearGameState();
        this.startNewGame();
      });
    }

    // 게임오버/승리 오버레이의 액션 버튼 연동
    const btnOverlayAction = document.getElementById('btn-overlay-action');
    if (btnOverlayAction) {
      btnOverlayAction.addEventListener('click', () => {
        const overlay = document.getElementById('game-status-overlay');
        overlay.classList.add('hidden');
        this.clearGameState();
        this.startNewGame();
      });
    }

    // 3대 편의 기능 마우스 클릭 이벤트 연동
    const btnUndo = document.getElementById('btn-undo');
    if (btnUndo) {
      btnUndo.addEventListener('click', () => this.undo());
    }

    const btnShuffle = document.getElementById('btn-shuffle');
    if (btnShuffle) {
      btnShuffle.addEventListener('click', () => this.shuffle());
    }

    const btnSwap = document.getElementById('btn-swap');
    if (btnSwap) {
      btnSwap.addEventListener('click', () => this.toggleSwapMode());
    }

    // 랭킹 버튼 및 모달 닫기 연동
    const btnRanking = document.getElementById('btn-ranking');
    const rankingModal = document.getElementById('ranking-modal');
    const btnCloseRanking = document.getElementById('btn-close-ranking');

    if (btnRanking && rankingModal) {
      btnRanking.addEventListener('click', () => {
        this.renderRankingList();
        rankingModal.classList.remove('hidden');
      });
    }

    if (btnCloseRanking && rankingModal) {
      btnCloseRanking.addEventListener('click', () => {
        rankingModal.classList.add('hidden');
      });
    }

    if (rankingModal) {
      rankingModal.addEventListener('click', (e) => {
        if (e.target === rankingModal) {
          rankingModal.classList.add('hidden');
        }
      });
    }

    // 타일 스왑 모드에서의 타일 클릭 이벤트 (이벤트 위임)
    this.tileContainer.addEventListener('click', (e) => this.handleTileClick(e));

    // 키보드 조작 및 단축키 이벤트 연동
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  // 모바일 터치 스와이프 제스처 이벤트 리스너 연동
  setupTouchEvents() {
    const gameContainer = document.querySelector('.game-container');
    let touchStartX = 0;
    let touchStartY = 0;

    gameContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) return; // 멀티터치 방지
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    gameContainer.addEventListener('touchend', (e) => {
      if (this.isGameOver || (this.hasWon && !this.keepPlaying) || this.isSwapMode) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      // 스와이프 인식 임계치 (40px 이상 이동 시 조작으로 감지)
      const threshold = 40;

      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

      let moved = false;

      // 수평 스와이프가 더 큰 경우
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          moved = this.move(1); // Right
        } else {
          moved = this.move(3); // Left
        }
      } else { // 수직 스와이프가 더 큰 경우
        if (dy > 0) {
          moved = this.move(2); // Down
        } else {
          moved = this.move(0); // Up
        }
      }

      if (moved) {
        setTimeout(() => {
          this.addRandomTile();
          this.checkGameStatus();
        }, 150);
      }
    }, { passive: true });
  }

  startNewGame() {
    // 1. 기존 화면 타일 청소
    this.tileContainer.innerHTML = '';
    
    // 2. 상태 값 초기화
    this.score = 0;
    this.updateScoreUI();
    
    // 3. 4x4 보드판 상태 배열 초기화 (null 또는 Tile 객체 수용)
    this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(null));
    
    // 4. 게임 상태 플래그 초기화
    this.isGameOver = false;
    this.hasWon = false;
    this.keepPlaying = false;
    
    // 5. 편의 기능 상태 초기화
    this.history = null;
    this.lastTurnScore = 0;
    this.exitSwapMode();
    this.updateUndoButtonUI();
    
    // 6. 오버레이 숨기기
    const overlay = document.getElementById('game-status-overlay');
    if (overlay) overlay.classList.add('hidden');
    
    // 7. 최초 시작 무작위 타일 2개 스폰
    this.addRandomTile();
    this.addRandomTile();

    this.saveGameState();
  }

  // 비어있는 셀 좌표들을 가져옵니다.
  getAvailableCells() {
    const cells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.board[r][c]) {
          cells.push({ x: c, y: r });
        }
      }
    }
    return cells;
  }

  // 무작위의 빈 셀에 새로운 타일(2 또는 4)을 스폰합니다.
  addRandomTile() {
    const availableCells = this.getAvailableCells();
    if (availableCells.length > 0) {
      const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
      const value = Math.random() < 0.9 ? 2 : 4;
      const newTile = new Tile(randomCell.x, randomCell.y, value);
      
      this.board[randomCell.y][randomCell.x] = newTile;
      this.tileContainer.appendChild(newTile.element);
      this.saveGameState();
    }
  }

  // 실행 취소(Undo)를 위한 직전 보드 상태 및 스코어 백업
  saveHistory() {
    const boardClone = this.board.map(row => 
      row.map(tile => {
        if (tile) {
          return { x: tile.x, y: tile.y, value: tile.value };
        }
        return null;
      })
    );
    this.history = {
      board: boardClone,
      score: this.score
    };
    this.updateUndoButtonUI();
  }

  // Undo 버튼 UI 활성화/비활성화 제어
  updateUndoButtonUI() {
    const btnUndo = document.getElementById('btn-undo');
    if (!btnUndo) return;

    if (this.history) {
      btnUndo.style.opacity = '1';
      btnUndo.style.cursor = 'pointer';
      btnUndo.removeAttribute('disabled');
    } else {
      btnUndo.style.opacity = '0.5';
      btnUndo.style.cursor = 'not-allowed';
      btnUndo.setAttribute('disabled', 'true');
    }
  }

  // 키보드 입력을 처리합니다.
  handleKeyDown(e) {
    // 단축키 처리 (1: Undo, 2: Shuffle, 3: Swap)
    if (e.key === '1') {
      e.preventDefault();
      this.undo();
      return;
    }
    if (e.key === '2') {
      e.preventDefault();
      this.shuffle();
      return;
    }
    if (e.key === '3') {
      e.preventDefault();
      this.toggleSwapMode();
      return;
    }

    if (this.isGameOver || (this.hasWon && !this.keepPlaying) || this.isSwapMode) return;

    let moved = false;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        moved = this.move(0); // 0: Up
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        moved = this.move(1); // 1: Right
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        moved = this.move(2); // 2: Down
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        moved = this.move(3); // 3: Left
        break;
      default:
        return; // 다른 키 무시
    }

    if (moved) {
      e.preventDefault();
      // 타일 이동이 실제로 일어났다면 새로운 타일 스폰
      setTimeout(() => {
        this.addRandomTile();
        this.checkGameStatus();
      }, 150); // CSS 트랜지션 애니메이션 완료를 기다렸다가 스폰
    }
  }

  /**
   * 타일을 특정 방향으로 밀어냅니다.
   * direction: 0 (Up), 1 (Right), 2 (Down), 3 (Left)
   */
  move(direction) {
    const vector = this.getVector(direction);
    const traversals = this.buildTraversals(vector);
    let moved = false;
    let turnScore = 0; // 이번 턴에 획득한 스코어 집계

    // 이동 가능한 타일이 존재하는지 확인하여 이동이 확정될 때만 히스토리 백업
    if (this.hasAvailableMovesInDirection(direction)) {
      this.saveHistory();
    }

    // 타일별로 1회 이동 주기 동안 단 한 번만 병합되도록 플래그 배열 생성
    const mergedGrid = Array(this.size).fill(null).map(() => Array(this.size).fill(false));

    traversals.y.forEach((y) => {
      traversals.x.forEach((x) => {
        const tile = this.board[y][x];
        if (tile) {
          const positions = this.findFarthestPosition({ x, y }, vector);
          const nextCell = positions.next;
          
          let hasMerged = false;

          // 다음 셀에 타일이 존재하고 병합 조건에 맞는지 확인
          if (this.isValidPosition(nextCell)) {
            const targetTile = this.board[nextCell.y][nextCell.x];
            if (targetTile && targetTile.value === tile.value && !mergedGrid[nextCell.y][nextCell.x]) {
              const newValue = tile.value * 2;
              targetTile.updateValue(newValue);
              mergedGrid[nextCell.y][nextCell.x] = true;
              
              // 병합 애니메이션 트리거 (.tile-merged)
              targetTile.element.classList.add('tile-merged');
              setTimeout(() => {
                targetTile.element.classList.remove('tile-merged');
              }, 300);
              
              // 이번 턴 획득 점수 집계 및 누적
              turnScore += newValue;
              this.score += newValue;
              this.updateScoreUI();
              this.showScoreAddition(newValue);
              
              if (newValue === 2048 && !this.hasWon) {
                this.hasWon = true;
              }

              tile.x = nextCell.x;
              tile.y = nextCell.y;
              tile.updatePosition();
              
              const oldTile = tile;
              setTimeout(() => oldTile.remove(), 150);
              
              this.board[y][x] = null;
              hasMerged = true;
              moved = true;
            }
          }

          // 병합되지 않고 단순 빈 공간으로 이동하는 경우
          if (!hasMerged) {
            const farthestCell = positions.farthest;
            if (farthestCell.x !== x || farthestCell.y !== y) {
              this.board[y][x] = null;
              this.board[farthestCell.y][farthestCell.x] = tile;
              tile.x = farthestCell.x;
              tile.y = farthestCell.y;
              tile.updatePosition();
              moved = true;
            }
          }
        }
      });
    });

    if (moved) {
      this.lastTurnScore = turnScore; // 턴 획득 스코어 업데이트
      this.saveGameState();
    }

    return moved;
  }

  // 특정 방향으로 움직일 타일이나 병합될 타일이 존재하는지 사전에 판단
  hasAvailableMovesInDirection(direction) {
    const vector = this.getVector(direction);
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const tile = this.board[y][x];
        if (tile) {
          const next = { x: x + vector.x, y: y + vector.y };
          if (this.isValidPosition(next)) {
            const target = this.board[next.y][next.x];
            if (!target || target.value === tile.value) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  // 방향에 따른 좌표 이동 벡터를 설정합니다.
  getVector(direction) {
    const vectors = {
      0: { x: 0, y: -1 }, // Up
      1: { x: 1, y: 0 },  // Right
      2: { x: 0, y: 1 },  // Down
      3: { x: -1, y: 0 }  // Left
    };
    return vectors[direction];
  }

  // 방향에 맞춰 보드판의 어느 칸부터 먼저 탐색할지 우선순위 스캔 순서 배열을 빌드합니다.
  buildTraversals(vector) {
    const traversals = { x: [], y: [] };

    for (let pos = 0; pos < this.size; pos++) {
      traversals.x.push(pos);
      traversals.y.push(pos);
    }

    if (vector.x === 1) traversals.x.reverse();
    if (vector.y === 1) traversals.y.reverse();

    return traversals;
  }

  // 이동 벡터를 따라가며 도달 가능한 가장 먼 빈 칸과 그 바로 다음 칸을 반환합니다.
  findFarthestPosition(cell, vector) {
    let previous;

    do {
      previous = cell;
      cell = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.isValidPosition(cell) && !this.board[cell.y][cell.x]);

    return {
      farthest: previous,
      next: cell
    };
  }

  // 4x4 그리드 범위 내 유효한 인덱스인지 점검
  isValidPosition(cell) {
    return cell.x >= 0 && cell.x < this.size && cell.y >= 0 && cell.y < this.size;
  }

  // 점수 UI를 실시간 업데이트하고 베스트 점수를 로컬 스토리지에 유지
  updateScoreUI() {
    this.currentScoreEl.innerText = this.score;
    
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.bestScoreEl.innerText = this.bestScore;
      localStorage.setItem('best_score', this.bestScore);
    } else {
      this.bestScoreEl.innerText = this.bestScore;
    }
  }

  // 동적 점수 획득 플로팅 이펙트를 화면에 렌더링 후 소멸시킵니다.
  showScoreAddition(value) {
    const scoreBox = document.getElementById('score-box-current');
    if (!scoreBox) return;

    const additionDiv = document.createElement('div');
    additionDiv.className = 'score-addition';
    additionDiv.innerText = `+${value}`;

    scoreBox.appendChild(additionDiv);

    // float-up-fade 애니메이션 완료(850ms) 후 안전하게 DOM 제거
    setTimeout(() => {
      additionDiv.remove();
    }, 850);
  }

  // 게임오버 또는 승리 조건을 판정합니다.
  checkGameStatus() {
    if (this.hasWon && !this.keepPlaying) {
      this.showStatusOverlay(true);
      return;
    }

    if (this.getAvailableCells().length === 0 && !this.hasTileMatches()) {
      this.isGameOver = true;
      this.showStatusOverlay(false);
      this.checkAndRegisterRanking(); // 랭킹 자격 검토
    }
  }

  // 인접 타일 중 병합 가능한 조건(동일 값)이 있는 확인합니다.
  hasTileMatches() {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const tile = this.board[y][x];
        if (tile) {
          const rightCell = { x: x + 1, y: y };
          const downCell = { x: x, y: y + 1 };
          
          if (this.isValidPosition(rightCell)) {
            const other = this.board[rightCell.y][rightCell.x];
            if (other && other.value === tile.value) return true;
          }
          if (this.isValidPosition(downCell)) {
            const other = this.board[downCell.y][downCell.x];
            if (other && other.value === tile.value) return true;
          }
        }
      }
    }
    return false;
  }

  // 게임오버 / 승리 화면 오버레이를 표시합니다.
  showStatusOverlay(won) {
    const overlay = document.getElementById('game-status-overlay');
    const title = document.getElementById('message-title');
    const desc = document.getElementById('message-desc');
    const actionBtn = document.getElementById('btn-overlay-action');

    if (won) {
      title.innerText = "VICTORY!";
      title.style.color = "#b45309"; 
      desc.innerText = "You reached the 2048 neon core! You can keep playing.";
      actionBtn.innerText = "Keep Playing";
      
      actionBtn.onclick = () => {
        this.keepPlaying = true;
        overlay.classList.add('hidden');
        this.saveGameState();
      };
    } else {
      title.innerText = "GAME OVER";
      title.style.color = "#ca653b"; 
      desc.innerText = "No moves left. Keep pushing your boundaries!";
      actionBtn.innerText = "Try Again";
      
      actionBtn.onclick = () => {
        overlay.classList.add('hidden');
        this.clearGameState();
        this.startNewGame();
      };
    }

    overlay.classList.remove('hidden');
  }

  /* ==========================================================================
     로컬스토리지 상태 자동 저장 및 복원(Auto-save & Resume)
     ========================================================================== */

  // 게임 상태 직렬화 저장
  saveGameState() {
    const boardState = this.board.map(row => 
      row.map(tile => {
        if (tile) return { x: tile.x, y: tile.y, value: tile.value };
        return null;
      })
    );
    const state = {
      board: boardState,
      score: this.score,
      lastTurnScore: this.lastTurnScore,
      hasWon: this.hasWon,
      keepPlaying: this.keepPlaying,
      isGameOver: this.isGameOver,
      history: this.history ? {
        board: this.history.board,
        score: this.history.score
      } : null
    };
    localStorage.setItem('2048_game_state', JSON.stringify(state));
  }

  // 저장된 이전 세션 게임 상태 로드
  loadGameState() {
    const saved = localStorage.getItem('2048_game_state');
    if (!saved) return false;

    try {
      const state = JSON.parse(saved);
      this.score = state.score;
      this.lastTurnScore = state.lastTurnScore || 0;
      this.hasWon = state.hasWon || false;
      this.keepPlaying = state.keepPlaying || false;
      this.isGameOver = state.isGameOver || false;
      this.history = state.history || null;

      this.tileContainer.innerHTML = '';
      this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(null));

      state.board.forEach((row, r) => {
        row.forEach((backup, c) => {
          if (backup) {
            const tile = new Tile(backup.x, backup.y, backup.value);
            this.board[r][c] = tile;
            this.tileContainer.appendChild(tile.element);
          }
        });
      });

      this.updateScoreUI();
      this.updateUndoButtonUI();

      // 만약 게임오버 상태로 저장되어 있었다면 오버레이 노출
      if (this.isGameOver) {
        this.showStatusOverlay(false);
      } else if (this.hasWon && !this.keepPlaying) {
        this.showStatusOverlay(true);
      }

      return true;
    } catch (e) {
      console.error("2048_game_state 복원 오류", e);
      return false;
    }
  }

  // 상태 데이터 청소 (New game 시 호출)
  clearGameState() {
    localStorage.removeItem('2048_game_state');
  }

  /* ==========================================================================
     오늘의 랭킹 시스템 (Ranking)
     ========================================================================== */

  // 랭킹 리스트 불러오기 (데이터가 없을 시 임시 더미 랭크 제공)
  loadRankings() {
    const saved = localStorage.getItem('2048_rankings');
    return saved ? JSON.parse(saved) : [
      { name: "PASTEL_CORE", score: 32768 },
      { name: "COTTON_SKY", score: 16384 },
      { name: "JELLY_BEAR", score: 8192 },
      { name: "CLOUDY_DAY", score: 4096 },
      { name: "FAIRY_TALE", score: 2048 }
    ];
  }

  saveRankings(list) {
    localStorage.setItem('2048_rankings', JSON.stringify(list));
  }

  // 랭커 진입 자격 검증 및 등록 프롬프트 실행
  checkAndRegisterRanking() {
    const rankings = this.loadRankings();
    const lowestScore = rankings.length >= 5 ? rankings[rankings.length - 1].score : 0;

    if (this.score > lowestScore || rankings.length < 5) {
      setTimeout(() => {
        const nickname = prompt("축하합니다! 랭킹 등록이 가능합니다.\n플레이어명을 입력해 주세요 (최대 10자):", "GUEST") || "GUEST";
        const cleanedName = nickname.substring(0, 10).trim().toUpperCase();
        
        rankings.push({ name: cleanedName || "GUEST", score: this.score });
        rankings.sort((a, b) => b.score - a.score);
        
        // 상위 5명 커트
        const top5 = rankings.slice(0, 5);
        this.saveRankings(top5);
        this.renderRankingList();

        // 랭킹 모달 열기
        const rankingModal = document.getElementById('ranking-modal');
        if (rankingModal) rankingModal.classList.remove('hidden');
      }, 700);
    }
  }

  // 랭킹 데이터를 읽어와 모달에 동적으로 동화풍 메달 HTML 렌더링
  renderRankingList() {
    const listContainer = document.getElementById('ranking-list-container');
    if (!listContainer) return;

    const rankings = this.loadRankings();
    listContainer.innerHTML = '';

    rankings.forEach((item, idx) => {
      const rankNum = idx + 1;
      const rankClass = rankNum <= 3 ? `rank-${rankNum}` : '';

      const li = document.createElement('li');
      li.className = `ranking-item ${rankClass}`;
      li.innerHTML = `
        <span class="rank-num">${rankNum}</span>
        <span class="rank-name">${item.name}</span>
        <span class="rank-score">${item.score.toLocaleString()}</span>
      `;
      listContainer.appendChild(li);
    });
  }

  /* ==========================================================================
     편의 기능 비즈니스 로직 (Undo, Shuffle, Swap)
     ========================================================================== */

  // 1. 실행 취소 (Undo) - 페널티 50% 차감
  undo() {
    if (!this.history) return;

    const penalty = Math.round(this.lastTurnScore * 0.5);
    this.score = this.history.score + (this.lastTurnScore - penalty);

    this.tileContainer.innerHTML = '';
    this.board = this.board.map((row, r) => 
      row.map((_, c) => {
        const backup = this.history.board[r][c];
        if (backup) {
          const newTile = new Tile(backup.x, backup.y, backup.value);
          this.tileContainer.appendChild(newTile.element);
          return newTile;
        }
        return null;
      })
    );

    this.updateScoreUI();

    this.history = null;
    this.lastTurnScore = 0;
    this.updateUndoButtonUI();
    this.exitSwapMode();
    this.saveGameState();
  }

  // 2. 랜덤 셔플 (Shuffle) - 페널티 30% 차감
  shuffle() {
    const tiles = [];
    const coordinates = [];

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const tile = this.board[r][c];
        if (tile) {
          tiles.push(tile);
          coordinates.push({ x: c, y: r });
        }
      }
    }

    if (tiles.length < 2) return;

    this.saveHistory();

    const values = tiles.map(t => t.value);
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }

    this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(null));
    tiles.forEach((tile, idx) => {
      const targetCoord = coordinates[idx];
      tile.x = targetCoord.x;
      tile.y = targetCoord.y;
      tile.updateValue(values[idx]);
      tile.updatePosition();
      this.board[targetCoord.y][targetCoord.x] = tile;
    });

    const penalty = Math.round(this.lastTurnScore * 0.3);
    this.score = Math.max(0, this.score - penalty);
    this.lastTurnScore = 0; 
    this.updateScoreUI();

    const container = document.querySelector('.game-container');
    if (container) {
      container.style.animation = 'none';
      container.offsetHeight; 
      container.style.animation = 'shuffle-shake 250ms ease';
      setTimeout(() => { container.style.animation = ''; }, 250);
    }

    this.exitSwapMode();
    this.saveGameState();
  }

  // 3. 타일 스왑 (Tile Swap) - 페널티 70% 차감
  toggleSwapMode() {
    if (this.isSwapMode) {
      this.exitSwapMode();
    } else {
      this.enterSwapMode();
    }
  }

  enterSwapMode() {
    this.isSwapMode = true;
    this.selectedTiles = [];
    
    const container = document.querySelector('.game-container');
    if (container) container.classList.add('swap-mode');

    const btnSwap = document.getElementById('btn-swap');
    if (btnSwap) btnSwap.classList.add('active');
  }

  exitSwapMode() {
    this.isSwapMode = false;
    this.selectedTiles.forEach(tile => {
      if (tile && tile.element) {
        tile.element.classList.remove('tile-selected');
      }
    });
    this.selectedTiles = [];

    const container = document.querySelector('.game-container');
    if (container) container.classList.remove('swap-mode');

    const btnSwap = document.getElementById('btn-swap');
    if (btnSwap) btnSwap.classList.remove('active');
  }

  handleTileClick(e) {
    if (!this.isSwapMode) return;

    const tileElement = e.target.closest('.tile');
    if (!tileElement) return;

    const tileId = tileElement.id;
    let clickedTile = null;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const tile = this.board[r][c];
        if (tile && tile.id === tileId) {
          clickedTile = tile;
          break;
        }
      }
    }

    if (!clickedTile) return;

    if (this.selectedTiles.includes(clickedTile)) {
      clickedTile.element.classList.remove('tile-selected');
      this.selectedTiles = this.selectedTiles.filter(t => t !== clickedTile);
      return;
    }

    this.selectedTiles.push(clickedTile);
    clickedTile.element.classList.add('tile-selected');

    if (this.selectedTiles.length === 2) {
      this.performSwap();
    }
  }

  performSwap() {
    const [t1, t2] = this.selectedTiles;

    this.saveHistory();

    const t1Coord = { x: t1.x, y: t1.y };
    const t2Coord = { x: t2.x, y: t2.y };

    this.board[t1Coord.y][t1Coord.x] = t2;
    this.board[t2Coord.y][t2Coord.x] = t1;

    t1.x = t2Coord.x;
    t1.y = t2Coord.y;
    t2.x = t1Coord.x;
    t2.y = t1Coord.y;

    t1.updatePosition();
    t2.updatePosition();

    const penalty = Math.round(this.lastTurnScore * 0.7);
    this.score = Math.max(0, this.score - penalty);
    this.lastTurnScore = 0; 
    this.updateScoreUI();

    setTimeout(() => {
      this.exitSwapMode();
      this.saveGameState();
    }, 200);
  }
}

// 브라우저 DOM이 완전히 준비되면 게임 매니저를 기동합니다.
document.addEventListener('DOMContentLoaded', () => {
  new GameManager();
});
