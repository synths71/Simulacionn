// Escena: viento (flow field) + escuadrilla (flocking) + red de luz (Physarum), conectados:
//   el viento empuja a los aviones → los aviones iluminan el terreno → la red crece donde vuelan.
let field, wind = [], planes = [], enemies = [], shots = [], phys, trails, tctx, bgCanvas, vigCanvas;
const TRAIL_SCALE = 0.5;   // las estelas se dibujan a media resolución (4 veces menos píxeles)
let audioEl, avisoEl, ayudaEl, inicioEl, started = false, avisoTimer;

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  makeLayers();
  field = new FlowField();
  phys = new Physarum();
  for (let i = 0; i < N_WIND; i++) wind.push(new WindParticle());
  for (let i = 0; i < N_PLANES; i++) planes.push(new Plane(i));
  for (let i = 0; i < N_ENEMIES; i++) enemies.push(new Enemy(i));
  audioEl = document.getElementById('musica');
  avisoEl = document.getElementById('aviso');
  ayudaEl = document.getElementById('ayuda');
  inicioEl = document.getElementById('inicio');
}

// Capas que no cambian (fondo y viñeta) se dibujan UNA vez; las estelas viven a media resolución.
function makeLayers() {
  trails = createGraphics(ceil(width * TRAIL_SCALE), ceil(height * TRAIL_SCALE));
  trails.pixelDensity(1);
  tctx = trails.drawingContext;
  tctx.setTransform(TRAIL_SCALE, 0, 0, TRAIL_SCALE, 0, 0);   // así se sigue dibujando en coordenadas de pantalla
  bgCanvas = document.createElement('canvas'); bgCanvas.width = width; bgCanvas.height = height;
  drawBg();
  let c;
  vigCanvas = document.createElement('canvas'); vigCanvas.width = width; vigCanvas.height = height;
  c = vigCanvas.getContext('2d');
  const v = c.createRadialGradient(width / 2, height / 2, height * 0.35, width / 2, height / 2, height * 1.0);
  v.addColorStop(0, 'rgba(2,4,12,0)'); v.addColorStop(1, 'rgba(2,4,12,0.8)');
  c.fillStyle = v; c.fillRect(0, 0, width, height);
}

// El fondo se dibuja en su propio canvas; solo se vuelve a pintar mientras cambia la paleta.
function drawBg() {
  const c = bgCanvas.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, rgb(pal.bgTop, 1)); g.addColorStop(1, rgb(pal.bgBot, 1));
  c.fillStyle = g; c.fillRect(0, 0, width, height);
}
let palMoving = false, palFrame = 0;

