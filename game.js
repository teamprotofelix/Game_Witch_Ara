(()=>{'use strict';
// Witch's Hunt — self-contained static PWA canvas arcade.
const $=id=>document.getElementById(id), canvas=$('game'),ctx=canvas.getContext('2d',{alpha:false});
const W=1800,H=1200,TAU=Math.PI*2;
const clamp=(v,l,h)=>Math.max(l,Math.min(h,v)),rnd=(a,b)=>a+Math.random()*(b-a),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const key='witch-hunt-save-v2',bestKey='witch-hunt-best-v2',settingsKey='witch-hunt-settings-v2';
const stages=[{name:'Ⅰ · 달빛 숲',short:'달빛 숲',bg:'forest',caption:'숲의 정령이 깨어납니다',boss:'태고의 숲 정령',bossType:'treant',tint:'#60d3a0'},
{name:'Ⅱ · 잊힌 유적',short:'잊힌 유적',bg:'ruins',caption:'봉인된 돌의 숨결',boss:'고대의 수호 골렘',bossType:'golem',tint:'#d2a9f6'},
{name:'Ⅲ · 서리 협곡',short:'서리 협곡',bg:'snow',caption:'얼음에 갇힌 별의 결정',boss:'혹한의 그림자 늑대',bossType:'wolf',tint:'#9eeeff'},
{name:'Ⅳ · 월식 제단',short:'월식 제단',bg:'moon',caption:'마지막 봉인을 깨뜨리세요',boss:'월식의 여왕',bossType:'shadow',tint:'#f693dc'}];
const items={
 leaf:{name:'달빛 잎',src:'leaf'},crystal:{name:'별 수정',src:'crystal'},fungus:{name:'마력 버섯',src:'fungus'},dew:{name:'이슬',src:'dew'},bloom:{name:'신비 꽃',src:'bloom'},wing:{name:'박쥐 날개',src:'wing'},
 amber_mushroom:{name:'황금 버섯',src:'amber_mushroom'},frost_flower:{name:'서리 꽃',src:'frost_flower'},moon_shard:{name:'월석 파편',src:'moon_shard'},feather:{name:'바람 깃털',src:'feather'},star_ice:{name:'별 서리',src:'star_ice'},ember:{name:'불씨',src:'ember'},moon_essence:{name:'월광 정수',src:'moon_essence'},boss_core:{name:'수호자 핵',src:'boss_core'},ash:{name:'마력 재',src:'ash'},spirit:{name:'정령의 숨결',src:'spirit'}};
const spells={
 frost:{name:'서리 폭풍',glyph:'❄',icon:'frost',mana:16,cd:9,desc:'주변 적을 얼리고 넓은 범위에 피해를 줍니다.',need:{leaf:3,crystal:3,frost_flower:2}},
 arc:{name:'연쇄 번개',glyph:'ϟ',icon:'arc',mana:24,cd:7,desc:'가까운 적 사이를 최대 7번 도약하는 번개입니다.',need:{dew:3,crystal:4,feather:2}},
 meteor:{name:'붉은 운석',glyph:'☄',icon:'meteor',mana:35,cd:12,desc:'목표 지역에 운석이 떨어져 적을 소각합니다.',need:{ember:4,fungus:3,moon_shard:2}},
 moon:{name:'월식 대마법',glyph:'☾',icon:'moon',mana:52,cd:19,desc:'화면 전체에 달빛이 쏟아지는 궁극의 마법입니다.',need:{boss_core:2,moon_essence:3,crystal:6,feather:3}}
};
const enemyDefs={
 slime:{hp:35,spd:52,damage:8,drop:['leaf','dew'],xp:10,score:10},mushroom:{hp:45,spd:44,damage:9,drop:['fungus','amber_mushroom'],xp:12,score:13},treant:{hp:87,spd:41,damage:14,drop:['leaf','bloom','spirit'],xp:23,score:23},bat:{hp:28,spd:116,damage:7,drop:['wing','feather'],xp:11,score:14},
 wolf:{hp:75,spd:107,damage:13,drop:['feather','star_ice'],xp:18,score:22},golem:{hp:170,spd:40,damage:20,drop:['crystal','moon_shard'],xp:38,score:38},wisp:{hp:51,spd:75,damage:10,drop:['dew','moon_essence','frost_flower'],xp:19,score:21},shadow:{hp:94,spd:92,damage:15,drop:['ash','moon_essence','ember'],xp:28,score:31}
};
const stageEnemies=[['slime','mushroom','treant','bat'],['golem','wisp','bat','mushroom'],['wolf','golem','wisp','bat'],['shadow','wisp','wolf','treant','bat']];
const img={}; let loaded=0,total=0;
function asset(id,path){total++;const im=new Image();im.onload=()=>loaded++;im.onerror=()=>{loaded++;console.warn('asset failed',path)};im.src='./assets/'+path;img[id]=im}
for(let i=0;i<18;i++)asset('hero'+i,'hero/witch_'+String(i).padStart(2,'0')+'.webp');
for(let i=0;i<36;i++)if(i<24||i%6<4)asset('chibi'+i,'hero/chibi_'+String(i).padStart(2,'0')+'.webp');
for(const name of Object.keys(enemyDefs))asset('enemy_'+name,'enemies/'+name+'.webp');
for(const [id,v] of Object.entries(items))asset('item_'+id,'items/'+v.src+'.webp');
for(const s of stages)asset('bg_'+s.bg,'backgrounds/'+s.bg+'.webp');
for(const spell of ['bolt','fire','frost','arc','moon','heal','meteor','shield'])for(let f=0;f<8;f++)asset('fx_'+spell+'_'+f,'vfx/'+spell+'_'+String(f).padStart(2,'0')+'.webp');
const defaultSettings={audio:true,auto:false,motion:true,skin:'classic'};
let settings={...defaultSettings};try{settings={...settings,...JSON.parse(localStorage.getItem(settingsKey)||'{}')}}catch(_){}
const saveSettings=()=>{try{localStorage.setItem(settingsKey,JSON.stringify(settings))}catch(_){}};
let mode='menu',g=null,view={w:innerWidth,h:innerHeight,dpr:1,scale:1,worldW:960,worldH:540,cx:0,cy:0},last=0,accUI=0,autosave=0,spawner=0,shake=0,frameTime=0,mouse={down:false,id:null,x:0,y:0,sx:0,sy:0,kind:'mouse'},buttons=new Set(),toastTimer=0,bannerTimer=0,modalType='',deferredPrompt=null,audioCtx=null;
let enemies=[],drops=[],shots=[],enShots=[],particles=[],effects=[],numbers=[],decals=[];
function buildGame(saved){
 const inventory={};for(const name in items)inventory[name]=0;
 g={time:0,stage:0,stageTime:0,stageKills:0,kills:0,combo:0,comboTimer:0,score:0,gold:0,level:1,xp:0,xpNext:75,bossMade:false,bossId:0,boss:null,ended:false,
 p:{x:W/2,y:H/2,hp:160,maxHp:160,mp:110,maxMp:110,atk:22,spd:258,facing:1,attack:0,invuln:0,boost:0},inv:inventory,unlocked:{frost:false,arc:false,meteor:false,moon:false},cd:{frost:0,arc:0,meteor:0,moon:0},shotCd:0,bonus:{damage:0,haste:0,magnet:0},autoCast:true};
 if(saved){Object.assign(g,{...saved,p:{...g.p,...saved.p},inv:{...inventory,...saved.inv},unlocked:{...g.unlocked,...saved.unlocked},cd:{frost:0,arc:0,meteor:0,moon:0}});g.bossMade=false;g.boss=null;g.ended=false;g.p.hp=Math.max(30,g.p.hp);g.p.mp=Math.max(30,g.p.mp)}
 enemies=[];drops=[];shots=[];enShots=[];particles=[];effects=[];numbers=[];decals=[];spawner=0;autosave=0;g.stage=clamp(g.stage,0,3);g.stageTime=0;g.bossMade=false;g.boss=null;
}
function readSave(){try{const a=JSON.parse(localStorage.getItem(key)||'null');return a?.p&&Number.isFinite(a?.p?.x)?a:null}catch(_){return null}}
function persist(){if(!g||g.ended||mode==='menu'||mode==='won'||mode==='over')return;const {time,stage,kills,score,gold,level,xp,xpNext,stageKills,p,inv,unlocked,bonus}=g;try{localStorage.setItem(key,JSON.stringify({time,stage,kills,score,gold,level,xp,xpNext,stageKills,p,inv,unlocked,bonus}))}catch(_){}}
function best(){try{return JSON.parse(localStorage.getItem(bestKey)||'null')}catch(_){return null}}
function updateBest(){let b=best();if(!b||g.score>b.score){b={score:g.score,kills:g.kills,stage:g.stage,time:Math.round(g.time)};try{localStorage.setItem(bestKey,JSON.stringify(b))}catch(_){}}}
function refreshMenu(){const s=readSave();$('continueBtn').classList.toggle('hidden',!s);const b=best();$('bestScore').textContent=b?'최고 '+b.score.toLocaleString()+'점':'최고 기록 —'}
function start(resume=false){buildGame(resume?readSave():null);mode='running';if(!resume){for(const [i,xy] of [[-180,-130],[183,-110],[145,170],[-135,192]].entries())spawn(['slime','bat','mushroom','slime'][i],false,{x:g.p.x+xy[0],y:g.p.y+xy[1]})}$('menu').classList.add('hidden');$('hud').classList.remove('hidden');$('modal').classList.add('hidden');$('game').focus();banner(stages[g.stage].short+' · '+stages[g.stage].caption,3);updateUI(true);sound(330,.1,'sine');}
function returnMenu(){if(g&&!g.ended&&mode!=='won'&&mode!=='over')persist();mode='menu';g=null;clearControl();$('menu').classList.remove('hidden');$('hud').classList.add('hidden');$('modal').classList.add('hidden');refreshMenu()}
function showToast(msg){const div=document.createElement('div');div.className='toast';div.textContent=msg;$('toasts').append(div);setTimeout(()=>div.remove(),2700);if($('toasts').children.length>4)$('toasts').firstChild.remove()}
function banner(msg,t=2.6){$('banner').textContent=msg;$('banner').classList.remove('hidden');bannerTimer=t}
function toneBurst(){const a=$('flash');a.style.opacity='.18';setTimeout(()=>a.style.opacity='0',85)}
function sound(freq=500,dur=.11,wave='sine',volume=.045){if(!settings.audio||!audioCtx)return;try{const os=audioCtx.createOscillator(),gain=audioCtx.createGain(),at=audioCtx.currentTime;os.type=wave;os.frequency.setValueAtTime(freq,at);os.frequency.exponentialRampToValueAtTime(Math.max(85,freq*.55),at+dur);gain.gain.setValueAtTime(volume,at);gain.gain.exponentialRampToValueAtTime(.001,at+dur);os.connect(gain).connect(audioCtx.destination);os.start();os.stop(at+dur)}catch(_){}}
function initAudio(){if(audioCtx)return;try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume()}catch(_){}}
function randPointOffscreen(){const angle=rnd(0,TAU);const radius=Math.max(view.worldW,view.worldH)*.67+40;const p=g.p;return {x:clamp(p.x+Math.cos(angle)*radius,40,W-40),y:clamp(p.y+Math.sin(angle)*radius,40,H-40)}}
function spawn(type,boss=false,pos){const d=enemyDefs[type],pt=pos||randPointOffscreen();const difficulty=1+g.stage*.42+g.time*.0065;const hp=d.hp*(boss?20+g.stage*7:1)*difficulty;const e={id:++g.bossId,type,x:pt.x,y:pt.y,hp,maxHp:hp,spd:d.spd*(boss?.65:1)*(1+g.stage*.035),damage:d.damage*(boss?2.15:1),radius:boss?73:type==='golem'?35:24,boss,t:rnd(0,100),hit:0,attack:0,stun:0,slow:0,dead:false,angle:0};enemies.push(e);if(boss)g.boss=e;return e}
function spawnBoss(){if(g.bossMade)return;g.bossMade=true;const s=stages[g.stage];const p=randPointOffscreen();spawn(s.bossType,true,p);banner('⚔ '+s.boss+' 출현!',3.5);showToast('보스를 처치하면 다음 지역이 열립니다');sound(120,.75,'sawtooth',.06)}
function spawnMobs(dt){spawner-=dt;if(spawner>0||enemies.length>=70||g.boss&&enemies.length>42)return;const choices=stageEnemies[g.stage],idx=Math.floor(rnd(0,choices.length));spawn(choices[idx]);if(g.time>28&&Math.random()<.18)spawn(choices[Math.floor(rnd(0,choices.length))]);spawner=clamp(.95-g.stage*.12-g.time*.002,.22,1.08)}
function hurtEnemy(e,amount,special=false){if(e.dead)return; e.hp-=amount;e.hit=.13;const col=special?'#f5a4ff':'#f8dbad'; if(numbers.length<90)numbers.push({x:e.x+rnd(-12,12),y:e.y-35,txt:Math.ceil(amount),color:col,life:.65});if(e.hp<=0)killEnemy(e)}
function killEnemy(e){if(e.dead)return;e.dead=true;g.kills++;g.stageKills++;g.combo=(g.comboTimer>0?g.combo:0)+1;g.comboTimer=5;g.score+=Math.round(enemyDefs[e.type].score*(e.boss?30:1)*(1+Math.min(1.5,g.combo*.025)));g.xp+=enemyDefs[e.type].xp*(e.boss?12:1);burst(e.x,e.y,e.boss?44:14,e.boss?'#eaa0fc':'#9ae8ed',e.boss?210:100);dropLoot(e);if(e.boss){g.boss=null;g.inv.boss_core++;g.inv.moon_essence+=2;showToast('수호자 핵과 월광 정수를 획득했습니다!');sound(960,.58,'triangle',.1);nextStage();}else if(g.kills%10===0){sound(880,.06,'triangle')}while(g.xp>=g.xpNext){g.xp-=g.xpNext;levelUp()}}
function dropLoot(e){const d=enemyDefs[e.type];const amount=e.boss?11:(Math.random()<.55?2:1);for(let i=0;i<amount;i++){
  const name=d.drop[Math.floor(rnd(0,d.drop.length))];drops.push({name,x:e.x+rnd(-48,48),y:e.y+rnd(-38,38),t:0,vy:rnd(0,TAU)})
 }if(Math.random()<.29){drops.push({name:['crystal','ember','moon_shard','frost_flower','feather'][Math.floor(rnd(0,5))],x:e.x+rnd(-24,24),y:e.y+rnd(-24,24),t:0,vy:rnd(0,TAU)})}
 if(!e.boss&&g.kills%4===0)drops.push({name:'crystal',x:e.x+12,y:e.y-15,t:0,vy:rnd(0,TAU)});if(!e.boss&&g.kills%7===0)drops.push({name:'frost_flower',x:e.x-8,y:e.y+15,t:0,vy:rnd(0,TAU)});if(!e.boss&&g.kills%9===0)drops.push({name:'ember',x:e.x,y:e.y+10,t:0,vy:rnd(0,TAU)});
 if(e.boss)for(let i=0;i<4;i++)drops.push({name:'moon_essence',x:e.x+rnd(-65,65),y:e.y+rnd(-60,60),t:0,vy:rnd(0,TAU)})
}
function levelUp(){g.level++;g.xpNext=Math.round(g.xpNext*1.23+22);const p=g.p;p.maxHp+=9;p.hp=Math.min(p.maxHp,p.hp+43);p.maxMp+=5;p.mp=Math.min(p.maxMp,p.mp+26);p.atk+=2.4;p.spd=Math.min(340,p.spd+2);g.bonus.magnet=Math.min(70,g.bonus.magnet+2);banner('✦ LEVEL '+g.level+' · 마력이 강해집니다',2.2);burst(p.x,p.y,24,'#ffe1a8',130);sound(810,.22,'sine',.075);}
function nextStage(){if(g.stage===3){victory();return}g.stage++;g.stageTime=0;g.stageKills=0;g.bossMade=false;g.boss=null;g.p.hp=Math.min(g.p.maxHp,g.p.hp+g.p.maxHp*.4);g.p.mp=g.p.maxMp;enemies=enemies.filter(e=>!e.boss&&Math.random()<.22);enShots=[];persist();$('screenFade').style.opacity='.9';setTimeout(()=>$('screenFade').style.opacity='0',430);banner(stages[g.stage].short+' · '+stages[g.stage].caption,3.5);sound(540,.6,'triangle',.1);updateUI(true)}
function collect(d){g.inv[d.name]=(g.inv[d.name]||0)+1;g.score+=3;if(g.inv[d.name]===1||g.inv[d.name]%5===0)showToast('✦ '+items[d.name].name+' × '+g.inv[d.name]);sound(540,.06,'sine',.012);}
function canCraft(name){return Object.entries(spells[name].need).every(([n,v])=>g.inv[n]>=v)}
function craft(name){if(!g||!spells[name]||g.unlocked[name])return;if(!canCraft(name)){showToast('재료가 부족합니다');return}for(const [n,v]of Object.entries(spells[name].need))g.inv[n]-=v;g.unlocked[name]=true;g.score+=200;g.p.mp=g.p.maxMp;burst(g.p.x,g.p.y,90,'#eabdff',250);effects.push({x:g.p.x,y:g.p.y,t:0,duration:1.1,kind:'moon',radius:170});toneBurst();sound(730,.5,'triangle',.1);showToast('✦ '+spells[name].name+' 연성 완료!');persist();openCraft();updateUI(true)}
function fireBasic(){const p=g.p;let target=null,range=650,near=1e9;for(const e of enemies){if(e.dead)continue;const d=dist(p,e);if(d<near&&d<range){target=e;near=d}}if(!target)return false;
 const angle=Math.atan2(target.y-p.y,target.x-p.x);shots.push({x:p.x,y:p.y-18,vx:Math.cos(angle)*800,vy:Math.sin(angle)*800,damage:p.atk,life:1,hit:[],type:'bolt',radius:12});p.facing=target.x>=p.x?1:-1;p.attack=.24;for(let i=0;i<3;i++)particles.push({x:p.x,y:p.y-22,vx:Math.cos(angle)*rnd(50,130),vy:Math.sin(angle)*rnd(50,130),life:.25,max:.25,r:rnd(2,6),color:'#8fd9ff'});sound(570,.07,'sine',.016);return true}
function cast(name,manual=false){if(!g||mode!=='running')return false;const def=spells[name];if(!g.unlocked[name]){if(manual)openCraft();return false}if(g.cd[name]>0){if(manual)showToast('마법이 재충전 중입니다');return false}if(g.p.mp<def.mana){if(manual)showToast('마력이 부족합니다');return false}
 g.p.mp-=def.mana;g.cd[name]=def.cd;g.p.attack=.4;const p=g.p;
 if(name==='frost'){
  effects.push({kind:'frost',x:p.x,y:p.y,t:0,duration:.85,radius:250});for(const e of enemies){if(e.dead||dist(p,e)>270)continue;e.slow=3.8;hurtEnemy(e,p.atk*2.9,true)}burst(p.x,p.y,30,'#98e7ff',250);sound(410,.35,'triangle',.08)
 }else if(name==='arc'){
  const chain=enemies.filter(e=>!e.dead).sort((a,b)=>dist(p,a)-dist(p,b)).slice(0,7),nodes=[{x:p.x,y:p.y}];for(const e of chain){if(dist(nodes[nodes.length-1],e)>610)break;nodes.push({x:e.x,y:e.y});hurtEnemy(e,p.atk*3.8,true);e.stun=.45}if(nodes.length>1){effects.push({kind:'chain',nodes,t:0,duration:.43});burst(p.x,p.y,12,'#c9a1ff',140);sound(890,.27,'sawtooth',.065)}
 }else if(name==='meteor'){
  const target=enemies.filter(e=>!e.dead).sort((a,b)=>dist(p,a)-dist(p,b))[0]||{x:p.x+200*p.facing,y:p.y};effects.push({kind:'meteor',x:target.x,y:target.y,t:0,duration:1.2,radius:195,hit:false});showToast('☄ 운석 낙하!');sound(190,.63,'sawtooth',.09)
 }else if(name==='moon'){
  effects.push({kind:'moon',x:p.x,y:p.y,t:0,duration:1.4,radius:Math.max(view.worldW,view.worldH)*.9});enemies.filter(e=>!e.dead&&dist(e,p)<1100).forEach(e=>hurtEnemy(e,p.atk*9,true));burst(p.x,p.y,90,'#f5a2f7',310);toneBurst();shake=15;showToast('☾ 월식의 대마법!');sound(310,.85,'triangle',.11)
 }
 updateUI(true);return true}
function burst(x,y,count,color,speed=160){const n=Math.min(count,Math.max(0,230-particles.length));for(let i=0;i<n;i++){const a=rnd(0,TAU),v=rnd(speed*.1,speed);particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rnd(.2,.78),max:.8,r:rnd(1.5,5),color})}}
function victory(){mode='won';g.ended=true;updateBest();try{localStorage.removeItem(key)}catch(_){};clearControl();sound(1020,1,'triangle',.12);openResult(true)}
function lose(){mode='over';g.ended=true;updateBest();try{localStorage.removeItem(key)}catch(_){};clearControl();sound(165,.85,'sawtooth',.055);openResult(false)}
function update(dt){if(!g)return;g.comboTimer=Math.max(0,g.comboTimer-dt);if(g.comboTimer<=0)g.combo=0;g.time+=dt;g.stageTime+=dt;autosave+=dt;accUI+=dt;
 const p=g.p;for(const s in g.cd)g.cd[s]=Math.max(0,g.cd[s]-dt);p.attack=Math.max(0,p.attack-dt);p.invuln=Math.max(0,p.invuln-dt);g.shotCd-=dt;p.hp=Math.min(p.maxHp,p.hp+dt*.8);p.mp=Math.min(p.maxMp,p.mp+dt*(5.4+g.level*.13));
 // Unified pointer gesture: touch = relative joystick, mouse = hold & follow cursor.
 let dx=0,dy=0;
 if(mouse.down){if(mouse.kind==='touch'||mouse.kind==='pen'){dx=mouse.x-mouse.sx;dy=mouse.y-mouse.sy;const m=Math.hypot(dx,dy);if(m>8){dx/=Math.max(42,m);dy/=Math.max(42,m)}else dx=dy=0;}else{const tx=mouse.x/view.scale+view.cx,ty=mouse.y/view.scale+view.cy;dx=tx-p.x;dy=ty-p.y;const m=Math.hypot(dx,dy);if(m>20){dx/=m;dy/=m}else dx=dy=0}}
 if(buttons.has('a')||buttons.has('arrowleft'))dx-=1;if(buttons.has('d')||buttons.has('arrowright'))dx+=1;if(buttons.has('w')||buttons.has('arrowup'))dy-=1;if(buttons.has('s')||buttons.has('arrowdown'))dy+=1;
 const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m}if(m>.05){p.x=clamp(p.x+dx*p.spd*dt,38,W-38);p.y=clamp(p.y+dy*p.spd*dt,38,H-38);if(Math.abs(dx)>.2)p.facing=dx>0?1:-1}
 const attacking=(mouse.down||settings.auto||buttons.has(' ')||buttons.size>0);
 if(attacking&&g.shotCd<=0){const successful=fireBasic();g.shotCd=successful?.22:0.08;}
 if(attacking&&g.autoCast){for(const k of ['frost','arc','meteor','moon'])if(g.unlocked[k]&&g.cd[k]===0&&g.p.mp>=spells[k].mana&&enemies.some(e=>!e.dead&&dist(e,p)<(k==='meteor'?650:270)))cast(k,false)}
 spawnMobs(dt);if(!g.bossMade&&(g.stageTime>(g.stage===3?54:43)||g.stageKills>=(25+g.stage*11)))spawnBoss();
 for(const e of enemies){if(e.dead)continue;e.t+=dt;e.attack-=dt;e.hit=Math.max(0,e.hit-dt);e.stun=Math.max(0,e.stun-dt);e.slow=Math.max(0,e.slow-dt);
  const len=dist(p,e)||1,dirx=(p.x-e.x)/len,diry=(p.y-e.y)/len;
  if(e.stun<=0){const sl=e.slow>0?.43:1;const wobble=e.type==='bat'||e.type==='wisp'?Math.sin(e.t*5+e.id)*.43:0;e.x=clamp(e.x+(dirx+(-diry)*wobble)*e.spd*dt*sl,25,W-25);e.y=clamp(e.y+(diry+dirx*wobble)*e.spd*dt*sl,25,H-25);}
  if(len<e.radius+22&&p.invuln<=0){p.hp-=e.damage;p.invuln=.48;shake=Math.min(11,shake+3.7);burst(p.x,p.y,12,'#ff8caa',85);numbers.push({x:p.x,y:p.y-50,txt:'-'+Math.ceil(e.damage),color:'#ff97ae',life:.75});sound(160,.12,'sawtooth',.038);if(p.hp<=0){p.hp=0;lose();return}}
  if((e.type==='wisp'||e.type==='shadow'||e.boss)&&e.attack<=0&&len<490&&len>105){e.attack=e.boss?1.45:2.8;const speed=e.boss?320:230;enShots.push({x:e.x,y:e.y-15,vx:dirx*speed,vy:diry*speed,life:2.5,r:e.boss?14:9,damage:e.damage*.62,color:e.boss?'#f79ae5':'#bc9dfa'})}
 }
 for(const sh of shots){sh.x+=sh.vx*dt;sh.y+=sh.vy*dt;sh.life-=dt;for(const e of enemies){if(e.dead||sh.hit.includes(e.id)||Math.hypot(sh.x-e.x,sh.y-e.y)>e.radius+sh.radius)continue;sh.hit.push(e.id);hurtEnemy(e,sh.damage,false);burst(sh.x,sh.y,9,'#8ddcff',90);sh.life=0;break}}
 for(const sh of enShots){sh.x+=sh.vx*dt;sh.y+=sh.vy*dt;sh.life-=dt;if(p.invuln<=0&&dist(sh,p)<sh.r+19){p.hp=Math.max(0,p.hp-sh.damage);p.invuln=.48;sh.life=0;burst(sh.x,sh.y,10,sh.color,110);shake+=3;sound(190,.14,'sawtooth',.045);if(p.hp<=0){lose();return}}}
 for(const d of drops){d.t+=dt;const radius=95+g.bonus.magnet;const dd=dist(d,p);if(dd<radius*2.1){const pull=clamp((radius*2.1-dd)/radius,.2,2.8)*dt*280;d.x+=(p.x-d.x)/Math.max(dd,1)*pull;d.y+=(p.y-d.y)/Math.max(dd,1)*pull;}if(dd<35){d.used=true;collect(d)}}
 for(const pa of particles){pa.x+=pa.vx*dt;pa.y+=pa.vy*dt;pa.vx*=Math.pow(.95,dt*60);pa.vy*=Math.pow(.95,dt*60);pa.life-=dt}
 for(const fx of effects){fx.t+=dt;if(fx.kind==='meteor'&&!fx.hit&&fx.t>=.62){fx.hit=true;shake=14;toneBurst();burst(fx.x,fx.y,65,'#ffad6d',220);for(const e of enemies)if(!e.dead&&Math.hypot(e.x-fx.x,e.y-fx.y)<195)hurtEnemy(e,p.atk*7.5,true);sound(100,.47,'sawtooth',.095)}}
 for(const n of numbers){n.y-=40*dt;n.life-=dt}
 enemies=enemies.filter(e=>!e.dead&&dist(e,p)<1750);shots=shots.filter(s=>s.life>0&&s.x>0&&s.x<W&&s.y>0&&s.y<H);enShots=enShots.filter(s=>s.life>0);drops=drops.filter(d=>!d.used&&d.t<70);particles=particles.filter(p=>p.life>0);effects=effects.filter(fx=>fx.t<fx.duration);numbers=numbers.filter(n=>n.life>0);shake*=Math.pow(.84,dt*60);
 if(bannerTimer>0){bannerTimer-=dt;if(bannerTimer<=0)$('banner').classList.add('hidden')}
 if(accUI>.11){accUI=0;updateUI()}
 if(autosave>9){persist();autosave=0}
}
function resize(){view.w=innerWidth;view.h=innerHeight;view.dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(view.w*view.dpr);canvas.height=Math.round(view.h*view.dpr);view.scale=clamp(Math.min(view.w/870,view.h/610)*1.05,.75,1.5);view.worldW=view.w/view.scale;view.worldH=view.h/view.scale;ctx.imageSmoothingEnabled=true}
function drawImage(id,x,y,w,h,opacity=1){const im=img[id];if(!im||!im.complete||!im.naturalWidth)return;ctx.globalAlpha=opacity;ctx.drawImage(im,x,y,w,h);ctx.globalAlpha=1}
function toScreen(x,y){return {x:(x-view.cx)*view.scale,y:(y-view.cy)*view.scale}}
function worldSetup(){const p=g?.p||{x:W/2,y:H/2};view.cx=clamp(p.x-view.worldW/2,0,Math.max(0,W-view.worldW));view.cy=clamp(p.y-view.worldH/2,0,Math.max(0,H-view.worldH));ctx.save();ctx.translate(-view.cx*view.scale,-view.cy*view.scale);ctx.scale(view.scale,view.scale)}
function circle(x,y,r,color){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=color;ctx.fill()}
function shadow(x,y,r,alpha=.3){ctx.fillStyle=`rgba(5,5,18,${alpha})`;ctx.beginPath();ctx.ellipse(x,y+13,r,r*.36,0,0,TAU);ctx.fill()}
function render(t){ctx.setTransform(view.dpr,0,0,view.dpr,0,0);ctx.clearRect(0,0,view.w,view.h);if(!g){ctx.fillStyle='#0d0f1d';ctx.fillRect(0,0,view.w,view.h);return}
 worldSetup();const s=stages[g.stage],bg=img['bg_'+s.bg];
 if(bg?.naturalWidth)ctx.drawImage(bg,0,0,W,H);else{ctx.fillStyle='#233b3d';ctx.fillRect(0,0,W,H)}
 // Animated breathing lights and magical glow on scene
 ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<10;i++){const xx=(i*347+140)%W,yy=(i*273+80)%H;const r=40+Math.sin(t*.6+i)*12;const gr=ctx.createRadialGradient(xx,yy,0,xx,yy,r);gr.addColorStop(0,s.tint+'48');gr.addColorStop(1,s.tint+'00');ctx.fillStyle=gr;ctx.fillRect(xx-r,yy-r,r*2,r*2)}ctx.restore();
 // World decor on top of background, deterministic glints
 for(let i=0;i<110;i++){const x=(i*319+207)%W,y=(i*227+437)%H;if(x<view.cx-30||x>view.cx+view.worldW+30||y<view.cy-30||y>view.cy+view.worldH+30)continue;const rad=1+Math.sin(t*1.65+i)*.9;circle(x,y,rad,s.tint+'99')}
 // Pickups and enemies are sorted for a painterly 2.5d scene
 for(const d of drops){if(d.x<view.cx-60||d.x>view.cx+view.worldW+60)continue;shadow(d.x,d.y,13,.21);drawImage('item_'+d.name,d.x-21,d.y-26+Math.sin(t*4+d.vy)*5,42,42);circle(d.x,d.y-17+Math.sin(t*4+d.vy)*5,2,'#fffbd0bb')}
 const sorted=enemies.filter(e=>!e.dead&&e.x>view.cx-100&&e.x<view.cx+view.worldW+100&&e.y>view.cy-100&&e.y<view.cy+view.worldH+100).concat([{player:true,y:g.p.y}]).sort((a,b)=>a.y-b.y);
 for(const e of sorted){if(e.player){drawHero(t);continue}drawEnemy(e,t)}
 for(const sh of shots){ctx.save();ctx.translate(sh.x,sh.y);ctx.rotate(Math.atan2(sh.vy,sh.vx));ctx.shadowColor='#9dd8ff';ctx.shadowBlur=20;drawImage('fx_bolt_'+(Math.floor(t*28)%8),-27,-27,54,54,.82);circle(0,0,9,'#b7e8ff');ctx.beginPath();ctx.moveTo(-26,0);ctx.lineTo(6,-7);ctx.lineTo(15,0);ctx.lineTo(6,7);ctx.closePath();ctx.fillStyle='#6eb9ff';ctx.fill();ctx.restore()}
 for(const sh of enShots){ctx.shadowColor=sh.color;ctx.shadowBlur=15;circle(sh.x,sh.y,sh.r,sh.color);circle(sh.x,sh.y,sh.r*.42,'white');ctx.shadowBlur=0}
 for(const fx of effects)drawEffect(fx,t);
 ctx.save();ctx.globalCompositeOperation='lighter';for(const pa of particles){ctx.globalAlpha=clamp(pa.life/pa.max,0,1);ctx.shadowColor=pa.color;ctx.shadowBlur=10;circle(pa.x,pa.y,pa.r,pa.color)}ctx.restore();ctx.globalAlpha=1;
 ctx.font='900 20px system-ui';ctx.textAlign='center';ctx.lineWidth=3;for(const n of numbers){ctx.globalAlpha=clamp(n.life/.7,0,1);ctx.strokeStyle='#130b22';ctx.strokeText(n.txt,n.x,n.y);ctx.fillStyle=n.color;ctx.fillText(n.txt,n.x,n.y)}ctx.globalAlpha=1;
 ctx.restore();
 // screen-specific vignette and touch status
 const vign=ctx.createRadialGradient(view.w/2,view.h/2,view.w*.15,view.w/2,view.h/2,Math.max(view.w,view.h)*.68);vign.addColorStop(0,'#08091600');vign.addColorStop(1,'#03020e91');ctx.fillStyle=vign;ctx.fillRect(0,0,view.w,view.h);
 if(mode==='paused'){ctx.fillStyle='#00000055';ctx.fillRect(0,0,view.w,view.h)}
}
function drawHero(t){const p=g.p;shadow(p.x,p.y,32,.45);ctx.save();if(p.invuln>0&&Math.floor(t*18)%2===0)ctx.globalAlpha=.56;ctx.translate(p.x,p.y);if(p.facing<0)ctx.scale(-1,1);
 const moving=(mouse.down&&(mouse.kind==='mouse'||Math.hypot(mouse.x-mouse.sx,mouse.y-mouse.sy)>10))||[...buttons].some(k=>k!==' ');
 const attacking=p.attack>0;
 // Hand-picked complete-pose frames. No sliced legs or two sprites in one frame.
 const idles=[0,0,1,0,1,0], runs=[2,3,4,3,2,5], blasts=[8,12,15,8];
 const sequence=attacking?blasts:moving?runs:idles;
 const speed=attacking?16:moving?10:3.5;
 const index=sequence[Math.floor(t*speed)%sequence.length];
 if(settings.skin==='chibi'){
  const ci=attacking?[24,25,26,27][Math.floor(t*13)%4]:moving?[12,13,14,15,16][Math.floor(t*11)%5]:[0,1,2,3,4,5][Math.floor(t*3)%6];
  drawImage('chibi'+ci,-70,-141+(moving?Math.sin(t*20)*2:Math.sin(t*3)*3),140,165);
 }else{
  const w=attacking?184:154,h=attacking?185:184;
  drawImage('hero'+index,-w/2,17-h+(moving?Math.sin(t*19)*2:Math.sin(t*2)*3),w,h);
 }
 ctx.restore();ctx.save();ctx.globalCompositeOperation='screen';if(g.unlocked.moon){ctx.strokeStyle='#d66bff66';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y+11,48+Math.sin(t*3)*5,19,0,0,TAU);ctx.stroke()}if(p.attack>.06){circle(p.x+p.facing*28,p.y-36,10,'#98d4ff66')}ctx.restore()}
