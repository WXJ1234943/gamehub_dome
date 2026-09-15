<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const canvasRef = ref<HTMLCanvasElement | null>(null)

const GRID_SIZE = 20
const COLS = 15
const ROWS = 22
const CANVAS_W = COLS * GRID_SIZE
const CANVAS_H = ROWS * GRID_SIZE

let ctx: CanvasRenderingContext2D | null = null
let snake: Array<{x:number;y:number}> = []
let direction: {x:number;y:number} = {x:1,y:0}
let nextDirection: {x:number;y:number} = {x:1,y:0}
let food: {x:number;y:number} = {x:0,y:0}
let score = ref(0)
let highScore = ref(0)
let gameState = ref<'ready'|'playing'|'paused'|'gameover'>('ready')
let rafId: number | null = null
let lastTime = 0
let speed = ref(150)
let touchStart: {x:number;y:number} | null = null

const gameName = ref('贪吃蛇')
const gameDesc = ref('经典贪吃蛇 · Canvas 2D 渲染 · 触摸滑动操控')

onMounted(() => {
  initCanvas()
  loadHighScore()
  drawReady()
})

onUnmounted(() => {
  stopLoop()
})

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H
  ctx = canvas.getContext('2d')
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
}

function loadHighScore() {
  const saved = localStorage.getItem('gh_snake_high')
  highScore.value = saved ? parseInt(saved) : 0
}

function saveHighScore() {
  if (score.value > highScore.value) {
    highScore.value = score.value
    localStorage.setItem('gh_snake_high', String(score.value))
  }
}

function resetGame() {
  snake = [
    {x:7,y:11},
    {x:6,y:11},
    {x:5,y:11},
  ]
  direction = {x:1,y:0}
  nextDirection = {x:1,y:0}
  score.value = 0
  speed.value = 150
  spawnFood()
}

function startGame() {
  resetGame()
  gameState.value = 'playing'
  lastTime = performance.now()
  startLoop()
}

function pauseGame() {
  gameState.value = 'paused'
  stopLoop()
  draw()
}

function resumeGame() {
  gameState.value = 'playing'
  lastTime = performance.now()
  startLoop()
}

function gameOver() {
  gameState.value = 'gameover'
  stopLoop()
  saveHighScore()
  drawGameOver()
}

function startLoop() {
  stopLoop()
  let acc = 0
  const loop = (time: number) => {
    rafId = requestAnimationFrame(loop)
    const delta = time - lastTime
    lastTime = time
    acc += delta
    if (acc >= speed.value) {
      acc = 0
      update()
      draw()
    }
  }
  rafId = requestAnimationFrame(loop)
}

function stopLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function update() {
  direction = nextDirection
  const head = { ...snake[0] }
  head.x += direction.x
  head.y += direction.y

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    gameOver()
    return
  }

  for (let i = 0; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      gameOver()
      return
    }
  }

  snake.unshift(head)

  if (head.x === food.x && head.y === food.y) {
    score.value += 10
    spawnFood()
    if (speed.value > 60) speed.value -= 3
  } else {
    snake.pop()
  }
}

function spawnFood() {
  let valid = false
  while (!valid) {
    food.x = Math.floor(Math.random() * COLS)
    food.y = Math.floor(Math.random() * ROWS)
    valid = !snake.some(s => s.x === food.x && s.y === food.y)
  }
}

function setDirection(dx: number, dy: number) {
  if (direction.x === -dx && direction.y === -dy) return
  if (direction.x === dx && direction.y === dy) return
  nextDirection = {x:dx, y:dy}
}

function handleTouchStart(e: TouchEvent) {
  e.preventDefault()
  const touch = e.touches[0]
  touchStart = {x: touch.clientX, y: touch.clientY}
}

function handleTouchMove(e: TouchEvent) {
  e.preventDefault()
}

function handleTouchEnd(e: TouchEvent) {
  e.preventDefault()
  if (!touchStart) return
  const touch = e.changedTouches[0]
  const dx = touch.clientX - touchStart.x
  const dy = touch.clientY - touchStart.y
  touchStart = null

  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return

  if (Math.abs(dx) > Math.abs(dy)) {
    setDirection(dx > 0 ? 1 : -1, 0)
  } else {
    setDirection(0, dy > 0 ? 1 : -1)
  }
}

function handleKeydown(e: KeyboardEvent) {
  switch(e.key) {
    case 'ArrowUp': case 'w': setDirection(0,-1); break
    case 'ArrowDown': case 's': setDirection(0,1); break
    case 'ArrowLeft': case 'a': setDirection(-1,0); break
    case 'ArrowRight': case 'd': setDirection(1,0); break
    case ' ': if(gameState.value==='playing')pauseGame(); else if(gameState.value==='paused')resumeGame(); break
  }
}

window.addEventListener('keydown', handleKeydown)
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

function drawReady() {
  if (!ctx) return
  ctx.fillStyle = '#0a0f1a'
  ctx.fillRect(0,0,CANVAS_W,CANVAS_H)
  drawGrid()

  ctx.fillStyle = '#818cf8'
  ctx.font = '20px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🐍 贪吃蛇', CANVAS_W/2, CANVAS_H/2 - 20)
  ctx.fillStyle = '#6b7280'
  ctx.font = '12px sans-serif'
  ctx.fillText('滑动屏幕或方向键控制方向', CANVAS_W/2, CANVAS_H/2 + 10)
  ctx.fillText('点击开始按钮启动游戏', CANVAS_W/2, CANVAS_H/2 + 28)
}

