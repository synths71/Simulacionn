// PHYSARUM: la estela de luz que dejan los aviones.
// Un mapa de rastro de baja resolución (cada celda = PS píxeles). Cada agente huele el rastro con
// tres sensores (adelante, izquierda, derecha), gira hacia donde hay más, avanza y deposita.
// Los agentes NACEN en los aviones, avanzan más despacio que ellos y viven menos de un segundo:
// se quedan atrás tejiendo una estela fina de luz por donde pasó cada avión, y se desvanecen. Cada "pum" que tú marcas (Espacio) hace brotar una ráfaga de agentes.

const P_AGENTS = 8000;     // capacidad máxima de agentes vivos a la vez
const PS = 5;      // celdas pequeñas = venas finas
const WOBBLE = 0.18;       // ruido al girar
const CAP = 12;            // tope del rastro: ninguna vena se vuelve infinitamente atractiva

class Physarum {
  constructor() {
    this.cv = document.createElement('canvas');
    this.ctx = this.cv.getContext('2d');
    this.resize();
  }

  resize() {
    this.w = Math.ceil(width / PS); this.h = Math.ceil(height / PS);
    this.cv.width = this.w; this.cv.height = this.h;
    this.img = this.ctx.createImageData(this.w, this.h);
    this.trail = new Float32Array(this.w * this.h);
    this.tmp = new Float32Array(this.w * this.h);
    this.x = new Float32Array(P_AGENTS); this.y = new Float32Array(P_AGENTS);
    this.a = new Float32Array(P_AGENTS); this.life = new Float32Array(P_AGENTS);   // life 0 = sin vida
    this.next = 0;
  }

  // Depositar rastro en un punto en píxeles de pantalla.
  deposit(px, py, amt) {
    const i = (px / PS) | 0, j = (py / PS) | 0;
    if (i >= 0 && j >= 0 && i < this.w && j < this.h) this.trail[j * this.w + i] += amt;
  }

  // Un objetivo cumplido: un golpe de rastro que atrae a los agentes cercanos.
  burst(px, py) {
    for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) this.deposit(px + dx * PS, py + dy * PS, 25);
  }

  // Nacen n agentes en un punto (en píxeles); cada uno vive menos de un segundo.
  spawnAt(px, py, n, heading, spread) {
    for (let i = 0; i < n; i++) {
      const k = this.next; this.next = (k + 1) % P_AGENTS;   // reemplaza a los más viejos
      this.x[k] = px / PS + (Math.random() - 0.5) * 2;
      this.y[k] = py / PS + (Math.random() - 0.5) * 2;
      this.a[k] = heading + (Math.random() - 0.5) * spread;
      this.life[k] = 25 + Math.random() * 30;
    }
  }

  sense(x, y, ang, so) {
    const w = this.w, h = this.h;
    let ix = (x + Math.cos(ang) * so) | 0, iy = (y + Math.sin(ang) * so) | 0;
    ix = ((ix % w) + w) % w; iy = ((iy % h) + h) % h;
    return this.trail[iy * w + ix];
  }

  update(s, dt60) {
    const { w, h, trail, x, y, a, life } = this;
    const so = lerp(5, 14, s.red);         // distancia de los sensores
    const sa = lerp(0.85, 0.5, s.red);       // ángulo de los sensores
    const ra = 0.32;                         // cuánto giran
    const speed = 0.55 * (1 + 0.5 * s.pulse) * dt60;
    const dep = 1.1 * (1 + 0.6 * s.pulse);
    const decay = lerp(0.74, 0.86, s.red);   // evaporación: más lenta = red más extendida
    for (let k = 0; k < P_AGENTS; k++) {
      if (life[k] <= 0) continue;
      life[k] -= dt60;
      let ang = a[k] + (Math.random() - 0.5) * WOBBLE;
      const f = this.sense(x[k], y[k], ang, so);
      const l = this.sense(x[k], y[k], ang - sa, so);
      const r = this.sense(x[k], y[k], ang + sa, so);
      if (f > l && f > r) { /* sigue derecho */ }
      else if (f < l && f < r) ang += (Math.random() < 0.5 ? 1 : -1) * ra;
      else if (l > r) ang -= ra;
      else if (r > l) ang += ra;
      let nx = x[k] + Math.cos(ang) * speed, ny = y[k] + Math.sin(ang) * speed;
      nx = (nx + w) % w; ny = (ny + h) % h;
      x[k] = nx; y[k] = ny; a[k] = ang;
      trail[(ny | 0) * w + (nx | 0)] += dep;
    }
    // Difusión 3×3 + evaporación
    const t = this.tmp;
    for (let j = 0; j < h; j++) {
      const up = ((j - 1 + h) % h) * w, mid = j * w, dn = ((j + 1) % h) * w;
      for (let i = 0; i < w; i++) {
        const l = (i - 1 + w) % w, r = (i + 1) % w;
        t[mid + i] = (trail[up + l] + trail[up + i] + trail[up + r] + trail[mid + l] + trail[mid + i] +
                      trail[mid + r] + trail[dn + l] + trail[dn + i] + trail[dn + r]) / 9 * decay;
        if (t[mid + i] > CAP) t[mid + i] = CAP;
      }
    }
    this.tmp = trail; this.trail = t;
  }

  // boost (0..1) = el impulso del "pum": la red se enciende y luego se apaga.
  draw(ctx, boost) {
    const d = this.img.data, tr = this.trail, n = this.w * this.h;
    const gain = 150 + 90 * boost, lo = pal.lo, hi = pal.hi;
    for (let i = 0; i < n; i++) {
      const k = Math.max(0, Math.min(1, (tr[i] - 1.5) / CAP));
      const p = i * 4;
      d[p] = lo[0] + (hi[0] - lo[0]) * k; d[p + 1] = lo[1] + (hi[1] - lo[1]) * k; d[p + 2] = lo[2] + (hi[2] - lo[2]) * k;   // del color oscuro de la paleta al claro
      d[p + 3] = Math.min(255, Math.pow(k, 1.5) * gain * 2.2);          // el núcleo brilla y los bordes se apagan: venas finas
    }
    this.ctx.putImageData(this.img, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.cv, 0, 0, width, height);
    ctx.restore();
  }
}