function drawEnemy(e,t){shadow(e.x,e.y,e.radius*.82,e.boss?.5:.29);ctx.save();ctx.translate(e.x,e.y);const bounce=Math.sin(e.t*(e.boss?2:6)+e.id)*4;if(e.type==='bat'||e.type==='wisp')ctx.translate(0,Math.sin(e.t*4+e.id)*14);
 if(e.x<g.p.x)ctx.scale(-1,1);
 const scale=e.boss?2.05:({golem:1.18,treant:1.16,wolf:1.05}[e.type]||.9);ctx.scale(scale*(1+Math.sin(e.t*7)*.026),scale*(1-Math.sin(e.t*7)*.026));
 if(e.hit>0)ctx.filter='brightness(2.5)';drawImage('enemy_'+e.type,-65,-82+bounce,130,134);ctx.filter='none';ctx.restore();if(e.boss){ctx.fillStyle='#050314bf';ctx.fillRect(e.x-70,e.y-85,140,8);ctx.fillStyle='#f3abc4';ctx.fillRect(e.x-70,e.y-85,140*clamp(e.hp/e.maxHp,0,1),8);ctx.strokeStyle='#fde7e588';ctx.strokeRect(e.x-70,e.y-85,140,8)}else if(e.hit>0){ctx.fillStyle='#100a1fb0';ctx.fillRect(e.x-25,e.y-56,50,5);ctx.fillStyle='#f284cb';ctx.fillRect(e.x-25,e.y-56,50*clamp(e.hp/e.maxHp,0,1),5)}}
