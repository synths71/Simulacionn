# **U3 · Forces Instrument — Bitácora**

---

**Jhon Alejandro Giraldo.**  
Instrumento visual basado en fuerzas, construido sobre el caso de estudio forces-instrument-u3 con asistencia de IA generativa, verificado con predicciones medibles y preparado para interpretación en tiempo real.  
Esta bitácora está ordenada según los entregables del encargo. Cada afirmación sobre el comportamiento del sistema apunta a un archivo y una línea concretos, y cada decisión de diseño especifica qué se aceptó, qué se corrigió y qué se descarté de las propuestas de la IA.

## **Enlace de la aplicación**

[https://synths71.github.io/Test-Sim/](https://synths71.github.io/Test-Sim/)

## **Índice**

1. [Instrumento funcional y publicado](#bookmark=id.v1jrpehu6qqr)  
2. [Mapa del sistema](#bookmark=id.p69v88n62f7b)  
3. [Ficha de fuerzas](#bookmark=id.r6sbecz6gd8a)  
4. [Registro de pruebas](#bookmark=id.9y8pjxrul5xn)  
5. [Score visual de LesAlpx](#bookmark=id.w10dn1sri058)  
6. [Bitácora de IA](#bookmark=id.n3c8w7hwecnk)  
7. [Autoevaluación ponderada](#bookmark=id.2e8iijm55g6t)  
8. [Ejecutar y publicar](#bookmark=id.61p4169ffmin)

## **1\. Instrumento funcional y publicado**

**URL pública:** [https://synths71.github.io/Test-Sim/](https://synths71.github.io/Test-Sim/)  
Verificado en entorno local corriendo npm run dev y en el despliegue público en GitHub Pages: carga el canvas de WebGPU sin errores en consola, inicializa el WebGPURenderer, presenta el panel LAB interactivo y permite alternar fluidamente al modo PERFORMANCE mediante la tecla P.  
**Contrato técnico cumplido:** Web \+ Three.js 0.185.1 \+ WebGPURenderer \+ TSL \+ GPU Compute \+ Vite 8.2.1.

### **Los dos modos**

| Modo | LAB | PERFORMANCE   |
| :---- | :---- | :---- |
| **Propósito** | Comprender, aislar y verificar cada fuerza y figura por separado. | Interpretar en tiempo real combinando capas y gestos. |
| **Panel (labPanel.js)** | Visible: controles deslizantes, botones de prueba y parámetros. | Oculto para favorecer la interpretación gestual. |
| **Elementos de guía** | Ejes y marcador de atractor visibles. | Ejes y marcador de atractor ocultos. |
| **Cámara (OrbitControls)** | Órbita interactiva activa. | Cámara bloqueada para encuadre escénico. |
| **Teclas 1–5** | Presets de prueba que aíslan la fuerza/figura y ejecutan reset. | Conmutadores (toggles) para superponer o quitar fuerzas/figuras en vivo. |
| **Expresividad gestual** | Teclas E, T, G, N, C disponibles para validación. | Teclas E, T, G, N, C para ataques, pulsos y variaciones tímbricas. |
| **Retroalimentación** | Panel lateral completo \+ HUD superior. | HUD limpio con mapa de controles activo. |

El cambio de modo se realiza con la tecla P (main.js, función setMode). El número de partículas es fijo: **131 072 partículas** (2^17), reservadas en GPU mediante instancedArray, garantizando una carga constante y alto rendimiento.

### **Mapeo de Controles**

| Control | Acción Interpretativa / Técnica | Ubicación en Código   |
| :---- | :---- | :---- |
| P | Conmutar entre modo LAB y PERFORMANCE | main.js → setMode() |
| R | Reinicializar posiciones y velocidades a la condición inicial | main.js → simulation.reset() |
| 1 | LAB: Preset Óvalo / PERF: Activar/desactivar atracción a figura Óvalo | main.js → toggleShape('oval') |
| 2 | LAB: Preset Cardiograma / PERF: Activar/desactivar atracción a Cardiograma | main.js → toggleShape('heart') |
| 3 | LAB: Preset Espiral / PERF: Activar/desactivar atracción a Espiral | main.js → toggleShape('spiral') |
| 4 | LAB: Preset Ola / PERF: Activar/desactivar fuerza de Ola sinusoidal | main.js → toggleWave() |
| 5 | LAB: Preset Enjambre / PERF: Activar/desactivar dinámica de Enjambre orbitante | main.js → toggleWander() |
| E | Inyección de pulso de Expansión radial (decae a 0.93/frame) | main.js → params.expansionPulse.value \= 1.0 |
| T (sostener) | Fuerza de Turbulencia pseudoaleatoria en GPU mientras se presione | main.js → params.turbulenceEnabled.value \= 1.0 / 0.0 |
| G | Pulso de Shock desde el atractor (corte duro tras 300 ms) | main.js → triggerShock() |
| N | Modo Niebla: alterna suavizado, tamaño y opacidad de sprites | main.js → toggleMist() |
| C | Conmutar paletas de color para el renderizado cromático por velocidad | main.js → cyclePalette() |
| Puntero (Mouse) | Proyección Raycast sobre plano Z=0 para actualizar la posición del atractor | main.js → listener pointermove |

## **2\. Mapa del sistema**

CONTROLES DEL INTÉRPRETE (Teclado, Mouse)  
          ↓  
PARÁMETROS / UNIFORMS (parameters.js)  
          ↓  
GPU COMPUTE (createSimulation.js → updateParticles)  
  estado → fuerzas (Ola, Enjambre, Drag, Expansión, Turbulencia, Shock, Figura)  
         → aceleración → velocidad → posición  
          ↓  
BUFFERS DE POSICIÓN Y VELOCIDAD (positionBuffer, velocityBuffer en VRAM)  
          ↓  
RENDER (SpriteNodeMaterial \+ InstancedMesh \+ TSL Color/Opacity Nodes)

### **Estado Físico en GPU**

| Buffer | Tipo y Dimensión | Función y Almacenamiento | Ubicación en Código   |
| :---- | :---- | :---- | :---- |
| positionBuffer | vec3 × 131 072 | Almacena las coordenadas (x, y, z) de cada partícula en VRAM. | createSimulation.js |
| velocityBuffer | vec3 × 131 072 | Almacena los vectores de velocidad (vx, vy, vz) en VRAM. | createSimulation.js |

### **Pasos del Compute Shader**

* initParticles: Asigna posiciones aleatorias dentro de boundsSize × 0.25 y velocidades iniciales escaladas por initialSpeed. Se ejecuta al arrancar o presionar R.  
* updateParticles: Kernel principal que se ejecuta cada frame sobre las 131 072 instancias. Acumula fuerzas, aplica integración numérica, limita velocidad máxima, reposiciona partículas en expansión y aplica contorno periódico.

### **Estructura de Fuerzas Acumuladas**

| \# | Fuerza | Uniforms Involucrados | Tipo / Origen   |
| :---- | :---- | :---- | :---- |
| 1 | Ola (Wave) | waveEnabled, waveStrength, waveFrequency, waveTime | Nueva implementación elíptica |
| 2 | Enjambre (Wander) | wanderEnabled, wanderStrength, wanderOrbitStrength, wanderPoint | Nueva implementación orbitante |
| 3 | Drag (Fricción) | dragCoefficient | Caso base disipativo |
| 4 | Expansión (Pulse) | expansionPulse, expansionStrength, expansionRadius | Nueva capa impulsiva |
| 5 | Turbulencia | turbulenceEnabled, turbulenceStrength, turbulenceSeed | Nueva fuerza estocástica en GPU |
| 6 | Shock | shockActive, shockStrength, shockRadius, pointerActive | Nueva fuerza de impacto radial |
| 7 | Atracción a Figura | shapeWeightOval, shapeWeightHeart, shapeWeightSpiral, shapeStrength, shapeRadius, shapeJitter, shapeSpiralTurns | Nueva geometría vectorial destructible |

### **Integración Numérica y Geometría de Contorno**

El cálculo de movimiento utiliza el algoritmo **Euler Semi-implícito** con masa unitaria:

v ← v \+ F · dt                    (dt \= params.dt × params.timeScale)  
v ← clamp(v, maxSpeed)            (limitación de magnitud vectorial)  
p ← p \+ v · dt  
p ← mod(p \+ boundsHalf, boundsSize) \- boundsHalf  (contorno periódico continuo)

Adicionalmente, se ejecuta un reciclaje espacial en GPU: si una partícula supera expansionRadius, su posición renace en el núcleo central con velocidad atenuada (v \*= 0.2), permitiendo pulsos repetitivos sin vaciado de la escena.

### **Renderizado y Shading (TSL)**

* SpriteNodeMaterial con AdditiveBlending, depthWrite: false y transparent: true.  
* InstancedMesh que reutiliza una única geometría PlaneGeometry(1,1) para las 131 072 instancias.  
* colorNode: Interpola dinámicamente entre colorSlow (azul/rosa/verde) y colorFast (naranja/amarillo/púrpura) según la magnitud de velocidad speed / maxSpeed.  
* opacityNode: Máscara de sprite que conmuta entre borde duro y difuminado progresivo según el modo Niebla (mistMode).

### **Archivos del Proyecto**

| Archivo | Responsabilidad del Módulo   |
| :---- | :---- |
| src/main.js | Inicialización de WebGPU, loop de animación, gestión de eventos de teclado/mouse, alternancia de modos y renderizado. |
| src/simulation/parameters.js | Definición de Uniforms CPU→GPU. Permite modificar valores dinámicamente sin reinterpretar pipelines de TSL. |
| src/simulation/createSimulation.js | Definición de buffers GPU, kernels de compute shaders (init y update) y construcción de materiales NodeMaterial. |
| src/ui/labPanel.js | Interfaz de usuario en modo LAB: sliders con callback inmediato, selectores de color, botones de prueba y pausa. |
| src/styles.css | Estilos visuales para el panel flotante y el HUD de estado. |

## **3\. Ficha de fuerzas**

### **Fuerza 1 · Ola (Wave) — Tecla 4**

Imita el movimiento orbital elíptico de una ola fluida mediante componentes transversales y longitudinales:

phase \= p.x · waveFrequency \+ waveTime  
F\_wave \= vec3(cos(phase) · waveStrength · 0.35, sin(phase) · waveStrength, 0.0) · waveEnabled

| Parámetro | Uniform | Valor Defecto   |
| :---- | :---- | :---- |
| Fuerza de Ola | waveStrength | 8.0 |
| Frecuencia Espacial | waveFrequency | 1.4 |

* **Decisión de diseño:** Se incrementó waveFrequency a 1.4 para garantizar la presencia de 2 a 3 crestas simultáneas en el campo visual, agregando una componente horizontal cos(phase) en cuadratura para evitar oscillaciones puramente verticales.  
* **Predicción:** Un conjunto de partículas en reposo formará frentes ondulantes continuos que se desplazan lateralmente.

### **Fuerza 2 · Enjambre Orbitante (Wander) — Tecla 5**

Genera atracción hacia un punto dinámico (wanderPoint) combinado con un momento angular tangencial:

dir \= (wanderPoint \- p) / max(||wanderPoint \- p||, softening)  
F\_radial \= dir · wanderStrength  
F\_tangent \= (zAxis × dir) · wanderOrbitStrength  
F\_wander \= (F\_radial \+ F\_tangent) · wanderEnabled

| Parámetro | Uniform | Valor Defecto   |
| :---- | :---- | :---- |
| Atracción Radial | wanderStrength | 1.8 |
| Momento Tangencial | wanderOrbitStrength | 3.5 |

* **Decisión de diseño:** Se introdujo la componente wanderOrbitStrength para evitar que el enjambre colapse en un punto singular, generando vórtices vivos alrededor de una trayectoria de Lissajous.  
* **Predicción:** Las partículas girarán formando una nube helicoidal alrededor del punto móvil.

### **Fuerza 3 · Drag (Fricción de Fondo) — Activa por defecto**

F\_drag \= \-v · dragCoefficient

| Parámetro | Uniform | Valor Defecto   |
| :---- | :---- | :---- |
| Coeficiente Drag | dragCoefficient | 0.12 |

* **Predicción:** En ausencia de fuerzas motrices externas, la velocidad de las partículas decaerá exponencialmente hasta el reposo.

### **Fuerza 4 · Expansión (Pulse) — Tecla E**

dir \= p / max(||p||, softening)  
F\_exp \= dir · expansionStrength · expansionPulse

| Parámetro | Uniform | Valor Defecto   |
| :---- | :---- | :---- |
| Magnitud Pulso | expansionStrength | 16.0 |
| Radio Reciclaje | expansionRadius | 4.0 |

* **Decisión de calibración:** expansionPulse se inicializa en 1.0 al pulsar E y se multiplica por 0.93 en cada frame, produciendo un decaimiento impulsivo natural.  
* **Predicción:** Aumento inmediato de la velocidad radial desde el origen que se disipa rápidamente.

### **Fuerza 5 · Turbulencia Estocástica — Tecla T**

dir\_random \= normalize(hash3D(particleIndex \+ turbulenceSeed) \- 0.5)  
F\_turb \= dir\_random · turbulenceStrength · turbulenceEnabled

| Parámetro | Uniform | Valor Defecto   |
| :---- | :---- | :---- |
| Magnitud Turbulencia | turbulenceStrength | 20.0 |

* **Decisión de diseño:** turbulenceSeed se actualiza cada 5 frames para evitar parpadeos de frecuencia excesivamente alta, simulando agitación fluidodinámica.  
* **Predicción:** Dispersión caótica sin vector de fuerza neto preferencial.

### **Fuerza 6 · Shock (Impacto Radial) — Tecla G**

dir\_attractor \= (p \- attractor) / max(||p \- attractor||, softening)  
falloff \= step(||p \- attractor||, shockRadius)  
F\_shock \= dir\_attractor · shockStrength · falloff · shockActive · pointerActive

| Parámetro | Uniform | Valor Defecto   |
| :---- | :---- | :---- |
| Magnitud Shock | shockStrength | 14.0 |
| Radio de Corte | shockRadius | 3.0 |

* **Decisión de diseño:** shockActive utiliza una función de temporización en JS de 300 ms con corte discontinuo (step), generando un frente de onda expansivo acotado desde la posición del cursor.  
* **Predicción:** Expulsión violenta instantánea de las partículas situadas dentro del radio de alcance del atractor.

### **Fuerza 7 · Atracción a Figuras Vectoriales — Teclas 1, 2, 3**

F\_shape \= (targetPosition \- p) · shapeStrength · shapeWeight

| Geometría | Tecla | Ecuación de Target / Atractor Paramétrico   |
| :---- | :---- | :---- |
| **Óvalo** | 1 | (cos(t)·r·1.6·jitter, sin(t)·r·0.9·jitter, 0\) |
| **Cardiograma** | 2 | Superposición de 5 pulsos triangulares (P, Q, R, S, T) sobre el eje X. |
| **Espiral** | 3 | (sqrt(t)·r·cos(turns·t), sqrt(t)·r·sin(turns·t), 0\) |

## **4\. Registro de pruebas**

| \# | Escenario / Prueba | Fuerzas Activas | Condición Inicial | Predicción Teórica | Observación Empírica | Estado   |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | **Inercia** | Ninguna (Drag \= 0\) | Velocidad inicial \= 0.8 | La velocidad conservará su dirección y magnitud sin aceleración. | Las partículas atraviesan el volumen manteniendo trayectoria rectilínea continua. | ✔ COMPLETO |
| 2 | **Ola (Wave)** | Ola (Tecla 4\) | Partículas en reposo | Aparición de frentes sinusoidales con desplazamiento transversal. | Formación de crestas elípticas ordenadas desplazándose a lo largo del eje X. | ✔ COMPLETO |
| 3 | **Enjambre (Wander)** | Enjambre (Tecla 5\) | Partículas dispersas | Atracción hacia un centro móvil combinado con rotación tangencial. | Agrupamiento denso en forma de vórtice que sigue la curva Lissajous de wanderPoint. | ✔ COMPLETO |
| 4 | **Expansión (Pulse)** | Expansión (Tecla E) | Partículas agrupadas | Estallido radial expansivo con decaimiento exponencial 0.93/frame. | Aumento súbito de rapidez y coloración naranja/caliente, seguido de estabilización por drag. | ✔ COMPLETO |
| 5 | **Turbulencia** | Turbulencia (Tecla T) | Partículas ordenadas | Agitación caótica pseudoaleatoria sin dirección neta preferente. | Dispersión homogénea instantánea con textura fluida de agitación. | ✔ COMPLETO |
| 6 | **Shock** | Shock (Tecla G) | Partículas sobre atractor | Desplazamiento radial exterior instantáneo acotado a shockRadius \= 3.0. | Aparición de un cavidad circular limpia alrededor del mouse que se cierra tras 300 ms. | ✔ COMPLETO |
| 7 | **Figuras Vectoriales** | Figura (Teclas 1, 2 o 3\) | Partículas caóticas | Convergencia de las partículas hacia los contornos paramétricos definidos. | Estructuración rápida en contornos continuos de óvalo, pulso ECG o espiral. | ✔ COMPLETO |

## **5\. Score visual de LesAlpx**

Estructura de interpretación musical para la pieza *LesAlpx* de Floating Points:

| Tramo Temporal | Elemento Musical Escuchado | Intención Expresiva | Gesto / Controles | Comportamiento Emergente   |
| :---- | :---- | :---- | :---- | :---- |
| 0:00 – 0:45 | Sintetizador pulsante inicial y bajo sutil. | Organización geométrica progresiva. | Tecla 1 (Óvalo) \+ movimiento suave de atractor. | Convergencia fluida en un anillo oscilante que responde al puntero. |
| 0:45 – 1:30 | Entrada del patrón rítmico principal. | Introducción de oleaje y pulso orgánico. | Tecla 4 (Ola) \+ Tecla N (Niebla). | El anillo se deforma en frentes fluidos difusos con textura gaseosa. |
| 1:30 – 2:15 | Incremento de arpegios y saturación tímbrica. | Acumulación de tensión y dinamismo. | Tecla 5 (Enjambre) \+ Tecla C (Cambio de color). | Vórtices densos de alta velocidad con gradiente cromático brillante. |
| 2:15 – 2:40 | Crescendo acelerado hacia el clímax. | Agitación y ruptura estructural. | Mantener T (Turbulencia) \+ Pulsos repetidos E. | Estallidos expansivos caóticos con dispersión por todo el canvas. |
| 2:40 – 3:30 | Drop principal de la canción (Impacto potente). | Impactos rítmicos secos sincronizados. | Golpes secos con tecla G (Shock) sobre los percusivos. | Cavidades circulares instantáneas que expulsan la materia hacia los bordes. |
| 3:30 – 4:15 | Desarrollo melódico complejo. | Reorganización estructural orgánica. | Tecla 2 (Cardiograma) y Tecla 3 (Espiral). | Transformación de la masa caótica en oscilograma de picos de pulso. |
| 4:15 – Fin | Decaimiento y resolución de la pieza. | Relajación y disipación progresiva. | Desactivar fuerzas \+ Tecla R al silencio final. | Frenado por drag hasta el reposo total y reinicio del sistema. |

## **6\. Bitácora de IA**

### **Ciclo 1: Implementación de Figuras Vectoriales Paramétricas**

* **Prompt enviado:** "Requiero reemplazar la fuerza radial básica por atracciones a contornos vectoriales (Óvalo, Cardiograma ECG y Espiral) que se puedan activar en tiempo real con las teclas 1, 2 y 3."  
* **Aceptado:** La formulación matemática de las ecuaciones paramétricas en TSL utilizando trianglePulse para armar las crestas P-Q-R-S-T del electrocardiograma.  
* **Corregido:** La propuesta inicial calculaba el objetivo fuera de los buffers; se reestructuró para ejecutar la mezcla de pesos (shapeTargetBlend) directamente en el kernel GPU dentro de createSimulation.js.

### **Ciclo 2: Calibración del Enjambre Orbitante y Ola**

* **Prompt enviado:** "La ola se ve plana y el enjambre colapsa en el centro. ¿Cómo les doy dinámica de fluido?"  
* **Aceptado:** Adición de la componente tangencial wanderOrbitStrength (producto cruz con vector Z) para generar rotación orbital.  
* **Corregido:** Se ajustó waveFrequency de 0.6 a 1.4 y se añadió la componente cosinusoidal horizontal en cuadratura para lograr el movimiento elíptico de ola.

### **Ciclo 3: Ajuste del Renderizado en Modo Niebla**

* **Prompt enviado:** "El modo Niebla hace que los sprites se vean como círculos gigantes superpuestos."  
* **Aceptado:** Reducción del multiplicador de tamaño (mistSizeMultiplier) a 0.85 y suavizado de bordes con smoothstep(0.15, 0.5, dist) en el shader de opacidad.

## **7\. Autoevaluación ponderada**

| Criterio | Peso (%) | Evidencia Concreta en Bitácora y Código | Valoración (0-5)   |
| :---- | :---- | :---- | :---- |
| **Trazabilidad y comprensión del sistema** | 25 | Mapa del sistema completo (§2) con desglose de VRAM, paso a paso del Compute Shader, asignación de uniforms y renderizado TSL. | 4.2 |
| **Verificación del algoritmo de fuerzas** | 25 | Tabla del registro de pruebas (§4) con las 7 experiencias verificadas y validadas contra las predicciones teóricas. | 4.6 |
| **Diseño de fuerzas e intención** | 20 | Ficha de fuerzas (§3) detallando la matemática de las 7 fuerzas emergentes, impulsivas y estocásticas implementadas. | 4.5 |
| **Instrumento, score e interpretación** | 15 | Score visual (§5) mapeado minuciosamente contra los bloques temporales y dinámicos de la obra *LesAlpx*. | 4.2 |
| **Experimentación y criterio frente a la IA** | 10 | Registro de la Bitácora de IA (§6) detallando las decisiones de diseño, prompts clave y correcciones de código GPU. | 4.4 |
| **Entrega técnica y documentación** | 5 | Publicación funcional en GitHub Pages sin errores de consola, contrato técnico WebGPU cumplido y bitácora estructurada. | 4.6 |
| **Total Puntos** | **100** | **Evaluación global sustentada del instrumento funcional** | **4.4** |

