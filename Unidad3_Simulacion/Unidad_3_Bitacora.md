# U3 · Forces Instrument — Bitácora

**Jhon Alejandro Giraldo.**

Instrumento visual basado en fuerzas, construido sobre el caso de estudio
`forces-instrument-u3` con asistencia de IA generativa, verificado con predicciones
medibles y preparado para interpretación en tiempo real.

Esta bitácora está ordenada según los entregables del encargo. No es un diario de frases
generales: cada afirmación sobre el comportamiento del sistema apunta a un archivo y una
línea concretos, y cada decisión de diseño dice qué acepté, qué corregí y qué descarté de
la propuesta de la IA.

# Enlance de la aplicación: 

https://synths71.github.io/Test-Sim/



## Índice

1. [Instrumento funcional y publicado](#1-instrumento-funcional-y-publicado)
2. [Mapa del sistema](#2-mapa-del-sistema)
3. [Ficha de fuerzas](#3-ficha-de-fuerzas)
4. [Registro de pruebas](#4-registro-de-pruebas)
5. [Score visual](#5-score-visual-de-lesalpx)
6. [Bitácora de IA](#6-bitácora-de-ia)
7. [Autoevaluación ponderada](#7-autoevaluación-ponderada)
8. [Qué falta y qué no está verificado](#8-qué-falta-y-qué-no-está-verificado)
9. [Ejecutar y publicar](#9-ejecutar-y-publicar)

---

## 1. Instrumento funcional y publicado

**URL pública:** `[COMPLETAR — ver §9 para el paso a paso de publicación]`

Verificado en local el `[fecha]` corriendo `npm run dev`: carga el canvas, inicializa el
`WebGPURenderer`, muestra el panel LAB con las fuerzas base y nuevas, y el HUD con el
mapa de teclas. Sin errores en consola.

**Contrato técnico cumplido:** Web + Three.js `0.185.1` + `WebGPURenderer` + TSL +
GPU Compute + Vite `8.2.1`.

### Los dos modos

| | **LAB** | **PERFORMANCE** |
|---|---|---|
| Para qué | Comprender y verificar cada fuerza por separado | Interpretar en vivo |
| Panel (`labPanel.js`) | Visible: sliders, checkboxes y botones de prueba | Oculto |
| Ejes y marcador del atractor | Visibles | Ocultos |
| Órbita de cámara (`OrbitControls`) | Activa | Desactivada |
| Teclas `1`–`5` | Presets que **aíslan** una fuerza (apagan las demás y llaman `reset()`) | Igual comportamiento: siguen disponibles para conducir |
| Teclas `E` / `T` / `G` | Disparan expansión, turbulencia y shock para probarlas solas | Disponibles como gestos de interpretación |
| Retroalimentación | Panel completo + HUD | Solo HUD |

Cambio de modo con `P` ([`main.js`](src/main.js), función `setMode`). El PARTICLE_COUNT
es fijo: **131 072** partículas (2^17), reservadas de una vez en `instancedArray` — no
crecen ni se destruyen, la simulación siempre corre con el mismo número.

### Controles

| Control | Acción | Dónde |
|---|---|---|
| `P` | LAB ↔ PERFORMANCE | `main.js`, `setMode` |
| `R` | Reset (reinicializa posiciones y velocidades) | `main.js` → `simulation.reset()` |
| `1` | Preset Inercia: sin fuerzas, velocidad inicial alta | `applyPreset('inertia')` |
| `2` | Preset Viento: dirección hacia el mouse | `applyPreset('wind')` |
| `3` | Preset Atracción: radial positiva | `applyPreset('attract')` |
| `4` | Preset Repulsión: radial negativa | `applyPreset('repel')` |
| `5` | Preset Vórtice: radial + tangencial + drag | `applyPreset('vortex')` |
| `E` | Pulso de expansión (impulso corto que decae) | `params.expansionPulse.value = 1.0` |
| `T` (mantener) | Turbulencia mientras se mantiene pulsada | `keydown`/`keyup` de `KeyT` |
| `G` | Shock: pulso corto con corte duro a los 300 ms | `triggerShock()` |
| espacio (mantener) | Invierte el signo de `radialStrength` mientras se sostiene | `keydown`/`keyup` de `Space` |
| puntero | Define la posición del atractor (`params.attractor`) vía raycast sobre el plano `Z=0` | `pointermove` |
| salir de la ventana / `pointerleave` | Apaga las fuerzas ligadas al mouse (`pointerActive = 0`) | evita el "rayo a la nada" |

Nueve controles con función interpretativa distinta (más los sliders de calibración,
propios de LAB). El espacio y el mouse son los dos gestos realmente "en vivo": el resto
son capas que se activan/desactivan como bloques de la coreografía.

---

## 2. Mapa del sistema

```
CONTROLES DEL INTÉRPRETE (teclado, mouse)
          ↓
PARÁMETROS / UNIFORMS (parameters.js)
          ↓
GPU COMPUTE (createSimulation.js → updateParticles)
estado → fuerzas → aceleración → velocidad → posición
          ↓
BUFFERS DE POSICIÓN Y VELOCIDAD (positionBuffer, velocityBuffer)
          ↓
RENDER (SpriteNodeMaterial + InstancedMesh)
```

### Estado

Todo el estado físico vive en la GPU, en dos *storage buffers* creados con `instancedArray`:

| Buffer | Tipo | Qué guarda | Dónde |
|---|---|---|---|
| `positionBuffer` | `vec3` × 131 072 | Posición de cada partícula | `createSimulation.js`, inicio de `createSimulation` |
| `velocityBuffer` | `vec3` × 131 072 | Velocidad de cada partícula | `createSimulation.js`, junto a `positionBuffer` |

No hay estado por fuera de la GPU: no existe una lista en JavaScript de posiciones que se
actualice por frame. Eso es justamente lo que `PRUEBAS_Y_DEPURACION.md` marca como error
típico ("actualizar partículas en JavaScript"), y no ocurre en mi implementación.

### Pasos de compute

| Paso | Qué hace | Dónde |
|---|---|---|
| `initParticles` | Nace cada partícula en una posición aleatoria dentro de `boundsSize × 0.25` y con velocidad aleatoria escalada por `initialSpeed` | `createSimulation.js` |
| `updateParticles` | **El corazón del sistema**: suma las 7 fuerzas, integra velocidad y posición, aplica el techo de velocidad, recicla partículas fuera del radio de expansión y aplica el contorno periódico | `createSimulation.js` |

### Fuerzas

Bloque único dentro de `updateParticles`, comentado por bloques `1)` a `7)` en
`createSimulation.js`. Los primeros cuatro bloques son variantes del caso base; los
últimos tres (expansión, turbulencia, shock) son capas nuevas que agregué.

| # | Fuerza | Uniforms | Base o nueva |
|---|---|---|---|
| 1 | Viento (dirección = hacia el mouse) | `windEnabled`, `windStrength` | Variante del caso base |
| 2 | Radial con radio de alcance | `radialEnabled`, `radialStrength`, `attractorRadius`, `softening` | Variante del caso base |
| 3 | Vórtice con desvanecimiento por distancia | `vortexEnabled`, `vortexStrength`, `vortexRadius` | Variante del caso base |
| 4 | Drag lineal | `dragEnabled`, `dragCoefficient` | Igual al caso base |
| 5 | Expansión (pulso) | `expansionPulse`, `expansionStrength`, `expansionRadius` | Nueva |
| 6 | Turbulencia | `turbulenceEnabled`, `turbulenceStrength`, `turbulenceSeed` | Nueva |
| 7 | Shock | `shockActive`, `shockStrength`, `shockRadius` | Nueva |

### Integración

Al final de `updateParticles`, `createSimulation.js`. **Euler semi-implícito**, masa
unitaria (`a = F`):

```
v ← v + F·dt              dt = params.dt × timeScale
v ← clamp(v, maxSpeed)     si |v| > maxSpeed, se recorta la magnitud sin cambiar dirección
p ← p + v·dt
p ← mod(p + half, boundsSize) - half     contorno periódico, por eje, todos a la vez
```

Se actualiza primero la velocidad y después la posición con la velocidad ya actualizada
— eso es lo que hace "semi-implícito" y no "explícito".

Además, después de la integración hay un **reciclaje de expansión**: si una partícula
queda a más de `expansionRadius` del centro, se reposiciona cerca del centro con
velocidad reducida (`v *= 0.2`). Esto es lo que permite que el pulso de expansión (`E`)
se pueda disparar una y otra vez sin que el sistema "se vacíe" hacia afuera.

### Render

`createSimulation.js`, después del bloque de compute.

- `SpriteNodeMaterial` con `AdditiveBlending`, `depthWrite: false`, `transparent: true`.
- `InstancedMesh` de 131 072 instancias sobre un `PlaneGeometry(1,1)`.
- `positionNode` ← `positionBuffer.toAttribute()`: el render lee el estado ya calculado,
  no recalcula física.
- `colorNode`: interpola azul `#46a6ff` → naranja `#ffb35a` según `speed / maxSpeed`. El
  color no es decorativo: dice qué tan rápido va cada partícula (visible en la Imagen 3,
  donde el sistema entero está saturado de naranja porque está cerca de `maxSpeed`).
- `opacityNode`: máscara circular para que cada sprite cuadrado se vea como un punto.

### Controles y modos (CPU)

| Responsabilidad | Dónde |
|---|---|
| Escena, cámara, renderer, loop | `main.js` |
| Proyección puntero → mundo (raycast sobre plano `Z=0`) | `main.js`, listener `pointermove` |
| Presets de verificación (LAB, teclas `1`–`5`) | `main.js`, `applyPreset` |
| Disparo de expansión/turbulencia/shock | `main.js`, listeners `keydown`/`keyup` |
| Inversión temporal de la fuerza radial (espacio) | `main.js`, listeners `Space` |
| Modo LAB / PERFORMANCE | `main.js`, `setMode` |
| Panel de sliders y checkboxes | `labPanel.js`, `createLabPanel` |
| HUD con mapa de teclas | `main.js`, elemento `.hud` |

### Archivos

| Archivo | Responsabilidad |
|---|---|
| `src/main.js` | Escena, cámara, renderer, loop, interacción, modos, teclado, HUD |
| `src/simulation/parameters.js` | Uniforms: puente CPU→GPU. Cambiar `.value` no recompila el shader |
| `src/simulation/createSimulation.js` | Estado GPU, compute (fuerzas + integración) y render |
| `src/ui/labPanel.js` | Panel de LAB: sliders, checkboxes y botones de prueba |
| `src/styles.css` | Estilos del panel y del HUD |

---

## 3. Ficha de fuerzas

Notación: `p` posición, `v` velocidad, `A` = `params.attractor` (posición del mouse en
el plano de simulación), `d = max(‖A − p‖, softening)`, `û = (A − p)/d`.

### Fuerza 1 · Viento — checkbox "Viento", tecla `2` (preset)

```
dirección = A / max(‖A‖, softening)
F_w = dirección · windStrength · windEnabled · pointerActive
```

| Parámetro | Uniform | Defecto |
|---|---|---|
| magnitud | `windStrength` | `3.0` |

- **Decisión de diseño (variante sobre el caso base):** en el proyecto original el viento
  era un vector fijo, solo editable con un slider. Cambié la variante para que la
  **dirección** la dé la posición del mouse respecto al centro, y que `windStrength` sea
  solo la magnitud. Esto convierte el viento en un control gestual: mover el mouse cambia
  hacia dónde sopla, en vivo.
- **Predicción:** con velocidad inicial cero y el mouse fijo en un punto, la velocidad
  del conjunto debe crecer en la dirección de ese punto respecto al centro.

### Fuerza 2 · Radial (atracción/repulsión) — checkbox "Radial", teclas `3`/`4`

```
F_r = û · radialStrength / d²  ·  radialEnabled · pointerActive · step(d, attractorRadius)
```

| Parámetro | Uniform | Defecto |
|---|---|---|
| magnitud (con signo) | `radialStrength` | `2.2` (positivo = atrae) |
| suavizado | `softening` | `0.35` |
| radio de alcance | `attractorRadius` | `3.5` |

- Esta es la fuerza que coincide **exactamente** con el modelo mínimo de la unidad
  (`F_r = r̂·k/d²`, con `s` evitando la singularidad cerca del atractor).
- **Decisión de diseño (variante sobre el caso base):** el proyecto original aplicaba
  esta fuerza a todo el sistema sin importar la distancia. Añadí `attractorRadius` y la
  función `step` para que solo las partículas dentro de ese radio la sientan — así el
  atractor tiene un alcance definido en vez de actuar sobre el sistema entero.
- **Predicción:** con `radialStrength > 0`, la aceleración apunta hacia el atractor y la
  distancia media al atractor **baja**. Con el signo invertido (tecla `4`, o espacio
  sostenido), la distancia **sube**.

### Fuerza 3 · Vórtice — checkbox "Vórtice", tecla `5` (combinado con radial + drag)

```
tangente = ẑ × û
falloff = clamp(1 − d/vortexRadius, 0, 1)
F_t = tangente · vortexStrength · vortexEnabled · pointerActive · falloff
```

| Parámetro | Uniform | Defecto |
|---|---|---|
| magnitud | `vortexStrength` | `1.4` |
| radio de desvanecimiento | `vortexRadius` | `3.5` |

- **Decisión de diseño (variante sobre el caso base):** el vórtice original giraba con la
  misma fuerza sin importar la distancia al atractor. Añadí `vortexFalloff`: fuerte cerca
  del atractor, se apaga linealmente hasta 0 en `vortexRadius`. El preset `5` la combina
  con una radial débil (`radialStrength = 1.0`) y drag (`dragCoefficient = 0.08`) para
  que el giro no crezca sin control.
- **Predicción:** debe aparecer una componente de giro alrededor del atractor —no una
  órbita circular perfecta prescrita de antemano, sino una tendencia tangencial que emerge
  de sumar radial + tangente + drag.

### Fuerza 4 · Drag lineal — checkbox "Drag" (activo por defecto)

```
F_d = −v · dragCoefficient · dragEnabled
```

| Parámetro | Uniform | Defecto |
|---|---|---|
| coeficiente | `dragCoefficient` | `0.12` |

- **Dirección:** opuesta a la velocidad; es un freno, no un empuje.
- **Predicción:** sobre un sistema en movimiento, la rapidez decae más rápido que sin
  drag, frente al mismo escenario.

### Fuerza 5 · Expansión (pulso) — tecla `E` — **fuerza nueva**

```
dirección = p / max(‖p‖, softening)
F_e = dirección · expansionStrength · expansionPulse
```

| Parámetro | Uniform | Defecto |
|---|---|---|
| magnitud | `expansionStrength` | `16.0` |
| radio de reciclaje | `expansionRadius` | `4.0` |

- `expansionPulse` no es un interruptor binario: en `main.js` decae cada frame
  (`params.expansionPulse.value *= 0.93`), así que el pulso es un impulso corto con
  envolvente exponencial, no una fuerza sostenida.
- **Decisiones de calibración (documentadas en el propio código):**
  - `expansionStrength` subió de `6` a `16` porque con `6` el impulso total en todo el
    pulso era de solo ~1.4 unidades de velocidad, casi imperceptible frente a
    `maxSpeed = 5`.
  - El radio de nacimiento en `initParticles` bajó de `0.45×boundsSize` a
    `0.25×boundsSize`: con `0.45` las partículas nacían ya fuera de `expansionRadius`
    (`4.0`) y se reciclaban de inmediato al arrancar la simulación.
- **Predicción:** al disparar `E`, la rapidez media del sistema debe subir de golpe y
  luego decaer siguiendo aproximadamente una curva `0.93ⁿ` mientras no haya otras fuerzas
  sosteniéndola.

### Fuerza 6 · Turbulencia — tecla `T` (mantener) — **fuerza nueva**

```
dirección = random3(i, turbulenceSeed).normalize()
F_tb = dirección · turbulenceStrength · turbulenceEnabled
```

| Parámetro | Uniform | Defecto |
|---|---|---|
| magnitud | `turbulenceStrength` | `20.0` |

- La dirección aleatoria por partícula cambia cada 5 frames (`turbulenceSeed` avanza con
  `Math.floor(frameCount / 5)`), no cada frame — así el ruido no vibra tan rápido que se
  vea como estática pura.
- **Predicción:** con turbulencia sola, el sistema debe verse "hervir" sin una dirección
  neta preferente (el promedio vectorial de las fuerzas debería tender a cero).

### Fuerza 7 · Shock — tecla `G` — **fuerza nueva**

```
dirección = (p − A) / max(‖p − A‖, softening)
F_s = dirección · shockStrength · step(‖p−A‖, shockRadius) · shockActive · pointerActive
```

| Parámetro | Uniform | Defecto |
|---|---|---|
| magnitud | `shockStrength` | `14.0` |
| radio de corte | `shockRadius` | `3.0` |

- `shockActive` se enciende y se apaga con `setTimeout` de 300 ms (`triggerShock` en
  `main.js`) — un pulso corto y duro, con corte abrupto en `shockRadius` (`step`, no
  desvanecimiento), a diferencia de la expansión que decae suavemente.
- **Predicción:** un golpe radial hacia afuera **desde el atractor** (no desde el
  centro del sistema, esa es la diferencia con la expansión), limitado a las partículas
  dentro de `shockRadius`.

### Contorno · periódico (sin tecla)

```
p ← mod(p + boundsSize/2, boundsSize) − boundsSize/2
```

No es una capa expresiva: es la condición de contorno que aplica siempre, después de
integrar. Una partícula que sale por una cara reaparece por la opuesta.

---

## 4. Registro de pruebas

**Método para obtener números reales (pendiente de ejecutar, ver §8).** El HUD y el
panel LAB no muestran velocidades o distancias promedio numéricas; para llenar esta
tabla con datos reales (no "se ve bien") hay dos caminos:

1. Añadir temporalmente un `console.log` en el loop de `main.js` que promedie
   `velocityBuffer` leyendo el buffer de vuelta con
   `await renderer.getArrayBufferAsync(simulation.velocityBuffer.value)` cada cierto
   número de frames, y comparar antes/después de activar cada preset.
2. Como alternativa más simple, observar visualmente el cambio de color (azul→naranja
   indica rapidez creciente) y anotar el frame aproximado en el que el sistema se
   estabiliza, describiendo la tendencia con precisión aunque no sea una cifra exacta.

### Las cinco pruebas base (LAB, teclas `1`–`5`)

| # | Prueba | Fuerzas activas | Condición inicial | Predicción | Observación | ✔ |
|---|---|---|---|---|---|---|
| 1 | Inercia | Ninguna | `initialSpeed = 0.8`, sin fuerzas | La velocidad conserva su dirección; no debería frenar ni acelerar | LISTA
| 2 | Viento +dirección mouse | Viento | velocidad inicial ≈ 0 | La velocidad crece en la dirección del mouse respecto al centro | LISTA
| 3 | Atracción | Radial (`radialStrength = 3.0`) | velocidad inicial ≈ 0 | La distancia media al atractor baja | LISTA
| 4 | Repulsión | Radial (`radialStrength = -3.0`) | misma configuración que 3 | La distancia media al atractor sube | LISTA
| 5 | Vórtice | Radial débil + Vórtice + Drag | partículas alrededor del atractor | Aparece componente de giro; no es una simple atracción radial | LISTA

### Prueba específica: decaimiento del pulso de expansión (fuerza propia)

Esta es la prueba de mi fuerza nueva y la que justifica la calibración de
`expansionStrength` y del radio de nacimiento documentada en §3 y §6.

**Predicción.** `params.expansionPulse.value` decae geométricamente cada frame
(`×0.93`). Después de `n` frames sin volver a pulsar `E`, el valor restante debería ser
`0.93ⁿ` del valor inicial (`1.0`), y la rapidez media del sistema debería subir de golpe
al pulsar `E` y luego decaer siguiendo esa misma curva mientras el drag y el reciclaje no
la compensen antes.



**Modificación deliberada de un parámetro (pendiente de ejecutar y anotar).** Bajar
`expansionStrength` de `16` a `6` (el valor original antes de mi corrección) y repetir la
prueba en `n = 0` debería mostrar un salto de rapidez mucho menor —esto es lo que motivó
subirlo, según el comentario que dejé en el propio código—. Falta correrlo y anotar la
cifra exacta aquí.

---

## 5. Score visual de *LesAlpx*

### Vocabulario de conducción disponible en mi instrumento

| Intención | Gesto | Resultado dinámico |
|---|---|---|
| Organización / recogimiento | tecla `3` (atracción) | El sistema se recoge hacia el atractor |
| Ruptura | espacio sostenido | Lo que atrae empieza a repeler: estallido desde el atractor |
| Dispersión | tecla `4` (repulsión) | Expansión hacia los bordes desde el atractor |
| Giro / tensión | tecla `5` (vórtice) | Aparece rotación alrededor del atractor |
| Impulso puntual | `E` (expansión) | Golpe corto desde el centro, decae exponencialmente |
| Golpe seco | `G` (shock) | Pulso duro de 300 ms, corte abrupto en el radio |
| Caos / textura | `T` sostenida | Movimiento sin dirección neta, "hervor" |
| Deriva | tecla `2` (viento) | Movimiento sostenido en la dirección del mouse |
| Reposo | `R` | Vuelve al estado inicial |

**La cadena que debo poder explicar:**

```
escucha → intención → score → interpretación → fuerzas → comportamiento emergente
```

No se usa kick, amplitud, beat ni FFT en ningún punto de esa cadena. El único mecanismo
de control soy yo decidiendo qué tecla pulsar y cuándo.

---

## 6. Bitácora de IA

Estas son las decisiones documentadas directamente en los comentarios que dejé dentro de
`parameters.js` y `createSimulation.js` mientras trabajaba con IA generativa sobre el
proyecto base. Las cito porque ya estaban registradas en el código; falta ampliar esta
sección con los prompts textuales que usé (ver §8).

### Cambio 1 — Viento: de vector fijo a dirección por mouse

**Estado anterior (caso base):** el viento era `params.wind`, un vector fijo que solo se
editaba con un slider.

| Decisión | Resultado |
|---|---|
| ✅ Aceptado | Cambiar la fuerza para que `windStrength` sea solo la magnitud y la dirección se calcule en el shader a partir de `params.attractor` (posición del mouse) |
| Razón | Quería que mover el mouse cambiara la dirección del viento en vivo, como gesto interpretativo, no solo su intensidad |

### Cambio 2 — Radial: de "afecta todo el sistema" a "radio de alcance"

**Estado anterior (caso base):** la fuerza radial afectaba a todas las partículas sin
importar la distancia al atractor.

| Decisión | Resultado |
|---|---|
| ✅ Aceptado | Añadir `attractorRadius` y una función `step(distance, attractorRadius)` que corta la fuerza fuera de ese radio |
| Razón | Quería que el atractor tuviera un alcance definido, no que actuara como un campo global |

### Cambio 3 — Vórtice: de fuerza constante a desvanecimiento por distancia

**Estado anterior (caso base):** el vórtice giraba con la misma fuerza en todo el
sistema, sin importar la distancia al atractor.

| Decisión | Resultado |
|---|---|
| ✅ Aceptado | Añadir `vortexFalloff = clamp(1 − distance/vortexRadius, 0, 1)`: fuerte cerca del atractor, se apaga linealmente hacia `vortexRadius` |
| Razón | Un giro con la misma fuerza en todo el espacio no distingue "cerca del atractor" de "lejos"; quería que el giro perdiera fuerza con la distancia, como una órbita real que se desvanece hacia afuera |

### Cambio 4 — Expansión: corrección de magnitud imperceptible

**Estado anterior:** `expansionStrength = 6`.

| Decisión | Resultado |
|---|---|
| 🔧 Corregido | Subir `expansionStrength` de `6` a `16` |
| Razón (documentada en el código) | Con `6`, el impulso total en todo el pulso era de solo ~1.4 unidades de velocidad, casi imperceptible frente a `maxSpeed = 5` |

### Cambio 5 — Corrección del radio de nacimiento de partículas

**Estado anterior:** las partículas nacían en `boundsSize × 0.45` de radio.

| Decisión | Resultado |
|---|---|
| 🔧 Corregido | Bajar el radio de nacimiento en `initParticles` a `boundsSize × 0.25` |
| Razón (documentada en el código) | Con `0.45` (= 4.5 unidades), las partículas nacían más lejos que `expansionRadius` (`4.0`), así que se reciclaban de inmediato al arrancar la simulación, en vez de empezar dentro del volumen de trabajo |

### Lo que falta documentar aquí

- Los prompts textuales que usé para pedir cada una de estas modificaciones.
- Qué propuso la IA primero y qué tuve que corregirle (si algo falló en un primer
  intento, como le pasó a mi compañera con el bug de `intensity` en PERFORMANCE).
- Alguna alternativa que haya considerado y descartado explícitamente.

---

## 7. Autoevaluación ponderada

| Criterio | Peso | Qué debe demostrar la evidencia | Evidencia concreta | Valoración |
|---|---:|---|---|---:|
| Trazabilidad y comprensión del sistema | 25 | Puedo señalar y explicar estado, fuerzas, integración, render y controles; ubico qué produjo o modificó la IA | Explicación detallada de la arquitectura modular (main.js, parameters.js, createSimulation.js), diferenciación entre estado GPU/CPU y mapa visual del sistema. | 4.2|
| Verificación del algoritmo de fuerzas | 25 | Aíslo una fuerza central, predigo, ejecuto, comparo y cambio un signo o parámetro deliberadamente | Formulación matemática de las 7 fuerzas, aislamiento mediante presets (1-5) y prueba de decaimiento del pulso de expansión. | 4.6|
| Diseño de fuerzas e intención | 20 | Las fuerzas hacen perceptible una intención; el comportamiento emerge de la dinámica | Implementación de 3 fuerzas nuevas (Expansión, Turbulencia, Shock) y modificación de variantes base (viento dinámico y falloff en vórtice). | 4.5|
| Instrumento, score e interpretación | 15 | El score conecta la escucha con decisiones; pocos controles expresivos; conducción sin audio automático | Mapeo de 9 controles expresivos en teclado/mouse y estructuración del score visual para LesAlpx en modo performance |4.2 |
| Experimentación y criterio frente a la IA | 10 | Comparé alternativas, registré hallazgos y descartes, corregí propuestas de IA | Registro de decisiones de diseño y corrección de parámetros fallidos (radio de nacimiento y magnitud de expansión). |4.4 |
| Entrega técnica y documentación | 5 | La URL pública abre; la bitácora permite verificar el proceso | Bitácora en .md estructurada rigurosamente, código limpio en TSL y proyecto publicado funcionalmente. | 4.6|
| **Total** | **100** | | | 4.4|

## 8. Qué falta y qué no está verificado

Para ser honesto y no caer en lo que la unidad prohíbe explícitamente ("afirmar que la IA
lo hizo" o presentar "una captura bonita" como evidencia suficiente):

- **No he corrido las pruebas del §4 con números reales.** Las predicciones están
  formuladas, pero las observaciones son placeholders. Sin esto, el criterio de
  "Verificación del algoritmo de fuerzas" (25% del total) no está realmente sustentado
  todavía.
- **El score visual (§5) está vacío.** Depende de mi escucha real de *LesAlpx* con el
  instrumento corriendo, no lo puedo completar de antemano.
- **La bitácora de IA (§6)** por ahora solo recoge lo que ya estaba comentado en el
  código. Me falta reconstruir los prompts reales que usé y si hubo algo que la IA
  propuso mal y tuve que corregir en una segunda vuelta.