function drawEffect(f,t){const progress=clamp(f.t/f.duration,0,1);if(f.kind==='chain'){for(let i=1;i<f.nodes.length;i++){const a=f.nodes[i-1],b=f.nodes[i];ctx.save();ctx.strokeStyle='#d4acff';ctx.lineWidth=(1-progress)*12+2;ctx.shadowColor='#aa80ff';ctx.shadowBlur=23;ctx.beginPath();ctx.moveTo(a.x,a.y);let ox=(b.x-a.x)/5,oy=(b.y-a.y)/5;for(let j=1;j<5;j++)ctx.lineTo(a.x+ox*j+rnd(-12,12),a.y+oy*j+rnd(-12,12));ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore()}return}
 ctx.save();ctx.globalCompositeOperation='screen';let radius=f.radius*(f.kind==='meteor'?Math.max(.1,(progress-.50)*1.5):progress*.9+.15),alpha=1-progress;
 if(f.kind==='meteor'&&!f.hit){radius=55+f.t*16;ctx.strokeStyle=`rgba(255,139,89,${.5+progress*.35})`;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(f.x,f.y,radius*1.7,radius*.75,0,0,TAU);ctx.stroke();ctx.fillStyle='rgba(255,135,55,.23)';ctx.beginPath();ctx.moveTo(f.x+110,f.y-390*(1-progress));ctx.lineTo(f.x-26,f.y);ctx.lineTo(f.x+26,f.y);ctx.closePath();ctx.fill();}
 else {ctx.globalAlpha=alpha*.9;ctx.strokeStyle=f.kind==='frost'?'#a4ebff':f.kind==='moon'?'#fa9ff1':'#ffb173';ctx.lineWidth=7*(1-progress)+1;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=30;ctx.beginPath();ctx.ellipse(f.x,f.y,radius,radius*.65,0,0,TAU);ctx.stroke();for(let i=0;i<6;i++){const a=i*TAU/6+progress*1.2;const x=f.x+Math.cos(a)*radius*.75,y=f.y+Math.sin(a)*radius*.45;drawImage('fx_'+(f.kind==='moon'?'moon':f.kind==='frost'?'frost':'meteor')+'_'+Math.min(7,Math.floor(progress*8)),x-54,y-54,108,108,alpha)} }
 ctx.restore()}
