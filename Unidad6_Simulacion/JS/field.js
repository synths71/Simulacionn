// FLOW FIELD + partículas de viento (steering de Reynolds).
//
// El CAMPO es solo una rejilla de direcciones (un ángulo por celda) que cambia con el tiempo.
// La REGLA con la que cada partícula lo consulta es aparte: mira la flecha de SU celda,
// la convierte en velocidad deseada y gira hacia ella (steering = deseada - velocidad actual).

const CELL = 40;          // tamaño de cada celda en píxeles
const SCALE = 0.1;        // tamaño de los remolinos (más pequeño = remolinos más grandes)
const N_WIND = 1400;      // partículas de viento

// Parámetros del viento que dependen de la turbulencia (0..1)
function windParams(turb) {
  return {
    spread: lerp(1.2, 4.5, turb),      // cuánto puede girar la flecha entre celdas vecinas
    timeSpeed: lerp(0.04, 0.3, turb),  // qué tan rápido cambia el campo
    speed: lerp(0.8, 2.6, turb),       // velocidad deseada de las partículas
    maxForce: lerp(0.03, 0.12, turb),  // qué tan rápido pueden girar
  };
}

class FlowField {
  constructor() { this.t = 0; this.resize(); }

  resize() {
    this.cols = ceil(width / CELL) + 1;
    this.rows = ceil(height / CELL) + 1;
    this.angle = new Float32Array(this.cols * this.rows);
  }

  // El campo de direcciones: un ruido suave decide el ángulo de cada celda.
  update(dt, wp) {
    this.t += dt * wp.timeSpeed;
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {
        this.angle[i + j * this.cols] = noise(i * SCALE, j * SCALE, this.t) * TWO_PI * wp.spread;
      }
    }
  }

  // Lo único que "percibe" una partícula: el ángulo de la celda donde está.
  at(x, y) {
    const i = constrain(floor(x / CELL), 0, this.cols - 1);
    const j = constrain(floor(y / CELL), 0, this.rows - 1);
    return this.angle[i + j * this.cols];
  }

  // Vista de depuración (tecla V): una flecha por celda.
  show() {
    stroke(240, 201, 135, 120); strokeWeight(1);
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {
        const a = this.angle[i + j * this.cols];
        const x = i * CELL + CELL / 2, y = j * CELL + CELL / 2;
        line(x, y, x + cos(a) * CELL * 0.4, y + sin(a) * CELL * 0.4);
      }
    }
  }
}

class WindParticle {
  constructor() { this.reset(); }

  reset() {
    this.x = random(width); this.y = random(height);
    this.px = this.x; this.py = this.y;
    this.vx = 0; this.vy = 0;
    this.k = random(0.6, 1.3);   // cada partícula tiene su propia velocidad máxima
    this.alpha = random(40, 110);
  }

  follow(field, wp, dt60) {
    const a = field.at(this.x, this.y);
    // velocidad deseada = dirección de la flecha × velocidad
    let sx = cos(a) * wp.speed * this.k - this.vx;
    let sy = sin(a) * wp.speed * this.k - this.vy;
    // steering limitado: así gira suave y no de golpe
    const f = Math.hypot(sx, sy);
    if (f > wp.maxForce) { sx *= wp.maxForce / f; sy *= wp.maxForce / f; }
    this.vx += sx * dt60;
    this.vy += sy * dt60;
    this.px = this.x; this.py = this.y;
    this.x += this.vx * dt60;
    this.y += this.vy * dt60;
    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) this.reset();
  }

  show() {
    stroke(190, 215, 255, this.alpha);
    line(this.px, this.py, this.x, this.y);
  }
}
