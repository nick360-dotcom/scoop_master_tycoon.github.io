const F = [
  ['Vanilla','⚪',1,3],['Chocolate','🟤',1,4],['Strawberry','🩷',1,4],['Mint','🟢',2,5],
  ['Mango','🟡',3,6],['Blueberry','🔵',4,7],['Cookie Dough','🍪',5,8],['Matcha','🍵',6,9],
  ['Pistachio','🥜',7,10],['Rainbow','🌈',8,12],['Black Sesame','⚫',9,14],['Golden Sundae','✨',10,20]
].map(([name,icon,unlock,value])=>({name,icon,unlock,value}));

const T=[0,75,225,500,950,1600,2500,3700,5200,7000];
const SHOPS=['Ice-Cream Cart','Tiny Scoop Shop','Neighbourhood Parlour','Busy Dessert Bar','Scoop Street Café','City Ice-Cream House','Famous Flavour Studio','Luxury Sundae Lounge','Scoop Empire','Golden Ice-Cream Palace'];
const NAMES=['Mia','Noah','Ava','Leo','Zara','Kai','Sofia','Ethan'];
const AVATARS=['🧒','👧','👦','👩','👨','👵','👴','🧑‍💼'];
const CHEAT=['Chocolate','Chocolate','Vanilla','Strawberry'];
const SAVE_KEY='scoop-master-save-v1';
const $=id=>document.getElementById(id);

const defaultState=()=>({
  started:false,paused:false,banner:false,level:1,xp:0,money:0,served:0,combo:0,prestige:0,
  upgrade:0,shifts:0,prepared:[],order:null,patience:100,seconds:0,cheatInput:[],bannerClose:null
});
let s=defaultState();
let last=performance.now();

function save(){ localStorage.setItem(SAVE_KEY,JSON.stringify({...s,banner:false,bannerClose:null,prepared:s.prepared.map(x=>x.name),order:s.order?.name||null})); }
function load(){
  const raw=localStorage.getItem(SAVE_KEY); if(!raw)return;
  try{
    const data=JSON.parse(raw); s={...defaultState(),...data,started:true,paused:true,banner:false,bannerClose:null};
    s.prepared=(data.prepared||[]).map(n=>F.find(f=>f.name===n)).filter(Boolean);
    s.order=F.find(f=>f.name===data.order)||null;
  }catch{}
}