function timeLabel(sec){const m=Math.floor(sec/60);return String(m).padStart(2,'0')+':'+String(Math.floor(sec%60)).padStart(2,'0')}
function updateUI(force=false){if(!g)return;const p=g.p;
 $('hpFill').style.width=(100*p.hp/p.maxHp).toFixed(1)+'%';$('mpFill').style.width=(100*p.mp/p.maxMp).toFixed(1)+'%';$('xpFill').style.width=(100*g.xp/g.xpNext).toFixed(1)+'%';
 $('hpText').textContent=Math.ceil(p.hp)+' / '+Math.round(p.maxHp);$('mpText').textContent=Math.floor(p.mp)+' / '+Math.round(p.maxMp);$('levelText').textContent='Lv. '+g.level;
 $('stageName').textContent=stages[g.stage].short;$('clock').textContent=timeLabel(g.time);$('killCount').textContent=g.kills;const progress=$('stageProgress');if(progress){const limit=g.stage===3?54:43;progress.style.width=(g.bossMade?100:Math.min(100,100*Math.max(g.stageTime/limit,g.stageKills/(25+g.stage*11)))).toFixed(1)+'%';}const cb=$('comboBadge');if(cb){cb.classList.toggle('hidden',g.combo<3);cb.textContent=g.combo>=3?'✦ '+g.combo+' COMBO':'';}
 $('bossBar').classList.toggle('hidden',!g.boss||g.boss.dead);if(g.boss&&!g.boss.dead){$('bossName').textContent=stages[g.stage].boss;$('bossFill').style.width=100*clamp(g.boss.hp/g.boss.maxHp,0,1)+'%'}
 const shown=Object.entries(g.inv).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]).slice(0,7);
 const strip=$('lootStrip');const markup=shown.map(([id,n])=>`<span class="loot-chip"><img src="./assets/items/${id}.webp" alt=""/>${n}</span>`).join('');if(strip.innerHTML!==markup)strip.innerHTML=markup;
 const available=Object.keys(spells).filter(k=>!g.unlocked[k]&&canCraft(k)).length;$('craftCount').textContent=available;
 for(const k of Object.keys(spells)){const b=$('skill'+k[0].toUpperCase()+k.slice(1));if(!b)continue;b.classList.toggle('locked',!g.unlocked[k]);const small=b.querySelector('small');small.textContent=!g.unlocked[k]?'잠금':g.cd[k]>.1?Math.ceil(g.cd[k])+'s':g.p.mp<spells[k].mana?'MP':''}
}
let modalReturn='menu';
function openModal(type){modalType=type;modalReturn=mode==='running'?'running':mode==='paused'?'running':mode;clearControl();if(mode==='running')mode='paused';$('modal').classList.remove('hidden');$('modalClose').classList.toggle('hidden',type==='result');}
function closeModal(){if(modalType==='result'){returnMenu();return}$('modal').classList.add('hidden');if(modalReturn==='running'&&g){mode='running';canvas.focus()}else if(!g){mode='menu'}modalType=''}
function openCraft(){openModal('craft');$('modalEyebrow').textContent='THE ARCANE ATELIER';$('modalTitle').textContent='마법 연성실';
 let html='<p class="guide-section">사냥하며 얻은 재료로 고위 마법을 해금하세요. 해금한 마법은 전투 중 <b>자동 시전</b>되며, 오른쪽의 마법 버튼으로 직접 발동할 수도 있습니다.</p><div class="recipe-grid">';
 for(const [id,v]of Object.entries(spells)){const unlocked=g.unlocked[id],can=canCraft(id);html+=`<article class="recipe-card"><div class="recipe-header"><div class="recipe-glyph">${v.glyph}</div><div><h3>${v.name}</h3><p>마력 ${v.mana} · 재사용 ${v.cd}초</p></div></div><p class="recipe-detail">${v.desc}</p><div class="need-row">${Object.entries(v.need).map(([name,n])=>`<span class="need ${g.inv[name]<n&&!unlocked?'missing':''}"><img src="./assets/items/${name}.webp" alt=""/>${items[name].name} ${unlocked?'✓':g.inv[name]+'/'+n}</span>`).join('')}</div><button data-craft="${id}" ${unlocked||!can?'disabled':''}>${unlocked?'✓ 연성 완료':can?'✦ 마법 연성':'재료 사냥이 필요합니다'}</button></article>`}
 html+='</div><p class="guide-section" style="margin:15px 0 0;font-size:12px;">TIP · 최초에는 자동으로 마력탄을 사용합니다. 보스를 처치하면 수호자 핵과 희귀 월광 정수를 얻습니다.</p>';
 $('modalBody').innerHTML=html;}
