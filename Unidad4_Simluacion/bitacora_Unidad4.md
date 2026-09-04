# Bitácora — Unidad 4: Oscilaciones
## Proyecto: *Enjambre Kuramoto* (luciérnagas acopladas)

https://synths71.github.io/Simulacionn/Unidad4_Simluacion/kuramoto-enjambre.html

---

## 1. Descripción general

El proyecto es un enjambre de 12 agentes ("luciérnagas") cuya fase interna se rige por
una variación del **modelo de Kuramoto**. Cada agente pertenece a una de 4 personalidades
(Errante, Ancla, Rebelde, Disidente), que determinan su frecuencia natural, su fuerza de
acoplamiento y su timbre sonoro. El sistema es audiovisual: cada vez que un agente completa
un ciclo de fase (pasa por 0), "dispara" —emite partículas de luz y una nota musical en una
escala pentatónica—. El usuario puede intervenir el sistema en tiempo real: modificando el
acoplamiento global K, la dispersión de frecuencias naturales ω, perturbando agentes
individuales con clic, o perturbando 3 agentes aleatorios con un botón. El grado de
sincronización colectiva se mide con el parámetro de orden **r** y se muestra explícitamente
en pantalla junto a una etiqueta de estado (desorden / organización parcial / organización
estable).

---

## 2. Qué representa cada variable del modelo 

El modelo de Kuramoto clásico se define como:

```
dθᵢ/dt = ωᵢ + (K/N) · Σⱼ sin(θⱼ − θᵢ)
```

A continuación, el mapeo exacto entre cada término matemático y su implementación en el código.

### 2.1 θᵢ — fase del agente (`this.theta`)

Es el estado dinámico central de cada agente: un ángulo entre 0 y 2π que avanza en el tiempo.
Se inicializa aleatoriamente (`random(TWO_PI)`) para garantizar que el sistema arranque en
desorden. Visualmente, θᵢ no se dibuja como un ángulo abstracto, sino que se traduce en un
evento discreto: cuando θᵢ cruza 0 (`this.prevTheta > TWO_PI*0.85 && this.theta < TWO_PI*0.15`),
el agente "dispara" luz y sonido. Es decir, **la fase se convierte en un pulso perceptible**,
igual que el destello real de una luciérnaga ocurre en un punto específico de su ciclo interno,
no de forma continua.

### 2.2 ωᵢ — frecuencia natural (`omega()`)

Representa qué tan rápido *querría* oscilar cada agente si no estuviera acoplado a los demás.
En el código:

```js
omega() {
  const media = 1.2;
  return media + (this.p.omegaBase - media) * rangoOmega;
}
```

Cada personalidad tiene un `omegaBase` propio (Errante = 2.2, Ancla = 0.55, Rebelde = 1.2,
Disidente = 1.2), y `rangoOmega` es el slider "Rango de ω" controlado por el usuario. Cuando
`rangoOmega = 0`, todas las ωᵢ colapsan a la media (1.2): los agentes son natural­mente idénticos.
Cuando `rangoOmega` aumenta, cada personalidad se aleja de la media según su `omegaBase`,
ampliando la heterogeneidad natural del enjambre. **ω es, por tanto, la fuente de la diversidad
individual que el acoplamiento debe vencer para lograr sincronía.**

### 2.3 K — fuerza de acoplamiento (`kGlobal`, `kEfectiva()`)

K mide cuánto le "importa" a cada agente la fase de los demás. En el modelo original, K es un
único número global. Aquí se implementó una **extensión deliberada**: K no es idéntico para
todos los agentes, sino que cada personalidad posee una ganancia (`mult`) que multiplica al K
global controlado por el slider:

```js
kEfectiva() {
  let base = (this.p.nombre === "Disidente")
    ? (-1.3 + 0.6 * kGlobal)
    : (kGlobal * this.p.mult);
  return base * this.resistenciaPerturbacion;
}
```

