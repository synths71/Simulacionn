# Bitácora — Unidad 8: Why Bother? ¿Para qué tomarte el trabajo?

https://editor.p5js.org/synths71/sketches/ri5hsJ1ax

**Obra:** simulación en p5.js con agentes, fuerzas, ruido Perlin y un rastro que otros pueden seguir.
**Link:** _(pegar aquí el link de Fullscreen del editor de p5.js)_

---

## 1. ¿Cómo interpreté la pregunta Why Bother?

De la charla de Robert Hodgin lo que más me llamó la atención fue el momento en que dice que, en algún punto, ignorar la IA se volvió imposible por más que uno lo intentara. Me pasó algo parecido. Hasta inicios de 2024 nunca había usado IA. Tenía exámenes de cálculo, no sabía nada del tema y no tenía tiempo de estudiar por mi cuenta con un libro, así que la usé para hacer los quices. No fue una decisión filosófica: llegó un punto en que ya no pude ignorarla.

De ahí salió mi interpretación: **"Why Bother?" como la tensión entre el camino largo y el atajo cuando hay presión.** No quise hacer una obra que dijera que la IA es buena o mala. Quise representar lo que viví: mientras hay tiempo, explorar por cuenta propia es posible; cuando la presión sube, el atajo jala cada vez más fuerte y resistirlo cuesta.

**Cómo cambió mi interpretación mientras trabajaba:** al principio el rastro que dejaban los agentes que exploraban era solo decoración (un mapa bonito). Cuando lo conecté con una consecuencia (los que exploran dejan un camino que otros pueden seguir, y los del atajo no dejan nada), la pregunta cambió: ya no era solo "¿sirve el atajo?", sino "¿qué queda de haberme tomado el trabajo, y para quién?".

## 2. ¿Cómo lo exploré?

### Elementos de la obra

- **Agentes (90 puntos):** son las personas/versiones de mí intentando llegar al examen.
- **El examen (círculo naranja a la derecha):** la meta.
- **La IA (círculo cian a la izquierda):** un atractor que crece y jala más fuerte a medida que sube la presión.
- **La presión (barra naranja abajo):** sube sola con el tiempo, como el examen acercándose.
- **El rastro (líneas naranja):** lo que dejan los agentes que van por su cuenta.
- **Mi intervención (mouse sostenido):** resistir.

### Técnicas del curso y por qué las elegí

| Técnica | Dónde se usa | Por qué |
|---|---|---|
| **Ruido Perlin** (Unidad 1) | `vagar()`: `noise(this.offset)` produce un ángulo que cambia suave | Para que explorar se vea como caminar sin rumbo fijo, orgánico, no como el temblor de `random()`. Cada agente tiene su propio `offset`, así que cada uno recorre una parte distinta del ruido. |
| **Movimiento con vectores** (Unidad 2) | `pos`, `vel`, `acc`; `acc` se reinicia cada cuadro | Es la base de todo: fuerza → aceleración → velocidad → posición. |
| **Fuerzas** (Unidad 3) | La IA jala con una fuerza proporcional a la presión (`presion * 0.35`) | Para que la atracción sea gradual: poco al inicio, muy fuerte al final. |
| **Steering / agentes** (Unidad 6) | `buscar()` implementa *seek*: velocidad deseada menos velocidad actual, limitada | Es la forma de que un agente "quiera" llegar a un punto. Lo uso para ir al examen y para caer hacia la IA. |
| **Partículas con estado** (Unidad 5) | Cada agente es `vagando`, `atajo` o `llego` | Permite que se comporten distinto según el camino que tomaron. |
| **Campo de rastro** | Una cuadrícula (`campo`) donde se deposita rastro; los agentes "huelen" 3 puntos adelante y giran hacia el más fuerte | Para que el esfuerzo de unos le sirva a otros. |

### Decisiones importantes

- **Dos caminos, dos velocidades.** Los que vagan van a velocidad máxima 2 y solo se acercan poco al examen (`buscar(meta, 0.03)`). Al tocar la IA pasan a velocidad 6 y van directo (`buscar(meta, 0.5)`). El atajo es mucho más rápido y eso lo hace tentador.
- **Solo el que explora deja rastro.** Es la decisión que carga el significado de la obra.
- **La presión sube sola** (+0.0004 por cuadro, unos 40 segundos hasta el máximo). Resistir es una acción mía: mantener el clic baja la presión (-0.0015 por cuadro) y protege a los agentes cerca del cursor (radio 140) del jalón de la IA.
- **El rastro se desvanece muy despacio** (`× 0.9995` por cuadro) para que el mapa no se vuelva permanente y pierda sentido.
- **Pantalla completa:** `createCanvas(windowWidth, windowHeight)` más la tecla **F**. Para presentar uso el link de Fullscreen del editor.
- **Final con datos:** cuando llegan los 90, la obra muestra cuántos llegaron por cada camino, el tiempo promedio y cuánto rastro quedó.

### Pruebas que orientaron el desarrollo