function openGuide(){openModal('guide');$('modalEyebrow').textContent='HUNTER HANDBOOK';$('modalTitle').textContent='게임 방법 · 설정';$('modalBody').innerHTML=`
 <div class="guide-section"><h3>✦ 한 손으로 움직이고 마법을 쏘세요</h3><p><b>스마트폰:</b> 화면 빈 곳을 손가락으로 길게 누르고 드래그하면 이동합니다. 누르고 있는 동안 가까운 적에게 자동 발사합니다. 손을 떼면 이동·발사가 멈춥니다.</p><p><b>PC:</b> 필드에 마우스를 누르고 있으면 커서 쪽으로 이동하며 자동 공격합니다. <kbd>WASD</kbd> / <kbd>방향키</kbd> 이동, <kbd>Space</kbd> 자동 공격. <kbd>1</kbd> ~ <kbd>4</kbd> 고위 마법, <kbd>C</kbd> 조합, <kbd>Esc</kbd> 일시정지입니다.</p></div>
 <div class="guide-section"><h3>❖ 사냥 → 수집 → 연성</h3><p>적을 잡으면 달빛 잎·별 수정·버섯·깃털 등 재료가 떨어집니다. 가까이 가면 자동 수집합니다. <b>조합</b>을 눌러 서리 폭풍, 연쇄 번개, 붉은 운석, 월식 대마법을 차례로 해금하세요. 보스는 희귀 재료를 줍니다.</p><p>스테이지마다 보스 한 명이 등장합니다. 수호자를 쓰러뜨리면 다음 지역으로 진입하며 네 번째 보스를 무찌르면 승리합니다. 레벨 상승 시 생명력과 공격력이 강화됩니다.</p></div>
 <div class="guide-section"><h3>⚙ 플레이 설정</h3>
  <div class="option-row"><span>효과음</span><button data-setting="audio">${settings.audio?'켜짐':'꺼짐'}</button></div>
  <div class="option-row"><span>손을 떼도 자동 공격</span><button data-setting="auto">${settings.auto?'켜짐':'꺼짐'}</button></div>
  <div class="option-row"><span>스프라이트 화풍</span><button data-setting="skin">${settings.skin==='classic'?'우아한 마녀':'꼬마 마녀'}</button></div>
  <div class="option-row"><span>화면 흔들림</span><button data-setting="motion">${settings.motion?'켜짐':'꺼짐'}</button></div>
 </div><p style="font-size:12px;line-height:1.7;color:#cbbac7">GitHub Pages 같은 HTTPS 사이트에 올리면 PWA로 설치할 수 있습니다. 게임은 브라우저에 자동 저장되며, 최초 1회 온라인에서 연 다음 오프라인 재실행이 가능합니다. iPhone: Safari 공유 메뉴 → 홈 화면에 추가.</p>`;}