- **Errante** (`mult = 0.35`): acoplamiento débil, se resiste a alinearse.
- **Ancla** (`mult = 1.7`): acoplamiento fuerte, tira del resto hacia su fase.
- **Rebelde** (`mult = 1.0`): acoplamiento neutro, de referencia.
- **Disidente**: coeficiente que nace en −1.3 y crece con K, pero permanece **negativo** para
  valores normales de K (solo se vuelve positivo si K > ≈2.17). Un K efectivo negativo invierte
  el signo del término de acoplamiento, de modo que el agente es empujado a alejarse de la fase
  promedio del resto en lugar de acercarse.

Esto significa que **K no es un escalar único**, sino una familia de coeficientes derivados de
un solo parámetro que el usuario controla, distribuidos de forma no uniforme entre agentes. Es
la variable obligatoria de intervención en tiempo real que pide el encargo.

### 2.4 r — parámetro de orden (`ordenParametro()`)

```
r = (1/N) · | Σⱼ e^(iθⱼ) |
```

Implementado literalmente como magnitud del vector promedio de fases:

```js
function ordenParametro() {
  let sumX = 0, sumY = 0;
  for (let a of agentes) { sumX += cos(a.theta); sumY += sin(a.theta); }
  return dist(0, 0, sumX / N, sumY / N);
}
```

r ∈ [0,1] es la variable que traduce el estado microscópico (12 fases individuales) en un único
número macroscópico: 0 significa fases distribuidas uniformemente (desorden), 1 significa que
todas las fases coinciden (sincronía total). Es la variable que se comunica explícitamente en
la interfaz (`#estado`), cumpliendo el requisito de "forma perceptible de comunicar el estado
colectivo".

### 2.5 `resistenciaPerturbacion` — variable de extensión (no está en Kuramoto clásico)

```js
this.resistenciaPerturbacion = 1.0;
...
perturbar() {
  this.theta = (this.theta + random(PI*0.8, PI*1.2)) % TWO_PI;
  this.resistenciaPerturbacion = 0.01;
}
```

Al perturbar un agente, además de romper bruscamente su fase (sumarle un valor cercano a π),
se anula temporalmente su acoplamiento (`resistenciaPerturbacion ≈ 0`), y este se recupera
lentamente (`tasaRecuperacion`, distinta para "Rebelde"). Esta es la extensión explícita
justificada del modelo: **la perturbación no solo desincroniza la fase, sino que desconecta
momentáneamente al agente del resto**, simulando que un agente aturdido tarda en volver a
"escuchar" a sus vecinos antes de reintegrarse. Esto amplifica la lectura performativa de la
perturbación: se ve y se oye un agente "callado" que reaparece gradualmente.

---

## 3. Cómo estas variables producen el comportamiento observado 
### 3.1 La competencia entre ω y K

El comportamiento colectivo del sistema surge de una tensión entre dos fuerzas opuestas
codificadas en la ecuación de actualización:

```js
const dtheta = this.omega() + (this.kEfectiva() / N) * suma;
```

- El término `omega()` empuja a cada agente a avanzar a **su propio ritmo**, ignorando a los
  demás (fuerza centrífuga / individualizante).
- El término `(kEfectiva()/N) * Σ sin(θⱼ−θᵢ)` empuja a cada agente hacia la fase promedio de
  los demás, con una intensidad proporcional a qué tan lejos están (fuerza centrípeta /
  sincronizante). `sin(θⱼ−θᵢ)` es positivo cuando el otro agente va "adelante" en fase y
  negativo cuando va "atrás", por lo que el término empuja siempre en la dirección que reduce
  la diferencia de fase.

Cuando `rangoOmega` es alto (mucha dispersión natural) y K es bajo, domina la individualidad:
cada agente gira a su propio ritmo, las fases se distribuyen de forma prácticamente uniforme,
y r permanece bajo → **estado de desorden**. Al subir K con el slider, el término de acoplamiento
crece en magnitud hasta que empieza a dominar sobre ω: los agentes con mayor `mult` (Ancla,
Rebelde) comienzan a "capturar" la fase de los demás, subgrupos de agentes empiezan a disparar
casi al mismo tiempo (clusters de fase) → **organización parcial**, visible como r oscilando
entre ~0.4 y ~0.85 y como destellos que empiezan a agruparse temporalmente. Con K
suficientemente alto y dispersión de ω moderada, casi todas las fases convergen y los disparos
de luz/sonido se sincronizan en una cascada casi simultánea → **organización estable**, r > 0.85.

