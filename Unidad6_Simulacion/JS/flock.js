// ESCUADRAS (steering de Reynolds) + disparos.
// Hay 2 escuadras de 4 aviones. Cada escuadra tiene un LÍDER y tres alas.
//  - El líder vuela solo: wander, el viento, los objetivos y las paredes (no sigue a nadie).
//  - Cada ala percibe a su líder (si está dentro de su radio de percepción) y calcula SU puesto
//    en la formación, uno al lado del otro, relativo a la dirección del líder (offset pursuit).
//  - Todos se separan de quien se les acerca y esquivan los disparos que ven cerca (flee).
//  - Q: al soltar la formación cada ala deja de seguir a su líder y vuela por su cuenta (wander).

const SQUAD = 4;
const N_PLANES = 8;                 // 2 escuadras de 4
const N_ENEMIES = 6;                // escuadrón enemigo (tecla E)
const SLOTS = [0, -1, 1, 2];        // puesto lateral de cada rol (en "separaciones"): línea de frente

function flockParams(s) {
  return {
    maxSpeed: lerp(1.8, 4.5, s.velocidad) * (1 + 0.7 * s.pulse),
    maxForce: 0.09,
    perception: width * 0.45,              // hasta dónde ve a su líder (casi la mitad de la pantalla)
    spacing: lerp(120, 40, s.formacion),   // separación entre aviones de la formación (↑ ↓)
    sepRadius: lerp(30, 110, s.release),   // espacio personal: crece al dispersarse
    release: s.release,                    // 0 = en formación · 1 = dispersos (Q)
    wWind: 0.1 + 1.3 * s.turbulencia,      // cuánto lo arrastra el viento
    storm: 0.14 * s.turbulencia * s.turbulencia,   // sacudidas extra en tormenta
  };
}

class Plane {
  constructor(i) {
    this.squad = Math.floor(i / SQUAD); this.role = i % SQUAD;
    const by = height * (this.squad === 0 ? 0.3 : 0.7), off = SLOTS[this.role] * 70;
    this.x = width * 0.18 - Math.abs(SLOTS[this.role]) * 12; this.y = by + off;   // arrancan ya en formación
    this.vx = 2.2; this.vy = 0;
    this.ax = 0; this.ay = 0; this.px = this.x; this.py = this.y;
    this.wa = random(TWO_PI);   // ángulo del wander
    this.cool = random(1, 3);   // tiempo hasta su próximo disparo
  }

  // steering = velocidad deseada - velocidad actual, limitada a maxForce
  push(dx, dy, w, p) {
    let sx = dx - this.vx, sy = dy - this.vy;
    const f = Math.hypot(sx, sy);
    if (f > p.maxForce) { sx *= p.maxForce / f; sy *= p.maxForce / f; }
    this.ax += sx * w; this.ay += sy * w;
  }
  toward(dx, dy, w, p, speed = p.maxSpeed) {
    const d = Math.hypot(dx, dy) || 1e-6;
    this.push((dx / d) * speed, (dy / d) * speed, w, p);
  }
  // WANDER: un punto que se mueve al azar sobre un círculo delante del avión.
  wander(w, p) {
    if (w <= 0) return;
    this.wa += (Math.random() - 0.5) * 0.5;
    const sp = Math.hypot(this.vx, this.vy) || 1;
    this.toward((this.vx / sp) * 60 + Math.cos(this.wa) * 35, (this.vy / sp) * 60 + Math.sin(this.wa) * 35, w, p);
  }