function openPause(){if(!g||mode!=='running')return;openModal('pause');$('modalEyebrow').textContent='THE HUNT IS RESTING';$('modalTitle').textContent='일시정지';$('modalBody').innerHTML=`<p class="guide-section">${stages[g.stage].short} · ${timeLabel(g.time)} · ${g.kills}마리 처치<br/>현재 진행 상황을 브라우저에 저장했습니다.</p><div class="dialog-actions"><button id="resumeBtn" class="primary-btn">계속 사냥</button><button id="settingsBtn" class="secondary-btn">게임 방법 · 설정</button><button id="toMenuBtn" class="secondary-btn">타이틀로</button></div>`;persist()}
function openResult(won){openModal('result');$('modalEyebrow').textContent=won?'THE MOON IS YOURS':'A HUNTER WILL RETURN';$('modalTitle').textContent=won?'✦ 네 가지 봉인을 해방했습니다':'달빛 아래 쓰러졌습니다';$('modalBody').innerHTML=`<p class="guide-section">${won?'월식의 여왕을 물리치고 달빛을 되찾았습니다. 다음 사냥에서 또 다른 마법의 길을 발견하세요.':'사냥의 기록은 남습니다. 재료를 조합하고 손가락을 움직여 다시 도전하세요.'}</p><div class="result-stats"><div>점수<strong>${g.score.toLocaleString()}</strong></div><div>처치<strong>${g.kills}</strong></div><div>레벨<strong>${g.level}</strong></div></div><p style="color:#d9b6e1;font-size:13px;">최종 지역: ${stages[g.stage].short} · ${timeLabel(g.time)}</p><div class="dialog-actions"><button id="retryBtn" class="primary-btn">다시 사냥</button><button id="resultMenuBtn" class="secondary-btn">타이틀로</button></div>`;}
function clearControl(){mouse.down=false;mouse.id=null;$('joy').classList.add('hidden');buttons.clear()}
function setJoy(x,y){$('joy').style.left=x+'px';$('joy').style.top=y+'px';$('joy').classList.remove('hidden');$('joyKnob').style.left='50%';$('joyKnob').style.top='50%'}
function beginPointer(ev){if(mode!=='running'||mouse.down||ev.button!==0)return;ev.preventDefault();initAudio();mouse={down:true,id:ev.pointerId,x:ev.clientX,y:ev.clientY,sx:ev.clientX,sy:ev.clientY,kind:ev.pointerType||'mouse'};try{canvas.setPointerCapture(ev.pointerId)}catch(_){}if(mouse.kind!=='mouse')setJoy(mouse.sx,mouse.sy)}
function movePointer(ev){if(!mouse.down||ev.pointerId!==mouse.id)return;ev.preventDefault();mouse.x=ev.clientX;mouse.y=ev.clientY;if(mouse.kind!=='mouse'){const dx=mouse.x-mouse.sx,dy=mouse.y-mouse.sy,m=Math.hypot(dx,dy),r=Math.min(m,36),ang=Math.atan2(dy,dx);$('joyKnob').style.left=`calc(50% + ${Math.cos(ang)*r}px)`;$('joyKnob').style.top=`calc(50% + ${Math.sin(ang)*r}px)`}}
function endPointer(ev){if(!mouse.down||ev.pointerId!==mouse.id)return;clearControl()}
canvas.addEventListener('pointerdown',beginPointer);canvas.addEventListener('pointermove',movePointer);canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);canvas.addEventListener('lostpointercapture',endPointer);canvas.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('blur',()=>{clearControl();if(mode==='running')openPause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='running')openPause()});
window.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();if([' ','arrowleft','arrowright','arrowup','arrowdown'].includes(k))e.preventDefault();
 if(e.repeat&&['escape','c','1','2','3','4'].includes(k))return;
 if(k==='escape'){if(!$('modal').classList.contains('hidden'))closeModal();else if(mode==='running')openPause();return}
 if(mode!=='running')return;
 if(k==='c'){openCraft();return}
 if(['1','2','3','4'].includes(k)){initAudio();cast(['frost','arc','meteor','moon'][+k-1],true);return}
 if('wasd'.includes(k)||k.startsWith('arrow')||k===' ')buttons.add(k);
});window.addEventListener('keyup',e=>buttons.delete(e.key.toLowerCase()));
$('startBtn').addEventListener('click',()=>{initAudio();try{localStorage.removeItem(key)}catch(_){}start(false)});
$('continueBtn').addEventListener('click',()=>{initAudio();start(true)});
$('guideBtn').addEventListener('click',openGuide);
$('pauseBtn').addEventListener('click',openPause);
$('craftBtn').addEventListener('click',openCraft);
for(const b of document.querySelectorAll('[data-spell]'))b.addEventListener('click',()=>{initAudio();cast(b.dataset.spell,true)});
$('modalClose').addEventListener('click',closeModal);
$('modalBody').addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;const craftKey=button.dataset.craft;if(craftKey){craft(craftKey);return}const set=button.dataset.setting;if(set){if(set==='skin')settings.skin=settings.skin==='classic'?'chibi':'classic';else settings[set]=!settings[set];saveSettings();openGuide();return}const id=button.id;
 if(id==='resumeBtn'){closeModal()}if(id==='settingsBtn'){openGuide()}if(id==='toMenuBtn'||id==='resultMenuBtn'){returnMenu()}if(id==='retryBtn'){initAudio();start(false)}});
