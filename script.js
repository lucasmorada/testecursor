const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const hud = document.getElementById("hud");
const hudLevel = document.getElementById("hud-level");
const hudAttempts = document.getElementById("hud-attempts");
const hudTime = document.getElementById("hud-time");

const mainMenu = document.getElementById("main-menu");
const howtoMenu = document.getElementById("howto-menu");
const pauseMenu = document.getElementById("pause-menu");
const levelCompleteMenu = document.getElementById("level-complete");
const gameOverMenu = document.getElementById("game-over");

const btnPlay = document.getElementById("btn-play");
const btnHowto = document.getElementById("btn-howto");
const btnBackMain = document.getElementById("btn-back-main");
const btnPause = document.getElementById("btn-pause");
const btnResume = document.getElementById("btn-resume");
const btnExit = document.getElementById("btn-exit");
const btnNext = document.getElementById("btn-next");
const btnRetry = document.getElementById("btn-retry");
const btnRetryGame = document.getElementById("btn-retry-game");
const btnExitGameOver = document.getElementById("btn-exit-gameover");

const statsText = document.getElementById("stats-text");
const gameOverText = document.getElementById("game-over-text");

const controls = {
  up: false,
  down: false,
  left: false,
  right: false,
};

const state = {
  screen: "menu",
  levelIndex: 0,
  attempts: 0,
  levelTime: 0,
  levelTimer: 60,
  lastTime: performance.now(),
  parkedFor: 0,
};

const levels = [
  {
    name: "Nível 1",
    carStart: { x: 120, y: 440, angle: -Math.PI / 2 },
    timeLimit: 50,
    slot: { x: 750, y: 100, w: 130, h: 60, angle: 0 },
    obstacles: [
      { x: 180, y: 250, w: 200, h: 24 },
      { x: 380, y: 120, w: 24, h: 200 },
      { x: 520, y: 280, w: 180, h: 24 },
      { x: 680, y: 190, w: 24, h: 180 },
    ],
    cones: [
      { x: 320, y: 380, r: 13 },
      { x: 500, y: 430, r: 13 },
      { x: 590, y: 145, r: 13 },
    ],
  },
  {
    name: "Nível 2",
    carStart: { x: 860, y: 460, angle: Math.PI },
    timeLimit: 58,
    slot: { x: 86, y: 72, w: 140, h: 62, angle: 0 },
    obstacles: [
      { x: 150, y: 180, w: 24, h: 240 },
      { x: 300, y: 120, w: 250, h: 24 },
      { x: 430, y: 250, w: 24, h: 220 },
      { x: 600, y: 200, w: 240, h: 24 },
      { x: 760, y: 300, w: 24, h: 190 },
    ],
    cones: [
      { x: 260, y: 320, r: 13 },
      { x: 640, y: 420, r: 13 },
      { x: 700, y: 150, r: 13 },
      { x: 530, y: 320, r: 13 },
    ],
  },
  {
    name: "Nível 3",
    carStart: { x: 96, y: 80, angle: 0 },
    timeLimit: 66,
    slot: { x: 760, y: 400, w: 140, h: 62, angle: 0 },
    obstacles: [
      { x: 140, y: 160, w: 260, h: 24 },
      { x: 280, y: 280, w: 24, h: 220 },
      { x: 420, y: 220, w: 250, h: 24 },
      { x: 560, y: 320, w: 24, h: 180 },
      { x: 660, y: 140, w: 200, h: 24 },
      { x: 800, y: 220, w: 24, h: 140 },
    ],
    cones: [
      { x: 450, y: 425, r: 13 },
      { x: 610, y: 410, r: 13 },
      { x: 350, y: 90, r: 13 },
      { x: 760, y: 320, r: 13 },
      { x: 220, y: 360, r: 13 },
    ],
  },
];

const car = {
  x: 0,
  y: 0,
  angle: 0,
  width: 52,
  height: 28,
  speed: 0,
  maxForward: 240,
  maxReverse: -110,
  acceleration: 235,
  friction: 200,
  steeringSpeed: 2.8,
};

function setScreen(screen) {
  state.screen = screen;

  [mainMenu, howtoMenu, pauseMenu, levelCompleteMenu, gameOverMenu].forEach((el) =>
    el.classList.add("hidden")
  );
  hud.classList.add("hidden");

  if (screen === "menu") mainMenu.classList.remove("hidden");
  if (screen === "howto") howtoMenu.classList.remove("hidden");
  if (screen === "pause") pauseMenu.classList.remove("hidden");
  if (screen === "complete") levelCompleteMenu.classList.remove("hidden");
  if (screen === "gameover") gameOverMenu.classList.remove("hidden");
  if (screen === "playing") hud.classList.remove("hidden");
}