function frozen(){return !s.started||s.paused||s.banner}
function maxScoops(){return s.level>=7?3:s.level>=4?2:1}
function formatTime(v){const t=Math.floor(v);return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`}
function setMessage(t){$('message').textContent=t}

function renderFlavours(){
  $('flavourShelf').innerHTML='';
  F.forEach(f=>{
    const unlocked=f.unlock<=s.level;
    const b=document.createElement('button');
    b.className=`flavour ${unlocked?'':'locked'}`; b.disabled=!unlocked;
    b.innerHTML=`<div class="icon">${f.icon}</div><strong>${f.name}</strong><div class="sub">${unlocked?`$${f.value}`:`Level ${f.unlock}`}</div>`;
    b.addEventListener('click',()=>tapFlavour(f));
    $('flavourShelf').appendChild(b);
  });
}

function tapFlavour(f){
  if(frozen())return;
  s.cheatInput.push(f.name); if(s.cheatInput.length>4)s.cheatInput.shift();
  if(s.cheatInput.length===4&&s.cheatInput.every((x,i)=>x===CHEAT[i])){
    s.level=10;s.xp=Math.max(s.xp,T[9]);s.prepared=[];s.cheatInput=[];renderFlavours();renderPrepared();updateUI();save();
    showBanner('👑','Maximum Level','Level 10 Reached!','All flavours and prestige rebirth are unlocked.','Endless Mode available');
    return;
  }
  if(s.prepared.length>=maxScoops()){setMessage(`Maximum ${maxScoops()} scoops.`);return}
  s.prepared.push(f);renderPrepared();save();
}

function renderPrepared(){
  $('preparedText').textContent=s.prepared.length?s.prepared.map(x=>x.name).join(' + '):'Empty cone';
  $('cone').innerHTML=`${s.prepared.length?s.prepared.map(x=>x.icon).join(''):'▫️'}<br>🔻`;
}

function newOrder(){
  const pool=F.filter(f=>f.unlock<=s.level);
  s.order=pool[Math.floor(Math.random()*pool.length)];s.patience=100;
  const i=Math.floor(Math.random()*NAMES.length);
  $('customerName').textContent=NAMES[i];$('avatar').textContent=AVATARS[i];
  $('request').textContent=`${s.order.icon} ${s.order.name}`;$('reward').textContent=`$${s.order.value}`;
  $('patienceBar').style.width='100%';$('patienceText').textContent='Patient';save();
}

function serve(){
  if(frozen()||!s.prepared.length)return;
  if(s.prepared.length!==1||s.prepared[0].name!==s.order.name){
    s.combo=0;s.prepared=[];renderPrepared();setMessage('Wrong order.');updateUI();save();return;
  }
  const earned=s.order.value+Math.min(5,s.combo);
  const old=s.level;s.money+=earned;s.xp+=earned*3;s.served++;s.combo++;s.prepared=[];renderPrepared();
  while(s.level<10&&s.xp>=T[s.level])s.level++;
  renderFlavours();updateUI();save();
  if(s.level>old){
    showBanner(s.level===10?'👑':'⭐',s.level===10?'Maximum Level':'Level Up',s.level===10?'Level 10 Reached!':`Level ${s.level}!`,`Your shop is now the ${SHOPS[s.level-1]}.`,s.level===10?'Prestige rebirth unlocked':`Unlocked: ${F.find(f=>f.unlock===s.level)?.name||'new upgrades'}`);
  }
  newOrder();
}

function upgrade(){
  const cost=25+s.upgrade*35;
  if(s.money<cost){setMessage(`Need $${cost-s.money} more.`);return}
  s.money-=cost;s.upgrade++;updateUI();save();
}

function rebirth(){
  if(s.level<10||s.banner)return;
  const prestige=s.prestige+1;
  s={...defaultState(),started:true,paused:true,prestige,shifts:0};
  renderFlavours();renderPrepared();newOrder();updateUI();save();
  showBanner('♻️','Prestige Complete','Rebirth Successful!',`Your shop has restarted with Prestige ${s.prestige}.`,'Progress reset to Level 1',()=>{
    s.paused=false;s.shifts=1;last=performance.now();updateUI();save();setMessage('A new beginning. Your first customer is waiting.');
  });
}

function endShift(){
  if(s.banner)return;s.paused=true;updateUI();save();
  showBanner('🌙','Shift Complete','Shift Off','Serving and patience are frozen.','Upgrades and rebirth remain available');
}
function startShift(){
  if(s.banner)return;
  showBanner('☀️','Shop Opening','New Shift','The shop is opening again.',`Shift ${s.shifts+1} begins`,()=>{
    s.paused=false;s.shifts++;last=performance.now();updateUI();save();
  });
}

function showBanner(icon,type,title,text,reward,onClose){
  s.banner=true;s.bannerClose=onClose||null;
  $('bannerIcon').textContent=icon;$('bannerType').textContent=type;$('bannerTitle').textContent=title;
  $('bannerText').textContent=text;$('bannerReward').textContent=reward;$('banner').classList.remove('hidden');
}
function closeBanner(){
  if(!s.banner)return;
  s.banner=false;$('banner').classList.add('hidden');
  const cb=s.bannerClose;s.bannerClose=null;if(cb)cb();
  last=performance.now();save();
}

function updateUI(){
  $('levelValue').textContent=s.level;$('moneyValue').textContent=`$${s.money}`;$('servedValue').textContent=s.served;
  $('comboValue').textContent=`×${s.combo}`;$('prestigeValue').textContent=s.prestige;
  $('shopName').textContent=`Level ${s.level} ${SHOPS[s.level-1]}`;
  if(s.level<10){
    const floor=T[s.level-1],target=T[s.level],p=Math.max(0,Math.min(100,(s.xp-floor)/(target-floor)*100));
    $('xpLabel').textContent=`${s.xp} / ${target} XP`;$('xpBar').style.width=`${p}%`;$('levelPercent').textContent=`${Math.round(p)}%`;
  }else{$('xpLabel').textContent=`${s.xp} XP — maximum level`;$('xpBar').style.width='100%';$('levelPercent').textContent='100%'}
  const level10=s.level===10;
  $('rebirthCard').classList.toggle('hidden',!level10);$('pausedRebirth').classList.toggle('hidden',!(level10&&s.paused));
  $('currentPrestige').textContent=s.prestige;$('nextPrestige').textContent=s.prestige+1;
  $('upgradeLevel').textContent=`Counter Lv. ${s.upgrade}`;$('upgradeEffect').textContent=s.upgrade?`+${s.upgrade*12}% earnings`:'Normal earnings';
  $('upgradeButton').textContent=`Upgrade $${25+s.upgrade*35}`;
  $('closedOverlay').classList.toggle('hidden',!s.paused);$('modeBadge').textContent=s.paused?'Shop closed':s.level===10?'Endless mode':'Shop open';
  $('shiftButton').textContent=s.paused?'▶ Start shift':'⏸ End shift';
  $('shiftStat').textContent=s.shifts;$('timeStat').textContent=formatTime(s.seconds);
}

function tick(now){
  const dt=Math.min(.25,(now-last)/1000);last=now;
  if(frozen())return;
  s.seconds+=dt;s.patience=Math.max(0,s.patience-dt*4);
  $('patienceBar').style.width=`${s.patience}%`;
  $('patienceText').textContent=s.patience>65?'Patient':s.patience>30?'Getting impatient':'About to leave!';
  if(s.patience<=0){s.combo=0;newOrder();updateUI()}
  $('timeStat').textContent=formatTime(s.seconds);
  if(Math.floor(s.seconds)%5===0)save();
}

$('startGameButton').addEventListener('click',()=>{
  s.started=true;s.paused=true;$('startScreen').classList.add('hidden');$('shiftButton').classList.remove('hidden');
  renderFlavours();newOrder();updateUI();
  showBanner('🍦','Grand Opening','First Shift','Serve customers before their patience runs out.','Vanilla, Chocolate and Strawberry unlocked',()=>{
    s.paused=false;s.shifts=1;last=performance.now();updateUI();save();
  });
});
$('shiftButton').addEventListener('click',()=>s.paused?startShift():endShift());
$('startShiftButton').addEventListener('click',startShift);
$('serveButton').addEventListener('click',serve);
$('clearButton').addEventListener('click',()=>{if(!frozen()){s.prepared=[];renderPrepared();save()}});
$('upgradeButton').addEventListener('click',upgrade);
$('rebirthButton').addEventListener('click',rebirth);
$('pausedRebirthButton').addEventListener('click',rebirth);
$('banner').addEventListener('click',closeBanner);

document.addEventListener('visibilitychange',()=>{if(document.hidden&&s.started&&!s.paused){s.paused=true;updateUI();save()}});
window.addEventListener('beforeunload',save);

load();
renderFlavours();renderPrepared();
if(s.started){
  $('startScreen').classList.add('hidden');$('shiftButton').classList.remove('hidden');
  if(!s.order)newOrder(); else {
    $('request').textContent=`${s.order.icon} ${s.order.name}`;$('reward').textContent=`$${s.order.value}`;
  }
}
updateUI();
setInterval(()=>tick(performance.now()),100);

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));
}