$('installDismiss').addEventListener('click',()=>$('installBanner').classList.add('hidden'));
$('installBtn').addEventListener('click',async()=>{if(!deferredPrompt){showToast('브라우저 메뉴에서 홈 화면에 추가하세요');return}deferredPrompt.prompt();try{await deferredPrompt.userChoice}catch(_){}deferredPrompt=null;$('installBanner').classList.add('hidden')});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;if(mode==='menu')$('installBanner').classList.remove('hidden')});
window.addEventListener('appinstalled',()=>$('installBanner').classList.add('hidden'));
function tick(ms){const t=ms/1000,dt=Math.min(.05,Math.max(0,t-last||0));last=t;frameTime=t;try{if(mode==='running'){update(dt)}if(settings.motion&&shake>1&&g){ctx.save();const ox=rnd(-shake,shake)*.2,oy=rnd(-shake,shake)*.2;ctx.translate(ox,oy);render(t);ctx.restore()}else render(t)}catch(ex){console.error('game loop failure',ex);if(mode==='running')openPause();showToast('일시적인 오류: 새로고침 후 이어하기를 이용하세요')}requestAnimationFrame(tick)}
window.addEventListener('resize',resize);resize();refreshMenu();requestAnimationFrame(tick);
if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(err=>console.warn('offline not available',err)))}
// Hook for deterministic smoke tests and gameplay QA. Not a network API.
window.WitchHunt={state:()=>({mode,stage:g?.stage,kills:g?.kills,hp:g?.p?.hp,inventory:g?.inv,unlocked:g?.unlocked,monsters:enemies.length,assets:loaded,total,score:g?.score,combo:g?.combo})};
})();
