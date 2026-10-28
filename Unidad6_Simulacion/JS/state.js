// ESTADO COMPARTIDO: lo que tú controlas en vivo.
// Los agentes leen estos valores, pero cada uno sigue calculando su propia respuesta.
const state = {
  turbulencia: 0.25,   // 0 = cielo calmado · 1 = tormenta   (W / S)
  verCampo: false,     // dibuja las flechas del campo        (V)
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Teclas que se sostienen: el cambio es gradual, como un gesto.
function updateHeld(dt) {
  const r = 0.3 * dt;
  if (keyIsDown(87)) state.turbulencia = clamp01(state.turbulencia + r); // W
  if (keyIsDown(83)) state.turbulencia = clamp01(state.turbulencia - r); // S
}
