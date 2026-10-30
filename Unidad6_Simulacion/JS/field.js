// FLOW FIELD + partículas de viento (steering de Reynolds).
// El CAMPO es una rejilla de direcciones (un ángulo por celda) que cambia con el tiempo.
// La REGLA con la que se consulta es aparte: cada partícula (o avión) mira SU celda,
// la convierte en velocidad deseada y gira hacia ella (steering = deseada - velocidad).

const CELL = 40;
const SCALE = 0.1;
const N_WIND = 900;

function windParams(turb) {
  return {
    spread: lerp(1.2, 6, turb),        // cuánto puede girar la flecha entre celdas vecinas
    timeSpeed: lerp(0.04, 0.6, turb),  // qué tan rápido cambia el campo
    speed: lerp(0.5, 6.5, turb),         // velocidad deseada de las partículas
    maxForce: lerp(0.03, 0.2, turb),   // qué tan rápido giran
  };
}

class FlowField {
  constructor() { this.t = 0; this.resize(); }
  resize() {
    this.cols = ceil(width / CELL) + 1;
    this.rows = ceil(height / CELL) + 1;
    this.angle = new Float32Array(this.cols * this.rows);
  }
  update(dt, wp) {
    this.t += dt * wp.timeSpeed;
    for (let j = 0; j < this.rows; j++)
      for (let i = 0; i < this.cols; i++)
        this.angle[i + j * this.cols] = noise(i * SCALE, j * SCALE, this.t) * TWO_PI * wp.spread;
  }
  // Lo único que "percibe" quien consulta el campo: la flecha de la celda donde está.
  at(x, y) {
    const i = constrain(floor(x / CELL), 0, this.cols - 1);
    const j = constrain(floor(y / CELL), 0, this.rows - 1);
    return this.angle[i + j * this.cols];
  }
  show(ctx) {
    ctx.strokeStyle = 'rgba(240,201,135,0.5)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let j = 0; j < this.rows; j++)
      for (let i = 0; i < this.cols; i++) {
        const a = this.angle[i + j * this.cols], x = i * CELL + CELL / 2, y = j * CELL + CELL / 2;
        ctx.moveTo(x, y); ctx.lineTo(x + cos(a) * CELL * 0.4, y + sin(a) * CELL * 0.4);
      }
    ctx.stroke();
  }
}

class WindParticle {
  constructor() { this.reset(); }
  reset() {
    this.x = random(width); this.y = random(height);
    this.px = this.x; this.py = this.y; this.vx = 0; this.vy = 0;
    this.k = random(0.6, 1.3);
    this.bucket = floor(random(3));   // grupo de transparencia (se dibuja por grupos)
  }
  follow(field, wp, dt60) {
    const a = field.at(this.x, this.y);
    let sx = cos(a) * wp.speed * this.k - this.vx, sy = sin(a) * wp.speed * this.k - this.vy;
    const f = Math.hypot(sx, sy);
    if (f > wp.maxForce) { sx *= wp.maxForce / f; sy *= wp.maxForce / f; }
    this.vx += sx * dt60; this.vy += sy * dt60;
    this.px = this.x; this.py = this.y;
    this.x += this.vx * dt60; this.y += this.vy * dt60;
    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) this.reset();
  }
}

// Dibuja todo el viento con solo 3 trazos (uno por grupo de transparencia).
const WIND_ALPHA = [0.2, 0.34, 0.5];
function drawWind(ctx, wind, turb) {
  ctx.lineWidth = 1 + 0.5 * turb;                   // en tormenta las rayas son un poco más gruesas, pero sutiles
  for (let b = 0; b < 3; b++) {
    ctx.strokeStyle = rgb(pal.wind, WIND_ALPHA[b] * (0.35 + 0.5 * turb));   // sutil: que no tape a los aviones
    ctx.beginPath();
    for (const p of wind) if (p.bucket === b) { ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); }
    ctx.stroke();
  }
}
