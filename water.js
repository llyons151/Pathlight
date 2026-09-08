// Interactive stable-fluid solver: semi-Lagrangian advection, pressure projection,
// and vorticity confinement. Colored dye is rendered through a refractive glass shader.
// Algorithm background: NVIDIA GPU Gems, chapter 38. Original implementation for Pathlight.
const atmosphere = document.querySelector('.atmosphere');
const canvas = document.createElement('canvas');
canvas.className = 'water-surface';
canvas.setAttribute('aria-hidden', 'true');
const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, preserveDrawingBuffer: true, powerPreference: 'low-power' });
if (gl) {
  try { startWater(); } catch (error) {
    canvas.remove();
    atmosphere.classList.remove('water-ready');
    console.warn('Water background unavailable; using the static light field.', error);
  }
}

function startWater() {
  const vertex = `attribute vec2 position;
    varying vec2 uv;
    void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment = `precision highp float;
    varying vec2 uv;
    uniform float time;
    uniform float aspect;
    uniform sampler2D ripples;
    uniform vec2 texel;
    float density(vec2 p){return dot(texture2D(ripples,p).rgb,vec3(.333));}
    void main(){
      vec2 p=vec2(uv.x,1.-uv.y);
      vec2 n=vec2(density(p+vec2(texel.x,0.))-density(p-vec2(texel.x,0.)),
        density(p+vec2(0.,texel.y))-density(p-vec2(0.,texel.y)));
      vec2 bent=p+n*.075;
      vec3 ink=texture2D(ripples,bent).rgb;
      ink=(ink+texture2D(ripples,bent+texel*.65).rgb+texture2D(ripples,bent-texel*.65).rgb)/3.;
      ink=pow(max(ink,vec3(0.)),vec3(.72));
      vec3 color=vec3(.76,.80,.87);
      color-=ink.r*vec3(.10,.09,.07);
      color-=ink.g*vec3(.08,.10,.08);
      color-=ink.b*vec3(.11,.10,.08);
      float thickness=length(n);
      color+=vec3(.82,.86,.92)*pow(min(1.,thickness*7.),1.6)*.045;
      color+=dot(n,vec2(-.7,-.5))*.12;
      float glow=exp(-length((p-vec2(.46,.2))*vec2(1.3,2.))*2.);
      color=mix(color,vec3(.87,.92,1.),glow*.22);
      color=mix(color,vec3(.045,.055,.20),smoothstep(.5,1.1,p.y)*.7);
      gl_FragColor=vec4(clamp(color,0.,1.),1.);
    }`;
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(['time','aspect','texel','ripples'].map(name => [name, gl.getUniformLocation(program, name)]));
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(uniforms.ripples, 0);
  const size = 144, count = size * size;
  const field = () => new Float32Array(count);
  let vx = field(), vy = field(), nextX = field(), nextY = field();
  let dye = [field(), field(), field()], nextDye = [field(), field(), field()];
  const pressure = field(), divergence = field(), curl = field();
  const pixels = new Uint8Array(count * 4);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  gl.uniform2f(uniforms.texel, 1 / size, 1 / size);
  // Begin with broad streams, so the first frame already has depth.
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    vx[i] = Math.sin(y * .07) * 12;
    vy[i] = Math.cos(x * .065) * 10;
    dye[0][i] = Math.max(0, Math.sin(x * .045 + y * .04)) * .22;
    dye[1][i] = Math.max(0, Math.cos(x * .045 - y * .035)) * .28;
    dye[2][i] = Math.max(0, Math.sin(y * .03 - x * .065)) * .2;
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, elapsed = 0, lastTime = 0, accumulator = 0, nextDrop = 1;
  let lost = false;
  const canRun = () => !lost && !reduced.matches && !document.hidden && !atmosphere.classList.contains('motion-paused');
  function disturb(x, y, dx, dy, color, radius = 8, amount = .32) {
    const cx = x * (size - 1), cy = y * (size - 1);
    const extent = Math.ceil(radius * 2);
    for (let row = Math.max(1, Math.floor(cy - extent)); row < Math.min(size - 1, cy + extent); row++) {
      for (let col = Math.max(1, Math.floor(cx - extent)); col < Math.min(size - 1, cx + extent); col++) {
        const i = row * size + col;
        const falloff = Math.exp(-((col-cx)**2+(row-cy)**2)/(radius*radius));
        vx[i] += dx * falloff; vy[i] += dy * falloff;
        dye[color][i] = Math.min(1.4, dye[color][i] + falloff * amount);
      }
    }
  }
  function sample(data, x, y) {
    x = Math.max(.5, Math.min(size - 1.5, x)); y = Math.max(.5, Math.min(size - 1.5, y));
    const ix = x | 0, iy = y | 0, fx = x - ix, fy = y - iy, i = iy * size + ix;
    return (data[i]*(1-fx)+data[i+1]*fx)*(1-fy)+(data[i+size]*(1-fx)+data[i+size+1]*fx)*fy;
  }
  function simulate() {
    const dt = 1/30;
    // Advect velocity through itself.
    for (let y=1;y<size-1;y++) for(let x=1;x<size-1;x++) {
      const i=y*size+x, px=x-vx[i]*dt, py=y-vy[i]*dt;
      nextX[i]=sample(vx,px,py)*.995; nextY[i]=sample(vy,px,py)*.995;
    }
    [vx,nextX]=[nextX,vx]; [vy,nextY]=[nextY,vy];
    // Restore small eddies lost through numerical diffusion.
    for(let y=1;y<size-1;y++) for(let x=1;x<size-1;x++) {
      const i=y*size+x; curl[i]=(vy[i+1]-vy[i-1]-vx[i+size]+vx[i-size])*.5;
    }
    for(let y=2;y<size-2;y++) for(let x=2;x<size-2;x++) {
      const i=y*size+x;
      let nx=Math.abs(curl[i+1])-Math.abs(curl[i-1]), ny=Math.abs(curl[i+size])-Math.abs(curl[i-size]);
      const length=Math.hypot(nx,ny)+.0001; nx/=length; ny/=length;
      vx[i]=Math.max(-90,Math.min(90,vx[i]+ny*curl[i]*.18));
      vy[i]=Math.max(-90,Math.min(90,vy[i]-nx*curl[i]*.18));
    }
    pressure.fill(0);
    for(let y=1;y<size-1;y++) for(let x=1;x<size-1;x++) {
      const i=y*size+x; divergence[i]=(vx[i+1]-vx[i-1]+vy[i+size]-vy[i-size])*.5;
    }
    for(let iteration=0;iteration<16;iteration++) {
      for(let y=1;y<size-1;y++) for(let x=1;x<size-1;x++) {
        const i=y*size+x; pressure[i]=(pressure[i-1]+pressure[i+1]+pressure[i-size]+pressure[i+size]-divergence[i])*.25;
      }
    }
    for(let y=1;y<size-1;y++) for(let x=1;x<size-1;x++) {
      const i=y*size+x;
      vx[i]-=(pressure[i+1]-pressure[i-1])*.5;
      vy[i]-=(pressure[i+size]-pressure[i-size])*.5;
      const px=x-vx[i]*dt,py=y-vy[i]*dt;
      for(let channel=0;channel<3;channel++) nextDye[channel][i]=sample(dye[channel],px,py)*.998;
    }
    [dye,nextDye]=[nextDye,dye];
    for(let k=0;k<size;k++) for(let channel=0;channel<3;channel++) {
      dye[channel][k]=dye[channel][size+k];
      dye[channel][(size-1)*size+k]=dye[channel][(size-2)*size+k];
      dye[channel][k*size]=dye[channel][k*size+1];
      dye[channel][k*size+size-1]=dye[channel][k*size+size-2];
    }
  }
  function render() {
    for(let i=0;i<count;i++) {
      pixels[i*4]=Math.min(255,dye[0][i]*255);
      pixels[i*4+1]=Math.min(255,dye[1][i]*255);
      pixels[i*4+2]=Math.min(255,dye[2][i]*255);
      pixels[i*4+3]=255;
    }
    gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,size,size,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    gl.uniform1f(uniforms.time,elapsed);
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
  function tick(now) {
    frame = 0;
    if (!canRun()) return;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, .05) * .3 : 0;
    lastTime = now;
    elapsed += dt;
    accumulator += dt;
    if (elapsed > nextDrop) {
      const phase = elapsed * .43;
      for(let stream=0;stream<3;stream++) {
        const angle=phase+stream*2.1;
        disturb(.5+Math.cos(angle)*.33,.28+Math.sin(angle*1.3)*.19,
          -Math.sin(angle)*30,Math.cos(angle*1.3)*26,stream,4.5,.45);
      }
      nextDrop = elapsed + .35;
    }
    while (accumulator >= 1 / 30) { simulate(); accumulator -= 1 / 30; }
    render();
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    if (canRun() && !frame) { lastTime = 0; frame = requestAnimationFrame(tick); }
    else if (!canRun() && frame) { cancelAnimationFrame(frame); frame = 0; }
  }
  function resize() {
    const width = atmosphere.clientWidth, height = atmosphere.clientHeight;
    const scale = Math.min(devicePixelRatio || 1, 1.25, Math.sqrt(1100000 / (width * height)));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(uniforms.aspect, width / height);
    render();
  }
  for(let seed=0;seed<9;seed++) {
    const angle=seed*2.4;
    disturb(.5+Math.cos(angle)*.36,.3+Math.sin(angle)*.23,-Math.sin(angle)*35,Math.cos(angle)*30,seed%3,10,.55);
  }
  for(let warmup=0;warmup<35;warmup++) simulate();
  atmosphere.append(canvas);
  resize();
  atmosphere.classList.add('water-ready');
  new ResizeObserver(resize).observe(atmosphere);
  new MutationObserver(sync).observe(atmosphere, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  let lastPointer = 0, pointerX = null, pointerY = null;
  function pointerRipple(event) {
    if (!canRun() || (event.type === 'pointermove' && performance.now() - lastPointer < 32)) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    const dx=pointerX===null?12:Math.max(-65,Math.min(65,(x-pointerX)*900));
    const dy=pointerY===null?-12:Math.max(-65,Math.min(65,(y-pointerY)*900));
    disturb(x,y,dx*.25,dy*.25,Math.floor(elapsed/3)%3,event.type==='pointerdown'?10:7,.08);
    pointerX=x; pointerY=y;
    lastPointer = performance.now();
  }
  window.addEventListener('pointermove', pointerRipple, { passive: true });
  window.addEventListener('pointerdown', pointerRipple, { passive: true });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    sync();
    atmosphere.classList.remove('water-ready');
    canvas.hidden = true;
  });
  sync();
}