function getLevel() {
  return levels[state.levelIndex];
}

function resetCar() {
  const level = getLevel();
  car.x = level.carStart.x;
  car.y = level.carStart.y;
  car.angle = level.carStart.angle;
  car.speed = 0;
  state.parkedFor = 0;
}

function startLevel(index, resetAttempts = false) {
  state.levelIndex = index;
  if (resetAttempts) state.attempts = 0;
  state.levelTimer = getLevel().timeLimit;
  state.levelTime = 0;
  state.parkedFor = 0;
  resetCar();
  setScreen("playing");
  updateHud();
}

function restartCurrentLevel() {
  state.attempts += 1;
  startLevel(state.levelIndex);
}

function updateHud() {
  hudLevel.textContent = getLevel().name;
  hudAttempts.textContent = `Tentativas: ${state.attempts}`;
  hudTime.textContent = `Tempo: ${Math.max(0, state.levelTimer).toFixed(1)}s`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getCarRadius() {
  return Math.hypot(car.width, car.height) * 0.46;
}

function updateCar(dt) {
  const throttle = (controls.up ? 1 : 0) - (controls.down ? 1 : 0);
  if (throttle !== 0) {
    car.speed += throttle * car.acceleration * dt;
  } else {
    const decay = car.friction * dt;
    if (Math.abs(car.speed) <= decay) {
      car.speed = 0;
    } else {
      car.speed -= Math.sign(car.speed) * decay;
    }
  }

  car.speed = clamp(car.speed, car.maxReverse, car.maxForward);

  const steerInput = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
  const speedFactor = clamp(Math.abs(car.speed) / 180, 0, 1.1);
  car.angle += steerInput * car.steeringSpeed * speedFactor * dt * Math.sign(car.speed || 1);

  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
}

function carCollision(level) {
  const r = getCarRadius();

  if (car.x - r < 8 || car.x + r > canvas.width - 8 || car.y - r < 8 || car.y + r > canvas.height - 8) {
    return true;
  }

  for (const obs of level.obstacles) {
    const nx = clamp(car.x, obs.x, obs.x + obs.w);
    const ny = clamp(car.y, obs.y, obs.y + obs.h);
    if ((car.x - nx) ** 2 + (car.y - ny) ** 2 < r ** 2) return true;
  }

  for (const cone of level.cones) {
    const distance = Math.hypot(car.x - cone.x, car.y - cone.y);
    if (distance < r + cone.r * 0.72) return true;
  }

  return false;
}

function isParked(level, dt) {
  const slot = level.slot;
  const cx = clamp(car.x, slot.x, slot.x + slot.w);
  const cy = clamp(car.y, slot.y, slot.y + slot.h);
  const insideDist = Math.hypot(car.x - cx, car.y - cy);
  const inSlot = insideDist < getCarRadius() * 0.72;

  const angleToSlot = slot.angle;
  const rawDiff = Math.atan2(Math.sin(car.angle - angleToSlot), Math.cos(car.angle - angleToSlot));
  const goodAngle = Math.abs(rawDiff) < 0.33 || Math.abs(Math.abs(rawDiff) - Math.PI) < 0.33;
  const goodSpeed = Math.abs(car.speed) < 28;

  if (inSlot && goodAngle && goodSpeed) {
    state.parkedFor += dt;
  } else {
    state.parkedFor = Math.max(0, state.parkedFor - dt * 2.3);
  }

  return state.parkedFor >= 1;
}

function finishLevel() {
  setScreen("complete");
  statsText.textContent = `Concluído em ${state.levelTime.toFixed(1)}s com ${state.attempts} colisões.`;
}

function failLevel(reason) {
  setScreen("gameover");
  gameOverText.textContent = reason;
}

function nextLevel() {
  if (state.levelIndex < levels.length - 1) {
    startLevel(state.levelIndex + 1);
    return;
  }

  setScreen("menu");
  mainMenu.classList.remove("hidden");
  alert("Parabéns! Você concluiu todos os níveis do Cursor Parking.");
}

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#0f172a");
  g.addColorStop(1, "#111827");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawObstacle(obstacle) {
  ctx.fillStyle = "#334155";
  ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 2;
  ctx.strokeRect(obstacle.x + 1, obstacle.y + 1, obstacle.w - 2, obstacle.h - 2);
}

function drawCone(cone) {
  ctx.save();
  ctx.translate(cone.x, cone.y);
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.moveTo(0, -cone.r);
  ctx.lineTo(cone.r * 0.85, cone.r);
  ctx.lineTo(-cone.r * 0.85, cone.r);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff7ed";
  ctx.fillRect(-cone.r * 0.5, cone.r * 0.05, cone.r, cone.r * 0.22);
  ctx.restore();
}

function drawSlot(slot) {
  ctx.save();
  ctx.translate(slot.x + slot.w / 2, slot.y + slot.h / 2);
  ctx.rotate(slot.angle);
  ctx.translate(-slot.w / 2, -slot.h / 2);

  ctx.strokeStyle = "#22d3ee";
  ctx.setLineDash([9, 6]);
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, slot.w, slot.h);
  ctx.setLineDash([]);

  const alpha = clamp(state.parkedFor / 1, 0, 1);
  ctx.fillStyle = `rgba(34, 211, 238, ${0.06 + alpha * 0.22})`;
  ctx.fillRect(0, 0, slot.w, slot.h);
  ctx.restore();
}

