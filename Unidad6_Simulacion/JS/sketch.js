// Etapa 1: el viento (flow field). Siguiente: escuadrilla (flocking) y Physarum.
let field, wind = [];
let audioEl, avisoEl, ayudaEl, inicioEl, started = false, avisoTimer;

function setup() {
  pixelDensity(1);                       // más liviano en pantallas retina
  createCanvas(windowWidth, windowHeight);
  background(4, 8, 22);
  field = new FlowField();
  for (let i = 0; i < N_WIND; i++) wind.push(new WindParticle());
  audioEl = document.getElementById('musica');
  avisoEl = document.getElementById('aviso');
  ayudaEl = document.getElementById('ayuda');
  inicioEl = document.getElementById('inicio');
}

function draw() {
  const dt = min(deltaTime / 1000, 0.1);
  const dt60 = dt * 60;
  updateHeld(dt);

  // Fondo semitransparente: lo que se mueve deja estela
  noStroke(); fill(4, 8, 22, 22);
  rect(0, 0, width, height);

  const wp = windParams(state.turbulencia);
  field.update(dt, wp);
  strokeWeight(1.2);
  for (const p of wind) { p.follow(field, wp, dt60); p.show(); }
  if (state.verCampo) field.show();
}

function aviso(msg, secs = 2) {
  avisoEl.textContent = msg; avisoEl.classList.add('visible');
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => avisoEl.classList.remove('visible'), secs * 1000);
}

function start() {
  if (started) return;
  started = true;
  inicioEl.classList.add('fuera');
  ayudaEl.classList.remove('oculto');
}

function keyPressed() {
  start();
  if (keyCode === ENTER) {
    if (audioEl.paused) audioEl.play().catch(() => aviso('No encuentro assets/musica.mp3', 5));
    else audioEl.pause();
  }
  if (key === 'f' || key === 'F') fullscreen(!fullscreen());
  if (key === 'h' || key === 'H') ayudaEl.classList.toggle('oculto');
  if (key === 'v' || key === 'V') { state.verCampo = !state.verCampo; background(4, 8, 22); }
  return false;   // evita el comportamiento por defecto del navegador
}

function mousePressed() { start(); }

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(4, 8, 22);
  field.resize();
  for (const p of wind) p.reset();
}