1. **Versión 1 (base):** agentes vagando con Perlin, la meta y la barra de presión. Verifiqué que el movimiento fuera suave y no temblara.
2. **Versión 2 (la IA y el rastro):** agregué el atractor, los dos estados y el rastro visual. En una corrida a mitad de la simulación el contador marcaba **25 por mi cuenta y 12 con atajo**, y el mapa de rastros ya cubría casi toda la pantalla. Eso me confirmó que la mecánica funcionaba.
3. **Versión 3 (consecuencias y datos):** hice que el rastro se pudiera seguir y agregué el final con números. Aquí lo más delicado de calibrar fue el seguimiento del rastro (distancia del sensor 30 px, abertura 0.6 rad, umbral 0.05 y fuerza máxima 0.06): si es muy fuerte los agentes se enredan en círculos, y si es muy débil no se nota.
4. **Ajustes de presentación:** fondo y estilos sin márgenes (`style.css`), texto de instrucciones al inicio, reinicio con la tecla R.

## 3. ¿Qué encontré?

**Lo que esperaba y ocurrió:**

- Los agentes que exploran dejan un mapa de rastros que cubre el espacio y se ve como un tejido de caminos.
- Los del atajo llegan primero al examen, a mucha más velocidad.
- Cuando la presión sube, la IA crece y la mayoría termina cayendo en ella, aunque al inicio nadie lo hace.

Con el seguimiento de rastro, el diseño busca que los caminos más usados se refuercen: cuantos más agentes pasan por un sitio, más marca queda y más agentes lo siguen. Al final, la obra muestra los números de esa corrida (cuántos llegaron por cada camino, el tiempo promedio de cada grupo y el rastro dejado), y esos valores cambian en cada ejecución porque el ruido hace que cada una sea distinta.

**Lo que me sorprendió:** lo bien que funciona el rastro como mapa. Sin dibujar nada a mano, el esfuerzo de los agentes que exploran va quedando visible y, en una corrida a mitad de camino, ya cubría casi toda la pantalla. También me sorprendió que una regla tan simple (la IA jala más a medida que sube la presión) genere un comportamiento que se siente tan humano.

**Lo que sigue abierto:**

- La obra no dice si el atajo es malo. Llegar rápido sirve cuando hay un examen encima, y eso es justo lo que viví. La pregunta que queda es qué se pierde en el camino y quién lo pierde.
- Los del atajo no dejan nada para otros, pero tampoco sé qué pasaría si el atajo también dejara algo. Podría ser una versión futura.
- No modelé qué se aprende en cada camino. Solo modelé el rastro, que es una metáfora de eso, no una medida.

## 4. ¿Qué aprendí realmente?

Hay que ser honesto aquí, porque la unidad lo pide: **construí esta obra con ayuda de una IA (Claude)**. Le conté la idea, elegimos juntos el concepto y ella me fue pasando el código por partes. Es justo la situación sobre la que trata la pregunta. Por eso, lo que cuenta no es quién escribió cada línea, sino qué puedo explicar y modificar ahora.

**Lo que puedo explicar:**

- Cómo se mueve un agente: se suman fuerzas a la aceleración, la aceleración cambia la velocidad y la velocidad cambia la posición. Luego la aceleración se reinicia.
- Por qué uso Perlin y no `random()`: Perlin cambia de forma continua, así que el ángulo del movimiento gira suave en vez de saltar.
- Qué hace *seek*: calcula la velocidad que el agente querría tener hacia el objetivo, le resta la que ya tiene y limita ese giro. Esa diferencia es la fuerza de dirección.
- Cómo funciona el rastro: cada cuadro, el que explora marca su celda en una cuadrícula; los demás miran tres puntos adelante y giran hacia el que tenga más marca. Con el tiempo la marca se desvanece.
- Por qué la IA "jala más" con la presión: la fuerza del *seek* hacia ella es `presion * 0.35`, así que crece con la barra.

**Lo que puedo modificar:** los números que controlan el comportamiento (velocidad de cada camino, qué tan rápido sube la presión, radio de protección del mouse, sensibilidad del rastro) y ver el efecto en pantalla.

**Lo que me costaría más explicar:** el sensor de rastro. Entiendo la idea (mira tres puntos adelante y gira hacia el que tenga más marca), pero los números exactos (distancia, abertura, umbral y fuerza) los fui calibrando por prueba y error y no los domino igual que el resto. Prefiero decirlo así a aparentar que lo tengo todo claro.

## 5. ¿Qué sentido tuvo tomarme el trabajo?

Con los exámenes de cálculo usé la IA porque no tenía tiempo ni punto de partida, y en ese momento tuvo sentido para mí. Esta obra me mostró el otro lado: lo que queda cuando uno sí se toma el trabajo (el rastro) y que ese rastro puede servirle a otros. El atajo llega más rápido, pero no deja nada para nadie.

Lo que me hizo seguir fue ver la obra tomar forma: pasar de puntos que vagan a una historia con presión, atajo y consecuencias, y que esa historia fuera la mía.

El esfuerzo que considero valioso es el que sostengo por una decisión propia, como mantener el clic para resistir. No es automático: cuesta, no puedo proteger a todos a la vez y, si suelto, la presión vuelve a subir.

Frente a la pregunta de Hodgin, mi postura es ambigua y lo asumo así. No creo que el atajo sea malo: me sirvió cuando lo necesité. Pero tampoco creo que dé lo mismo. Tomarse el trabajo vale la pena cuando lo que se gana (entender, dejar algo, poder explicarlo) es algo que el atajo no entrega, y la dificultad está en saber cuándo estás en cuál situación.

---

## Anexo: cómo usar la obra

- **Mantener el clic:** baja la presión y protege del jalón de la IA a los agentes cerca del cursor.
- **F:** pantalla completa.
- **R:** reiniciar.
- Al terminar, la obra muestra los resultados y la pregunta "¿Para qué tomarte el trabajo?".