  update(planes, p, field, targets, shots, dt60, enemies = []) {
    const leader = planes[this.squad * SQUAD], free = p.release;
    const isLeader = this.role === 0;

    if (isLeader) {
      this.wander(0.45, p);
    } else if (Math.hypot(leader.x - this.x, leader.y - this.y) < p.perception) {
      // Percibe a su líder: calcula su puesto al lado de él (perpendicular a su rumbo).
      const ls = Math.hypot(leader.vx, leader.vy) || 1e-6, lx = leader.vx / ls, ly = leader.vy / ls;
      const off = SLOTS[this.role];
      const sx = leader.x - ly * off * p.spacing - lx * Math.abs(off) * 12;
      const sy = leader.y + lx * off * p.spacing - ly * Math.abs(off) * 12;
      // OFFSET PURSUIT: igualar la velocidad del líder + corregir hacia su puesto
      let dx = leader.vx + (sx - this.x) * 0.05, dy = leader.vy + (sy - this.y) * 0.05;
      const m = Math.hypot(dx, dy), cap = p.maxSpeed * 1.35;
      if (m > cap) { dx *= cap / m; dy *= cap / m; }
      this.push(dx, dy, 2.2 * (1 - free), p);
      this.wander(0.9 * free, p);
    } else {
      this.wander(0.9, p);   // no ve a su líder: vaga hasta encontrarlo...
      this.toward(width / 2 - this.x, height / 2 - this.y, 0.5, p);   // ...y tiende hacia el centro, donde suele estar
    }

    // Separación: se aparta de quien tiene muy cerca (también de la otra escuadra)
    let sx = 0, sy = 0;
    for (const o of planes) {
      if (o === this) continue;
      const dx = this.x - o.x, dy = this.y - o.y, d = Math.hypot(dx, dy);
      if (d < p.sepRadius && d > 1e-6) { const k = (1 - d / p.sepRadius) / d; sx += dx * k; sy += dy * k; }
    }
    if (sx || sy) this.toward(sx, sy, 2.4, p);

    // Viento: la flecha de su celda lo empuja
    const a = field.at(this.x, this.y);
    this.push(Math.cos(a) * p.maxSpeed, Math.sin(a) * p.maxSpeed, p.wWind, p);
    this.ax += Math.cos(a) * p.storm; this.ay += Math.sin(a) * p.storm;   // la tormenta los zarandea

    // Objetivos (ARRIVE): el líder los busca; las alas solo si se soltaron
    const wT = isLeader ? 1.3 : 1.1 * free;
    if (wT > 0.01) for (const t of targets) {
      const dx = t.x - this.x, dy = t.y - this.y, d = Math.hypot(dx, dy);
      if (d < 700) this.toward(dx, dy, wT, p, p.maxSpeed * Math.min(1, d / 120));
    }

    // Disparos: los ve cerca y los esquiva (FLEE)
    for (const s of shots) {
      if (s.team !== 'foe') continue;   // solo esquiva los disparos hostiles
      const dx = this.x - s.x, dy = this.y - s.y, d = Math.hypot(dx, dy);
      if (d < 110 && d > 1e-6) this.toward(dx, dy, 2.2 * (1 - d / 110), p);
    }

    // Enemigos: los esquiva si se le acercan (EVADE) y los líderes contraatacan (PURSUE)
    if (enemies.length) {
      let ne = null, nd = 620;
      for (const e of enemies) {
        const dx = this.x - e.x, dy = this.y - e.y, d = Math.hypot(dx, dy);
        if (d < nd) { nd = d; ne = e; }
        if (d < 130 && d > 1e-6) this.toward(dx, dy, 1.3 * (1 - d / 130), p);
      }
      const wP = isLeader ? 0.6 : 0.8 * free;
      if (ne && wP > 0.01) pursueTo(this, ne, wP, p);
    }

    // Bordes: se curvan hacia adentro antes de salirse
    const m = 110, e = Math.min(this.x, this.y, width - this.x, height - this.y);
    if (e < m) this.toward(width / 2 - this.x, height / 2 - this.y, 2.5 * (1 - e / m), p);

    // Integración
    const am = Math.hypot(this.ax, this.ay), maxA = p.maxForce * 2.5;
    if (am > maxA) { this.ax *= maxA / am; this.ay *= maxA / am; }
    this.vx += this.ax * dt60; this.vy += this.ay * dt60;
    const s2 = Math.hypot(this.vx, this.vy) || 1e-6, vmax = p.maxSpeed * (isLeader ? 1 : 1.35), vmin = 0.6 * p.maxSpeed;
    const k = s2 > vmax ? vmax / s2 : s2 < vmin ? vmin / s2 : 1;   // nunca se quedan quietos
    this.vx *= k; this.vy *= k;
    this.px = this.x; this.py = this.y;
    this.x += this.vx * dt60; this.y += this.vy * dt60;
    this.ax = this.ay = 0;
  }