function draw() {
  const dt = min(deltaTime / 1000, 0.1), dt60 = dt * 60, now = millis() / 1000;
  updateHeld(dt); easeState(dt);
  const moving = easePalette(dt);
  if (moving && ++palFrame % 3 === 0) drawBg();       // mientras cambia el color, repinta el fondo
  if (palMoving && !moving) drawBg();                 // y una última vez al terminar
  palMoving = moving;
  const ctx = drawingContext;

  // ---- simulación ----
  const wp = windParams(state.turbulencia), fp = flockParams(state);
  field.update(dt, wp);
  for (const p of wind) p.follow(field, wp, dt60);
  const foes = state.enemy > 0.3 ? enemies : [];       // los enemigos "existen" para el resto cuando ya entraron
  for (const pl of planes) pl.update(planes, fp, field, state.targets, shots, dt60, foes);
  if (state.enemy > 0.02) for (const e of enemies) e.update(enemies, planes, fp, field, dt60);
  for (const pl of planes) {                          // cada avión deja rastro y de él nacen agentes
    phys.deposit(pl.x, pl.y, 5 * (1 + 0.8 * state.pulse));
    phys.spawnAt(pl.x, pl.y, Math.round(9 * dt60), Math.atan2(pl.vy, pl.vx), 0.7);
  }
  phys.update(state, dt60);

  // objetivos: se cumplen cuando al menos 2 aviones están encima un rato; mientras tanto, disparan
  for (let i = state.targets.length - 1; i >= 0; i--) {
    const t = state.targets[i];
    let near = 0, nearest = null, nd = 600;
    for (const pl of planes) {
      const d = Math.hypot(pl.x - t.x, pl.y - t.y);
      if (d < 90) near++;
      if (d < nd) { nd = d; nearest = pl; }
    }
    t.heat = Math.max(0, t.heat + (near >= 2 ? near * dt * 0.25 : -dt * 0.3));
    t.cool -= dt;
    if (t.cool <= 0 && nearest && shots.length < MAX_SHOTS) {   // dispara al avión más cercano que ve
      shots.push(new Shot(t.x, t.y, nearest.x, nearest.y));
      t.cool = random(1.0, 1.8); t.fired = now;
    }
    if (t.heat >= 1) {
      phys.burst(t.x, t.y); phys.spawnAt(t.x, t.y, 500, 0, TWO_PI);
      state.flashes.push({ x: t.x, y: t.y, t: now });
      state.targets.splice(i, 1);
    }
  }
  if (state.enemy > 0.8) {                              // con el escuadrón enemigo presente, se disparan
    for (const e of enemies) {
      e.cool -= dt;
      if (e.cool <= 0) { const t = nearest(planes, e, 520); if (t && shots.length < MAX_SHOTS) shots.push(new Shot(e.x, e.y, t.x, t.y, 'foe')); e.cool = random(1.6, 3.2); }
    }
    for (const pl of planes) {
      pl.cool -= dt;
      if (pl.cool <= 0) { const t = nearest(enemies, pl, 480); if (t && shots.length < MAX_SHOTS) shots.push(new Shot(pl.x, pl.y, t.x, t.y, 'ally')); pl.cool = random(2, 4); }
    }
  }
  for (const s of shots) s.update(planes, foes, dt, dt60);
  shots = shots.filter((s) => s.age < s.life);

  // ---- capa de estelas: se desvanece sola ----
  tctx.globalCompositeOperation = 'destination-out';
  tctx.fillStyle = 'rgba(0,0,0,0.07)'; tctx.fillRect(0, 0, width, height);
  tctx.globalCompositeOperation = 'source-over';
  tctx.lineWidth = 1;
  drawWind(tctx, wind, state.turbulencia);
  for (const team of ['foe', 'ally']) {
    tctx.strokeStyle = team === 'foe' ? 'rgba(255,120,60,0.8)' : 'rgba(120,220,255,0.85)'; tctx.lineWidth = 2;
    tctx.beginPath();
    for (const s of shots) if (s.team === team) { tctx.moveTo(s.px, s.py); tctx.lineTo(s.x, s.y); }
    tctx.stroke();
  }
  if (state.enemy > 0.3) {                              // estela de los enemigos
    tctx.strokeStyle = 'rgba(255,100,100,0.5)'; tctx.lineWidth = 1.6; tctx.beginPath();
    for (const e of enemies) { tctx.moveTo(e.px, e.py); tctx.lineTo(e.x, e.y); }
    tctx.stroke();
  }
  tctx.strokeStyle = 'rgba(200,230,255,0.55)'; tctx.lineWidth = 1.6;
  tctx.beginPath();
  for (const pl of planes) { tctx.moveTo(pl.px, pl.py); tctx.lineTo(pl.x, pl.y); }
  tctx.stroke();

  // ---- pantalla ----
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(bgCanvas, 0, 0);

  phys.draw(ctx, state.pulse);                                    // red de luz del terreno
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(trails.elt, 0, 0, width, height);    // viento y estelas

  // objetivos
  for (const t of state.targets) {
    const r = 16 + 3 * Math.sin(now * 4);
    ctx.strokeStyle = now - t.fired < 0.15 ? 'rgba(255,200,150,1)' : 'rgba(255,100,70,0.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, TWO_PI); ctx.moveTo(t.x - r - 6, t.y); ctx.lineTo(t.x + r + 6, t.y);
    ctx.moveTo(t.x, t.y - r - 6); ctx.lineTo(t.x, t.y + r + 6); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,150,0.9)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(t.x, t.y, r + 6, -HALF_PI, -HALF_PI + TWO_PI * t.heat); ctx.stroke();
  }
  // destellos y onda del impulso
  state.flashes = state.flashes.filter((f) => now - f.t < 1.2);
  for (const f of state.flashes) {
    const k = (now - f.t) / 1.2;
    ctx.strokeStyle = `rgba(255,225,160,${1 - k})`; ctx.lineWidth = 4 * (1 - k) + 1;
    ctx.beginPath(); ctx.arc(f.x, f.y, 10 + 140 * k, 0, TWO_PI); ctx.stroke();
  }
  // cada "pum" hace latir a cada avión: una onda que sale de él y lo acompaña
  state.rings = state.rings.filter((r) => now - r.t < 0.9);
  for (const r of state.rings) {
    const k = (now - r.t) / 0.9;
    ctx.strokeStyle = rgb(pal.ring, 0.75 * (1 - k)); ctx.lineWidth = 2.2 * (1 - k) + 0.6;
    ctx.beginPath(); ctx.arc(r.pl.x, r.pl.y, 8 + 70 * k, 0, TWO_PI); ctx.stroke();
  }

  // disparos
  for (const s of shots) { ctx.fillStyle = s.team === 'foe' ? 'rgba(255,170,100,0.95)' : 'rgba(170,235,255,0.95)'; ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, TWO_PI); ctx.fill(); }
  // aviones con halo
  for (const pl of planes) pl.show(ctx, state.pulse);
  if (state.enemy > 0.02) { ctx.globalAlpha = state.enemy; for (const e of enemies) e.show(ctx); ctx.globalAlpha = 1; }

  if (state.verCampo) field.show(ctx);

  // viñeta
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(vigCanvas, 0, 0);
}