function drawGrid() {
  if (!ctx) return
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 1
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath()
    ctx.moveTo(x*GRID_SIZE, 0)
    ctx.lineTo(x*GRID_SIZE, CANVAS_H)
    ctx.stroke()
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y*GRID_SIZE)
    ctx.lineTo(CANVAS_W, y*GRID_SIZE)
    ctx.stroke()
  }
}

function draw() {
  if (!ctx) return
  ctx.fillStyle = '#0a0f1a'
  ctx.fillRect(0,0,CANVAS_W,CANVAS_H)
  drawGrid()

  ctx.fillStyle = '#e94560'
  ctx.beginPath()
  const fx = food.x * GRID_SIZE + GRID_SIZE/2
  const fy = food.y * GRID_SIZE + GRID_SIZE/2
  ctx.arc(fx, fy, GRID_SIZE/2 - 2, 0, Math.PI * 2)
  ctx.fill()

  snake.forEach((seg, i) => {
    if (!ctx) return
    const isHead = i === 0
    if (isHead) {
      ctx.fillStyle = '#818cf8'
    } else {
      const alpha = 1 - (i / snake.length) * 0.5
      ctx.fillStyle = `rgba(99,102,241,${alpha})`
    }
    const r = 4
    const x = seg.x * GRID_SIZE + 1
    const y = seg.y * GRID_SIZE + 1
    const w = GRID_SIZE - 2
    const h = GRID_SIZE - 2
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    ctx.fill()
  })

  if (gameState.value === 'paused') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0,0,CANVAS_W,CANVAS_H)
    ctx.fillStyle = '#fff'
    ctx.font = '24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('⏸ 暂停', CANVAS_W/2, CANVAS_H/2)
  }
}

function drawGameOver() {
  if (!ctx) return
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(0,0,CANVAS_W,CANVAS_H)
  ctx.fillStyle = '#e94560'
  ctx.font = '24px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('游戏结束', CANVAS_W/2, CANVAS_H/2 - 20)
  ctx.fillStyle = '#fff'
  ctx.font = '16px sans-serif'
  ctx.fillText(`得分：${score.value}`, CANVAS_W/2, CANVAS_H/2 + 10)
  ctx.fillStyle = '#ffb800'
  ctx.font = '12px sans-serif'
  ctx.fillText(`最高分：${highScore.value}`, CANVAS_W/2, CANVAS_H/2 + 32)
}
</script>

<template>
  <div class="play-page">
    <header class="play-header">
      <button class="back-btn" @click="router.back()">←</button>
      <div class="header-info">
        <span class="header-title">{{ gameName }}</span>
        <span class="header-desc">{{ gameDesc }}</span>
      </div>
    </header>

    <div class="score-bar">
      <div class="score-item">
        <span class="score-label">得分</span>
        <span class="score-value">{{ score }}</span>
      </div>
      <div class="score-item">
        <span class="score-label">最高分</span>
        <span class="score-value highlight">{{ highScore }}</span>
      </div>
      <div class="score-item">
        <span class="score-label">速度</span>
        <span class="score-value">{{ Math.round(1000 / speed) }}</span>
      </div>
    </div>

    <div class="canvas-wrapper">
      <canvas ref="canvasRef" class="game-canvas"></canvas>
      <div v-if="gameState === 'ready'" class="canvas-overlay">
        <button class="start-btn" @click="startGame">开始游戏</button>
      </div>
      <div v-else-if="gameState === 'gameover'" class="canvas-overlay">
        <button class="start-btn" @click="startGame">再来一局</button>
      </div>
    </div>

    <div class="controls" v-if="gameState === 'playing' || gameState === 'paused'">
      <button v-if="gameState === 'playing'" class="ctrl-btn" @click="pauseGame">⏸ 暂停</button>
      <button v-else class="ctrl-btn" @click="resumeGame">▶ 继续</button>
    </div>

    <div class="tech-info">
      <div class="tech-row">✅ Canvas 2D 渲染 · requestAnimationFrame 游戏循环</div>
      <div class="tech-row">✅ 触摸手势适配 · 键盘方向键兼容</div>
      <div class="tech-row">✅ 碰撞检测 · 蛇身渐变绘制 · 难度递增</div>
      <div class="tech-row">✅ localStorage 最高分持久化</div>
    </div>
  </div>
</template>

<style scoped>
.play-page {
  min-height: 100vh;
}

.play-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 56px;
  background: rgba(15,25,35,0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.back-btn {
  font-size: 20px;
  background: none;
}

.header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.header-desc {
  font-size: 11px;
  color: #6b7280;
}

.score-bar {
  display: flex;
  justify-content: space-around;
  padding: 12px 16px;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.score-label {
  font-size: 11px;
  color: #6b7280;
}

.score-value {
  font-size: 20px;
  font-weight: 700;
}

.score-value.highlight {
  color: #ffb800;
}

.canvas-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  margin: 0 16px;
}

.game-canvas {
  background: #0a0f1a;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.06);
  touch-action: none;
  max-width: 100%;
}

.canvas-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.start-btn {
  padding: 12px 32px;
  border-radius: 24px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(99,102,241,0.4);
}

.start-btn:active { transform: scale(0.95); }

.controls {
  display: flex;
  justify-content: center;
  padding: 16px;
}

.ctrl-btn {
  padding: 8px 24px;
  border-radius: 20px;
  background: rgba(255,255,255,0.06);
  color: #d1d5db;
  font-size: 14px;
}

.tech-info {
  padding: 16px;
  margin-top: 8px;
}

.tech-row {
  font-size: 11px;
  color: #6b7280;
  padding: 4px 0;
}
</style>
