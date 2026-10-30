// ESTADO COMPARTIDO: lo que tú controlas en vivo.
// Los agentes leen estos valores, pero cada uno sigue calculando su propia respuesta.
const state = {
  formacion: 0.5,     // separación de la formación: 0 = abierta · 1 = cerrada   (↑ ↓)
  velocidad: 0.4,     // velocidad de los aviones                          (← →)
  turbulencia: 0.3,   // 0 = cielo calmado · 1 = tormenta                  (W S)
  release: 0, releaseHeld: false,   // 0 = en formación · 1 = dispersos (Q sostenida)
  red: 0.5,           // 0 = red de luz fina y cerrada · 1 = extendida     (A D)
  pulse: 0, pulseTarget: 0,   // impulso del "1" (Espacio): sube rápido y decae
  rings: [],          // ondas de luz de los últimos impulsos (una por avión)
  targets: [],        // objetivos en tierra (clic)
  flashes: [],        // destellos de objetivos cumplidos
  enemigos: 0, enemy: 0,   // escuadrón enemigo: 0/1 elegido (E) y presencia suave 0..1
  paleta: 0,          // 0 = noche · 1 = atardecer · 2 = alerta                    (C)
  verCampo: false,
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Teclas sostenidas: el cambio es gradual, como un gesto.
function updateHeld(dt) {
  const r = 0.3 * dt;
  const hold = (k, key, sign) => { if (keyIsDown(k)) state[key] = clamp01(state[key] + sign * r); };
  hold(UP_ARROW, 'formacion', 1);   hold(DOWN_ARROW, 'formacion', -1);
  hold(RIGHT_ARROW, 'velocidad', 1); hold(LEFT_ARROW, 'velocidad', -1);
  hold(87, 'turbulencia', 1);       hold(83, 'turbulencia', -1);   // W S
  hold(68, 'red', 1);               hold(65, 'red', -1);           // D A
  state.releaseHeld = keyIsDown(81);   // Q: sostener para dispersarse
}

// El impulso sube suave y luego se apaga: un empuje, no un salto.
function easeState(dt) {
  state.enemy += (state.enemigos - state.enemy) * (1 - Math.exp(-dt * 1.2));
  state.release += ((state.releaseHeld ? 1 : 0) - state.release) * (1 - Math.exp(-dt * 2.2));
  state.pulse += (state.pulseTarget - state.pulse) * (1 - Math.exp(-dt * 8));
  state.pulseTarget *= Math.exp(-dt * 2.5);
}

// PALETAS: la atmósfera de la escena. Cambian suavemente de una a otra (tecla C).
// Cada pasaje de la canción puede tener la suya. Los aviones conservan su color para leerse siempre.
const PALETTES = [
  { name: 'Noche',     bgTop: [7, 14, 40],  bgBot: [3, 6, 18], wind: [160, 195, 255], lo: [40, 90, 255],  hi: [190, 220, 255], ring: [190, 225, 255] },
  { name: 'Atardecer', bgTop: [38, 18, 12], bgBot: [10, 4, 3], wind: [255, 190, 130], lo: [200, 70, 20],  hi: [255, 225, 160], ring: [255, 215, 160] },
  { name: 'Alerta',    bgTop: [36, 6, 18],  bgBot: [10, 2, 6], wind: [255, 130, 150], lo: [190, 20, 70],  hi: [255, 160, 190], ring: [255, 170, 190] },
];
const pal = JSON.parse(JSON.stringify(PALETTES[0]));   // colores actuales (van hacia la paleta elegida)
const rgb = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

// Devuelve true mientras los colores todavía se están moviendo.
function easePalette(dt) {
  const k = 1 - Math.exp(-dt * 1.6), tg = PALETTES[state.paleta];
  let moving = false;
  for (const key of ['bgTop', 'bgBot', 'wind', 'lo', 'hi', 'ring'])
    for (let i = 0; i < 3; i++) {
      const d = tg[key][i] - pal[key][i];
      if (Math.abs(d) > 0.3) moving = true;
      pal[key][i] += d * k;
    }
  return moving;
}
