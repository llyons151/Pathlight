import { land } from './globe-land.js';
const canvas = document.querySelector('#user-globe');
const ctx = canvas.getContext('2d');
const toggle = document.querySelector('#globe-toggle');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const rad = Math.PI / 180;
let rotation = -20, paused = false, visible = true, frame = 0, last = 0, width = 1000, height = 660;
const cities = [[-74,41],[-.12,51.5],[2.35,48.85],[139.7,35.7],[103.8,1.35],[151,-34],[-122,38],[-46,-23],[18,-34],[77,28]];
const vectors = land.map(([lon,lat]) => [Math.cos(lat*rad)*Math.sin(lon*rad),Math.sin(lat*rad),Math.cos(lat*rad)*Math.cos(lon*rad)]);
function project(v, scale=1) {
 const a=rotation*rad, tilt=-12*rad;
 const x=v[0]*Math.cos(a)+v[2]*Math.sin(a), z=v[2]*Math.cos(a)-v[0]*Math.sin(a);
 const y=v[1]*Math.cos(tilt)-z*Math.sin(tilt), depth=v[1]*Math.sin(tilt)+z*Math.cos(tilt);
 const r=Math.min(width*.285,height*.405);
 return [width/2+x*r*scale,height*.49-y*r*scale,depth];
}
function vec(lon,lat) {return [Math.cos(lat*rad)*Math.sin(lon*rad),Math.sin(lat*rad),Math.cos(lat*rad)*Math.cos(lon*rad)];}
function draw(time=0) {
 ctx.clearRect(0,0,width,height);
 const r=Math.min(width*.285,height*.405), cx=width/2,cy=height*.49;
 const glow=ctx.createRadialGradient(cx,cy,r*.75,cx,cy,r*1.38);
 glow.addColorStop(0,'#c2cfff00');glow.addColorStop(.5,'#b3d0ff28');glow.addColorStop(.7,'#b3d0ff0c');glow.addColorStop(1,'#b3d0ff00');
 ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
 // Fine orbital ellipses frame the globe without enclosing it in a panel.
 for(let i=0;i<3;i++) {ctx.save();ctx.translate(cx,cy);ctx.rotate((i*38-28)*rad);ctx.beginPath();ctx.ellipse(0,0,r*1.37,r*(.34+i*.12),0,0,Math.PI*2);ctx.strokeStyle=i===0?'#edf1ff55':'#e0eaff24';ctx.lineWidth=.7;ctx.stroke();ctx.restore();}
 const sphere=ctx.createRadialGradient(cx-r*.4,cy-r*.5,r*.05,cx+r*.25,cy+r*.3,r*1.2);
 sphere.addColorStop(0,'#608fda');sphere.addColorStop(.4,'#3058a4');sphere.addColorStop(.75,'#192d68');sphere.addColorStop(1,'#0a163e');
 ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=sphere;ctx.shadowColor='#bacfff';ctx.shadowBlur=22;ctx.fill();ctx.shadowBlur=0;
 // The faint geographic graticule rotates together with the land.
 ctx.lineWidth=.5;ctx.strokeStyle='#aecbff20';
 const line=pts=>{ctx.beginPath();let pen=false;for(const v of pts){const [x,y,z]=project(v);if(z>0){if(pen)ctx.lineTo(x,y);else ctx.moveTo(x,y);pen=true;}else pen=false;}ctx.stroke();};
 for(let lat=-60;lat<=60;lat+=30)line(Array.from({length:181},(_,i)=>vec(i*2-180,lat)));
 for(let lon=-180;lon<180;lon+=30)line(Array.from({length:91},(_,i)=>vec(lon,i*2-90)));
 for(const v of vectors){const [x,y,z]=project(v);if(z<=0)continue;ctx.beginPath();ctx.arc(x,y,(.65+z*.85)*Math.max(.65,r/267),0,Math.PI*2);ctx.fillStyle=`rgba(208,232,255,${.3+z*.65})`;ctx.fill();}
 // Great-circle-like raised arcs connect the illustrative visitor locations.
 for(const [from,to] of [[0,1],[1,7],[1,3],[3,4],[7,8]]) {
  const a=vec(...cities[from]), b=vec(...cities[to]);const pts=[];
  for(let j=0;j<=60;j++){const t=j/60;const v=a.map((n,k)=>n*(1-t)+b[k]*t);const len=Math.hypot(...v);pts.push(project(v.map(n=>n/len),1+Math.sin(t*Math.PI)*.18));}
  ctx.beginPath();let pen=false;for(const [x,y,z] of pts){if(z>.04){if(pen)ctx.lineTo(x,y);else ctx.moveTo(x,y);pen=true;}else pen=false;}
  ctx.strokeStyle='#c9c4ff80';ctx.lineWidth=1;ctx.stroke();
  const dot=pts[Math.floor((time/55+from*9)%60)];if(dot[2]>.04){ctx.beginPath();ctx.arc(dot[0],dot[1],2,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();}
 }
 cities.forEach((city,i)=>{const v=vec(...city),[x,y,z]=project(v);if(z<.1)return;const tip=project(v,1.065);ctx.strokeStyle='#e8f1ffbb';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tip[0],tip[1]);ctx.stroke();ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.strokeStyle='#d9e6ff50';ctx.stroke();ctx.beginPath();ctx.arc(tip[0],tip[1],3.4,0,Math.PI*2);ctx.fillStyle=i%2?'#d8c5ff':'#c1f5ff';ctx.shadowColor='#dcf5ff';ctx.shadowBlur=12;ctx.fill();ctx.shadowBlur=0;
 // Tiny people appear at selected pins, anchored to the rotating surface.
 if(z>.45 && i%3===0){const px=tip[0],py=tip[1]-18;ctx.beginPath();ctx.arc(px,py,10,0,Math.PI*2);ctx.fillStyle='#eaf0ff';ctx.fill();ctx.fillStyle='#4f5891';ctx.beginPath();ctx.arc(px,py-3,2.7,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(px,py+5,4.5,Math.PI,Math.PI*2);ctx.fill();}
 });
 ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle='#d8eaff80';ctx.lineWidth=1;ctx.stroke();
}
function tick(time){frame=0;if(!visible||document.hidden||paused||motion.matches)return;if(last)rotation+=(time-last)*.004;last=time;draw(time);frame=requestAnimationFrame(tick);}
function sync(){cancelAnimationFrame(frame);frame=0;last=0;toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',paused?'Resume globe rotation':'Pause globe rotation');toggle.textContent=paused?'▷':'Ⅱ';toggle.hidden=motion.matches;draw();if(visible&&!document.hidden&&!paused&&!motion.matches)frame=requestAnimationFrame(tick);}
new ResizeObserver(()=>{const box=canvas.getBoundingClientRect();width=box.width;height=box.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw();}).observe(canvas);
new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();}).observe(canvas);
toggle.addEventListener('click',()=>{paused=!paused;sync();});
motion.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
function revealDemo(){if(location.hash==='#demo')document.querySelector('.product-demo').open=true;}
document.querySelectorAll('a[href="#demo"]').forEach(a=>a.addEventListener('click',()=>{document.querySelector('.product-demo').open=true;}));
window.addEventListener('hashchange',revealDemo);revealDemo();sync();