function drawCar() {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);

  const bodyGradient = ctx.createLinearGradient(-car.width / 2, -car.height / 2, car.width / 2, car.height / 2);
  bodyGradient.addColorStop(0, "#38bdf8");
  bodyGradient.addColorStop(1, "#1d4ed8");

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(-car.width / 2 - 2, -car.height / 2 - 2, car.width + 4, car.height + 4);

  ctx.fillStyle = bodyGradient;
  ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);

  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.fillRect(-car.width * 0.26, -car.height * 0.34, car.width * 0.52, car.height * 0.68);

  ctx.fillStyle = "#94a3b8";
  const wheelW = 8;
  const wheelH = 5;
  const positions = [
    [-car.width * 0.32, -car.height * 0.52],
    [car.width * 0.32 - wheelW, -car.height * 0.52],
    [-car.width * 0.32, car.height * 0.52 - wheelH],
    [car.width * 0.32 - wheelW, car.height * 0.52 - wheelH],
  ];
  for (const [x, y] of positions) {
    ctx.fillRect(x, y, wheelW, wheelH);
  }

  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(car.width * 0.38 - 6, -3, 6, 6);

  ctx.restore();
}

function drawLevel(level) {
  drawBackground();

  ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  drawSlot(level.slot);
  level.obstacles.forEach(drawObstacle);
  level.cones.forEach(drawCone);
  drawCar();
}

function gameLoop(now) {
  const dt = Math.min(0.034, (now - state.lastTime) / 1000);
  state.lastTime = now;

  if (state.screen === "playing") {
    const level = getLevel();
    updateCar(dt);

    state.levelTime += dt;
    state.levelTimer -= dt;

    if (carCollision(level)) {
      restartCurrentLevel();
    } else if (isParked(level, dt)) {
      finishLevel();
    } else if (state.levelTimer <= 0) {
      failLevel("Tempo esgotado. Tente novamente!");
    }

    updateHud();
    drawLevel(level);
  } else if (state.screen === "pause" || state.screen === "menu" || state.screen === "howto") {
    drawBackground();
    if (state.screen === "pause") {
      drawLevel(getLevel());
    }
  } else if (state.screen === "complete" || state.screen === "gameover") {
    drawLevel(getLevel());
  }

  requestAnimationFrame(gameLoop);
}

function mapKey(value, pressed) {
  switch (value) {
    case "arrowup":
    case "w":
      controls.up = pressed;
      break;
    case "arrowdown":
    case "s":
      controls.down = pressed;
      break;
    case "arrowleft":
    case "a":
      controls.left = pressed;
      break;
    case "arrowright":
    case "d":
      controls.right = pressed;
      break;
    case "escape":
      if (pressed) {
        if (state.screen === "playing") {
          setScreen("pause");
        } else if (state.screen === "pause") {
          setScreen("playing");
        }
      }
      break;
    default:
      break;
  }
}

window.addEventListener("keydown", (e) => {
  mapKey(e.key.toLowerCase(), true);
});

window.addEventListener("keyup", (e) => {
  mapKey(e.key.toLowerCase(), false);
});

btnPlay.addEventListener("click", () => {
  startLevel(0, true);
});

btnHowto.addEventListener("click", () => setScreen("howto"));
btnBackMain.addEventListener("click", () => setScreen("menu"));

btnPause.addEventListener("click", () => {
  if (state.screen === "playing") setScreen("pause");
});
btnResume.addEventListener("click", () => setScreen("playing"));
btnExit.addEventListener("click", () => setScreen("menu"));

btnRetry.addEventListener("click", () => startLevel(state.levelIndex));
btnNext.addEventListener("click", () => {
  nextLevel();
});

btnRetryGame.addEventListener("click", () => startLevel(state.levelIndex));
btnExitGameOver.addEventListener("click", () => setScreen("menu"));

setScreen("menu");
requestAnimationFrame((ts) => {
  state.lastTime = ts;
  requestAnimationFrame(gameLoop);
});