function aviso(msg, secs = 2) {
  avisoEl.textContent = msg; avisoEl.classList.add('visible');
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => avisoEl.classList.remove('visible'), secs * 1000);
}

function start() {
  if (started) return;
  started = true; inicioEl.classList.add('fuera'); ayudaEl.classList.remove('oculto');
}

function keyPressed() {
  start();
  if (keyCode === ENTER) {
    if (audioEl.paused) audioEl.play().catch(() => aviso('No encuentro assets/musica.mp3', 5));
    else audioEl.pause();
  }
  if (key === ' ' || keyCode === 32) {   // el "pum": impulso, onda en cada avión y ráfaga de luz
    state.pulseTarget = 1;
    const now = millis() / 1000;
    for (const p of planes) {
      state.rings.push({ pl: p, t: now });
      phys.spawnAt(p.x, p.y, 110, Math.atan2(p.vy, p.vx), TWO_PI);
    }
    if (state.rings.length > 80) state.rings.splice(0, state.rings.length - 80);
  }
  if (key === 'e' || key === 'E') {   // entra / se retira el escuadrón enemigo
    state.enemigos = state.enemigos ? 0 : 1;
    if (state.enemigos && state.enemy < 0.05) for (const e of enemies) e.respawn();
    aviso(state.enemigos ? 'Escuadrón enemigo' : 'El enemigo se retira', 2);
  }
  if (key === 'c' || key === 'C') { state.paleta = (state.paleta + 1) % PALETTES.length; aviso(PALETTES[state.paleta].name, 1.5); }
  if (key === 'f' || key === 'F') fullscreen(!fullscreen());
  if (key === 'h' || key === 'H') ayudaEl.classList.toggle('oculto');
  if (key === 'v' || key === 'V') state.verCampo = !state.verCampo;
  return false;
}

function mousePressed() {
  if (!started) { start(); return; }
  if (state.targets.length < 5) state.targets.push({ x: mouseX, y: mouseY, heat: 0, cool: 0.8, fired: -9 });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  trails.remove(); makeLayers();
  field.resize(); phys.resize();
  for (const p of wind) p.reset();
}