### 3.2 El papel del Disidente (acoplamiento negativo)

Como su K efectivo es negativo para valores normales del slider, el término de acoplamiento de
este agente tiene signo invertido: en vez de reducir su diferencia de fase con el resto, la
aumenta activamente. Esto es clave para la lectura del comportamiento: **incluso con K global
alto, el sistema nunca alcanza r = 1 de forma perfectamente estable**, porque el Disidente
introduce una fuente permanente de desincronización que compite con el resto del enjambre. Esto
se percibe como un agente que "rompe el compás" incluso cuando todos los demás ya están
alineados, evitando que la experiencia colapse en una sincronía estática y aburrida —una
decisión de diseño deliberada para mantener tensión performativa.

### 3.3 La perturbación y la recuperación como mecanismo de exploración

Al hacer clic sobre un agente (o pulsar "Perturbar enjambre"), su fase se rompe abruptamente y
su acoplamiento cae a casi 0. Esto tiene dos efectos observables encadenados:

1. **Efecto inmediato en r**: si el sistema estaba sincronizado, la ruptura de fase de uno o
   varios agentes hace caer r visiblemente (el vector promedio se descompensa).
2. **Efecto de recuperación**: como `resistenciaPerturbacion` sube lentamente de vuelta a 1
   (`tasaRecuperacion` ≈ 0.0004 por frame, más lenta en el Rebelde), el agente perturbado
   reingresa gradualmente a la influencia del acoplamiento. Se puede observar en tiempo real
   cómo r se recupera —no instantáneamente, sino como una curva—, y cómo el agente perturbado
   va "recapturando" su lugar en la fase colectiva.

Esto cumple explícitamente el requisito de poder "romper temporalmente la estabilidad y
observar cómo el sistema responde, se reorganiza o encuentra un nuevo estado": el nuevo estado
de reposo no es necesariamente idéntico al anterior, porque la fase absoluta del sistema (no
solo r) depende de la historia de acoplamientos.

### 3.4 De la fase al evento audiovisual

El paso de θᵢ (una variable continua) a un evento perceptible (destello + nota) ocurre en el
cruce por 0 de la fase. Esto es intencional: en el modelo de Kuramoto puro, θᵢ no tiene un
"evento" asociado, solo una posición angular. Aquí se interpreta θᵢ = 0 como el instante de
disparo, análogo al modelo de "integrate-and-fire" usado para explicar la sincronización real
de luciérnagas. La consecuencia directa es que **la sincronía de fase (medida por r) se traduce
en sincronía perceptible de destellos y notas**: cuando r es alto, los disparos ocurren casi
simultáneamente (efecto de cascada lumínica y acorde musical); cuando r es bajo, los disparos
están dispersos en el tiempo (percusión aleatoria, "ruido" visual). La nota musical de cada
disparo depende del índice del agente y de su personalidad (`octava`), así que la sincronía de
fase también determina qué tan "armónico" o "caótico" suena el conjunto de disparos simultáneos.

---

## 4. Justificación explícita de las modificaciones al modelo

Siguiendo la exigencia de la actividad de no dejar que la IA tome la decisión, documento aquí
las tres extensiones sobre el Kuramoto clásico y su intención de diseño. *(Esta sección debe
completarse o ajustarse con tus propias palabras y justificación real de diseño — lo que sigue
es la descripción técnica objetiva de lo que hace el código; la intención de diseño la defines tú).*