  // El halo se dibuja UNA vez en un sprite; cada avión es un drawImage.
  show(ctx, pulse) {
    if (!planeSprites[this.squad]) planeSprites[this.squad] = makePlaneSprite(this.squad);
    const sp = Math.hypot(this.vx, this.vy) || 1, c = this.vx / sp, s = this.vy / sp;
    ctx.setTransform(c, s, -s, c, this.x, this.y);
    ctx.drawImage(planeSprites[this.squad], -32, -32);
    ctx.fillStyle = `rgba(255,170,80,${0.5 + 0.5 * pulse})`;   // el motor brilla con el impulso
    ctx.beginPath(); ctx.arc(-8, 0, 2.4 + 4.5 * pulse, 0, TWO_PI); ctx.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

const planeSprites = [null, null, null];
function makePlaneSprite(squad) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'); x.translate(32, 32);
  const cols = [['rgba(150,200,255,0.9)', 'rgba(235,245,255,0.95)'], ['rgba(255,200,130,0.9)', 'rgba(255,240,215,0.95)'], ['rgba(255,70,70,0.95)', 'rgba(255,165,150,0.95)']];
  x.shadowColor = cols[squad][0]; x.shadowBlur = 12; x.fillStyle = cols[squad][1];
  x.beginPath();
  if (squad === 2) { x.moveTo(15, 0); x.lineTo(-5, 11); x.lineTo(-8, 3); x.lineTo(-8, -3); x.lineTo(-5, -11); }   // el enemigo: ala más abierta
  else { x.moveTo(17, 0); x.lineTo(-11, 9); x.lineTo(-5, 0); x.lineTo(-11, -9); }
  x.closePath(); x.fill();
  return c;
}

// PURSUE (Reynolds): apuntar a donde estará el otro, no a donde está.
function pursueTo(me, o, w, p) {
  const dx = o.x - me.x, dy = o.y - me.y, d = Math.hypot(dx, dy) || 1;
  const T = Math.min(d / p.maxSpeed, 45) * 0.7;   // en cuántos cuadros lo alcanzaría, aprox.
  me.toward(o.x + o.vx * T - me.x, o.y + o.vy * T - me.y, w, p);
}
function nearest(list, from, maxD) {
  let best = null, bd = maxD;
  for (const o of list) { const d = Math.hypot(o.x - from.x, o.y - from.y); if (d < bd) { bd = d; best = o; } }
  return best;
}

// ESCUADRÓN ENEMIGO: una bandada de verdad (flocking sin líder). Cada enemigo percibe a sus compañeros
// cercanos (separación, alineación, cohesión) y PERSIGUE al avión amigo más cercano que ve.
class Enemy extends Plane {
  constructor(i) { super(0); this.i = i; this.respawn(); }
  respawn() {   // entran por el borde derecho, en V abierta
    this.x = width * 0.99 + Math.abs(this.i - 2.5) * 40; this.y = height * (0.3 + 0.4 * this.i / (N_ENEMIES - 1));
    this.vx = -2.4; this.vy = random(-0.3, 0.3);
    this.px = this.x; this.py = this.y; this.ax = this.ay = 0; this.cool = random(1.5, 3);
  }
  update(enemies, friends, p, field, dt60) {
    const sp = Math.hypot(this.vx, this.vy) || 1e-6, hx = this.vx / sp, hy = this.vy / sp;
    let ali = [0, 0], coh = [0, 0], sep = [0, 0], n = 0;
    for (const o of enemies) {
      if (o === this) continue;
      const dx = o.x - this.x, dy = o.y - this.y, d = Math.hypot(dx, dy);
      if (d > 260 || d < 1e-6 || (dx * hx + dy * hy) / d < -0.3) continue;   // solo ve lo cercano y lo que tiene delante
      n++; ali[0] += o.vx; ali[1] += o.vy; coh[0] += dx; coh[1] += dy;
      if (d < 70) { const k = (1 - d / 70) / d; sep[0] -= dx * k; sep[1] -= dy * k; }
    }
    if (n) { this.toward(sep[0], sep[1], 3.2, p); this.toward(ali[0], ali[1], 1.0, p); this.toward(coh[0], coh[1], 0.9, p); }
    // Cada enemigo escoge entre los 3 aviones amigos más cercanos que ve (según su número): así no persiguen todos al mismo
    const seen = friends.filter((q) => Math.hypot(q.x - this.x, q.y - this.y) < 800)
      .sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y));
    const target = seen.length ? seen[this.i % Math.min(3, seen.length)] : null;
    if (target) pursueTo(this, target, 0.8, p); else this.wander(0.6, p);
    for (const f of friends) {   // no se estrella contra ellos
      const dx = this.x - f.x, dy = this.y - f.y, d = Math.hypot(dx, dy);
      if (d < 45 && d > 1e-6) this.toward(dx, dy, 1.6, p);
    }
    const a = field.at(this.x, this.y);
    this.push(Math.cos(a) * p.maxSpeed, Math.sin(a) * p.maxSpeed, p.wWind * 0.4, p);
    const m = 110, e = Math.min(this.x, this.y, width - this.x, height - this.y);
    if (e < m) this.toward(width / 2 - this.x, height / 2 - this.y, 2.5 * (1 - e / m), p);
    const am = Math.hypot(this.ax, this.ay), maxA = p.maxForce * 2.5;
    if (am > maxA) { this.ax *= maxA / am; this.ay *= maxA / am; }
    this.vx += this.ax * dt60; this.vy += this.ay * dt60;
    const s2 = Math.hypot(this.vx, this.vy) || 1e-6, vmax = p.maxSpeed * 0.9, vmin = 0.6 * p.maxSpeed;
    const k = s2 > vmax ? vmax / s2 : s2 < vmin ? vmin / s2 : 1;
    this.vx *= k; this.vy *= k;
    this.px = this.x; this.py = this.y;
    this.x += this.vx * dt60; this.y += this.vy * dt60;
    this.ax = this.ay = 0;
  }
  show(ctx) {
    if (!planeSprites[2]) planeSprites[2] = makePlaneSprite(2);
    const sp = Math.hypot(this.vx, this.vy) || 1, c = this.vx / sp, s = this.vy / sp;
    ctx.setTransform(c, s, -s, c, this.x, this.y);
    ctx.drawImage(planeSprites[2], -32, -32);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

// DISPARO: un agente más. Percibe el avión más cercano (dentro de su radio) y lo PERSIGUE
// (pursue: apunta a donde estará, no a donde está), pero gira despacio y es más lento que los
// aviones: se pueden esquivar. No hace daño; se apaga solo después de unos segundos.
const MAX_SHOTS = 28;
class Shot {
  constructor(x, y, tx, ty, team = 'foe') {   // 'foe' = hostil (va hacia los aviones) · 'ally' = tuyo (va hacia los enemigos)
    this.team = team;
    const d = Math.hypot(tx - x, ty - y) || 1;
    this.x = x; this.y = y; this.px = x; this.py = y;
    this.vx = (tx - x) / d * 2.5; this.vy = (ty - y) / d * 2.5;
    this.age = 0; this.life = 3.2;
  }
  update(friends, foes, dt, dt60) {
    const planes = this.team === 'foe' ? friends : foes;
    if (!planes.length) { this.age = this.life; return; }
    let best = null, bd = 700;
    for (const pl of planes) { const d = Math.hypot(pl.x - this.x, pl.y - this.y); if (d < bd) { bd = d; best = pl; } }
    if (best) {
      const T = bd / 3;   // frames hasta llegar, aprox.
      const dx = best.x + best.vx * T * 0.8 - this.x, dy = best.y + best.vy * T * 0.8 - this.y, d = Math.hypot(dx, dy) || 1;
      let sx = (dx / d) * 3 - this.vx, sy = (dy / d) * 3 - this.vy;
      const f = Math.hypot(sx, sy), maxF = 0.05;
      if (f > maxF) { sx *= maxF / f; sy *= maxF / f; }
      this.vx += sx * dt60; this.vy += sy * dt60;
    }
    this.px = this.x; this.py = this.y;
    this.x += this.vx * dt60; this.y += this.vy * dt60;
    this.age += dt;
  }
}
