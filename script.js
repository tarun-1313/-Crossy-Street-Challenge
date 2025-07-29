const levels = [
  { bg: 'linear-gradient(135deg,#87CEEB,#98FB98)', spawnRate:2000, speed:1 },
  { bg: 'linear-gradient(135deg,#FFA07A,#FFDAB9)', spawnRate:1800, speed:1.2 },
  { bg: 'linear-gradient(135deg,#483D8B,#708090)', spawnRate:1600, speed:1.5 },
  { bg: 'linear-gradient(135deg,#2F4F4F,#696969)', spawnRate:1400, speed:1.8 },
  { bg: 'linear-gradient(135deg,#000000,#434343)', spawnRate:1200, speed:2.1 }
];

let gameState = {};
let currentLevel = 0;
let walkAudioFrame = 0;

const gameArea = document.getElementById('gameArea');
const player = document.getElementById('player');
const playerImg = document.getElementById('playerImg');
const levelCompleteDiv = document.getElementById('levelComplete');
const gameOverDiv = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');
const finalLevelEl = document.getElementById('finalLevel');

initGame();

function initGame() {
  currentLevel = 0;
  setupNewGameState();
  initLevel();
  updateHUD();
  gameState.running = true;
  gameLoop();
}

function setupNewGameState() {
  gameState = {
    x:380, y:550, level:1, score:0, lives:3,
    vehicles:[], roads:[], running:false,
    spawnRate: levels[0].spawnRate, speed:levels[0].speed
  };
  positionPlayer();
}

function initLevel() {
  const lvl = levels[currentLevel];
  gameArea.style.background = lvl.bg;

  gameState.spawnRate = lvl.spawnRate;
  gameState.speed = lvl.speed;

  document.querySelectorAll('.road, .grass').forEach(e=>e.remove());
  gameState.roads = [];

  for (let i=0;i<5;i++){
    const grass = document.createElement('div');
    grass.className = 'grass';
    grass.style.top = `${i*120}px`;
    gameArea.appendChild(grass);

    if(i<4){
      const road = document.createElement('div');
      road.className='road';
      road.style.top = `${i*120+60}px`;
      const lines = document.createElement('div');
      lines.className='road-lines';
      road.appendChild(lines);
      gameArea.appendChild(road);
      gameState.roads.push({y:i*120+60, dir:i%2? -1:1, last:0});
    }
  }
  gameState.x=380; gameState.y=550;
  positionPlayer();
}

function positionPlayer(){
  player.style.left = gameState.x+'px';
  player.style.top = gameState.y+'px';
}

function updateHUD(){
  document.getElementById('level').textContent = gameState.level;
  document.getElementById('score').textContent = gameState.score;
  document.getElementById('lives').textContent = gameState.lives;
}

function createVehicle(idx){
  const r=gameState.roads[idx];
  const types=['car','truck','bike'];
  const type = types[Math.floor(Math.random()*types.length)];
  const el = document.createElement('div');
  el.className=`vehicle ${type}`;
  el.style.top = r.y+15+'px';
  el.style.left = (r.dir===1?'-120px':'820px');
  gameArea.appendChild(el);
  gameState.vehicles.push({
    el,type,x:r.dir===1?-120:820,y:r.y+15,
    dir:r.dir,speed:(2+Math.random()*2)*gameState.speed
  });
}

function updateVehicles(){
  const t=Date.now();
  gameState.roads.forEach((r,i)=>{
    if(t-r.last>gameState.spawnRate){
      if(Math.random()<0.7){
        createVehicle(i);
        r.last=t;
      }
    }
  });
  gameState.vehicles = gameState.vehicles.filter(v=>{
    v.x+=v.dir*v.speed; v.el.style.left=v.x+'px';
    if(v.x<-150||v.x>950){
      v.el.remove(); return false;
    }
    return true;
  });
}

function checkCollisions(){
  const pr={x:gameState.x,y:gameState.y,w:40,h:60};
  for(const v of gameState.vehicles){
    const w = v.type==='truck'?120: v.type==='car'?80:50;
    const vh=50;
    if(pr.x<v.x+w && pr.x+pr.w>v.x &&
       pr.y<v.y+vh && pr.y+pr.h>v.y){
      hit();
      break;
    }
  }
}

function hit(){
  const exp = document.createElement('div');
  exp.className='explosion';
  exp.style.left = gameState.x-10+'px';
  exp.style.top = gameState.y-10+'px';
  gameArea.appendChild(exp);
  setTimeout(()=>exp.remove(),500);

  gameState.lives--;
  updateHUD();
  if(gameState.lives<=0) return endGame();
  gameState.x=380; gameState.y=550; positionPlayer();
}

function checkLevelUp(){
  if(gameState.y<=60){
    levelCompleteDiv.style.display='block';
    gameState.running=false;
    setTimeout(()=>{
      levelCompleteDiv.style.display='none';
      currentLevel++;
      if(currentLevel>=levels.length) return endGame(true);
      gameState.level++;
      gameState.score += 100 * gameState.level;
      initLevel(); updateHUD();
      gameState.running=true;
      gameLoop();
    },2000);
  }
}

function gameLoop(){
  if(!gameState.running) return;
  updateVehicles();
  checkCollisions();
  updateHUD();
  checkLevelUp();
  requestAnimationFrame(gameLoop);
}

function endGame(victory=false){
  gameState.running=false;
  finalScoreEl.textContent = gameState.score;
  finalLevelEl.textContent = gameState.level;
  gameOverDiv.querySelector('h2').textContent = victory ? 'You Win!' : 'Game Over!';
  gameOverDiv.style.display='block';
}

function restartGame(){
  gameOverDiv.style.display='none';
  document.querySelectorAll('.vehicle').forEach(e=>e.remove());
  initGame();
}

let walking=false;
document.addEventListener('keydown',e=>{
  if(!gameState.running) return;
  const key=e.key.toLowerCase();
  const step=20;
  let moved=false;
  if(['arrowup','w'].includes(e.key.toLowerCase())){
    if(gameState.y>0){gameState.y-=step;gameState.score++; moved=true;}
  }
  if(['arrowdown','s'].includes(e.key.toLowerCase())){
    if(gameState.y<540){gameState.y+=step; moved=true;}
  }
  if(['arrowleft','a'].includes(e.key.toLowerCase())){
    if(gameState.x>0){gameState.x-=step; moved=true;}
  }
  if(['arrowright','d'].includes(e.key.toLowerCase())){
    if(gameState.x<760){gameState.x+=step; moved=true;}
  }
  if(moved){
    positionPlayer();
    updateHUD();
  }
  if(!walking && moved) setWalking(true);
});

document.addEventListener('keyup',e=>{
  if(walking) setWalking(false);
});

function setWalking(on){
  walking=on;
  player.classList.toggle('walking',on);
  playerImg.src=on?'walk1.png':'idle1.png';
}