| Modificación | Término original | Término modificado | Qué se buscaba |
|---|---|---|---|
| K heterogéneo por personalidad | K único global | `kGlobal * mult` por agente | Dar identidad de comportamiento a cada personalidad más allá del color/timbre: que su forma de acoplarse (fuerte, débil, opuesta) sea parte de su "carácter". |
| Coeficiente negativo (Disidente) | K siempre ≥ 0 en el modelo clásico | `-1.3 + 0.6·K` | Evitar que el sistema colapse en sincronía perfecta y estática; mantener un agente que activamente empuja hacia el desorden, generando tensión performativa continua. |
| `resistenciaPerturbacion` (desacoplamiento temporal) | No existe en Kuramoto clásico | Multiplica K efectivo, decae a ~0 tras perturbar y se recupera gradualmente | Que la perturbación tenga una consecuencia dinámica visible en el tiempo (no solo un salto de fase instantáneo), permitiendo observar el proceso de reintegración del agente al colectivo. |

---

## 5. Respuestas a las preguntas centrales del encargo de diseño

### ¿Cómo convertir un modelo de autoorganización en un instrumento audiovisual performativo?

En este proyecto, la conversión ocurre en tres capas: (1) cada variable interna del modelo
(θ, ω, K, r) se ata a una consecuencia perceptible —fase → evento de disparo, ω → identidad
rítmica de cada personalidad, K → grado de cohesión visual/sonora, r → intensidad general del
fondo y del brillo—; (2) el usuario tiene acceso directo a las variables que gobiernan la
dinámica (K y dispersión de ω) en lugar de controlar el resultado audiovisual directamente, de
modo que toda intervención pasa por el modelo antes de manifestarse; y (3) existen mecanismos
de perturbación que no reinician el sistema, sino que lo desplazan de su estado actual y dejan
observar su proceso de reorganización, lo cual convierte cada intervención en un gesto con
consecuencias temporales extendidas, no en un botón de "efecto instantáneo". Esto es lo que
distingue "tocar" el sistema de simplemente observarlo o ajustar sliders.

### ¿Qué hace Kuramoto en esta experiencia que no podría resolverse simplemente mediante un reloj global, un secuenciador o temporizadores independientes?

Un reloj global o secuenciador predefiniría *cuándo* ocurre cada evento sonoro/visual de forma
independiente de los demás eventos. En este sistema, en cambio, el instante de disparo de cada
agente **depende en cada frame de las fases actuales de los otros 11 agentes** a través del
término `Σ sin(θⱼ−θᵢ)`. Esto tiene consecuencias que un secuenciador no puede replicar sin
simular explícitamente el mismo acoplamiento:

- La sincronía no es programada, es **emergente**: nadie define "estos agentes disparan juntos
  en el compás 3"; el orden temporal de los disparos surge del ajuste mutuo de fases, y por eso
  cambia de forma continua y no repetitiva según K, ω y el historial de perturbaciones.
- Perturbar un agente **afecta el comportamiento futuro de todos los demás**, no solo el suyo,
  porque su fase alterada entra en la suma de acoplamiento de cada uno de los otros 11 agentes
  en cada paso de integración. Un temporizador independiente no tiene esta propagación: perturbar
  un canal en un secuenciador no cambia el timing de los demás canales.
- El sistema exhibe **histéresis y transiciones no lineales** (desorden → organización parcial →
  organización estable, y su ruptura) como consecuencia directa de la dinámica diferencial, no
  de un guion. Los mismos valores de K y ω pueden llevar a distintos estados según la historia
  reciente del sistema (p. ej., justo después de una perturbación), algo que un temporizador
  fijo —determinista y sin memoria de interacción— no puede producir.

En síntesis: si se reemplazara Kuramoto por un reloj, se podría *programar* una apariencia de
sincronía, pero se perdería la propiedad esencial de que la sincronía **se construye y se
deshace en tiempo real como resultado de la interacción entre agentes**, que es precisamente lo
que el encargo pide poder demostrar interactuando con el sistema.

---

# Autoevaluación

1. Leí y verifiqué que mi proyecto cumple con los requisitos mínimos de la unidad: 25 puntos.

2. Puedo explicar claramente qué representa cada variable del modelo de Kuramoto en mi proyecto: 25 puntos.

3. Puedo explicar claramente cómo las variables del modelo producen el comportamiento observado en mi proyecto: 25 puntos.

4. Puedo demostrar que mi proyecto cumple con los objetivos establecidos en la unidad: 25 puntos.