# Reto de diseño: Resistencia vs. Inevitabilidad

## 1. Intención

**Quiero explorar la tensión entre la resistencia individual y la inevitabilidad estadística del contagio.**

Espero que esta tensión se manifieste así: la mayoría de las corridas del sistema terminan en un colapso casi total (inevitabilidad), pero queda abierta la posibilidad de que algunos individuos escapen — no porque sean inmunes, sino porque tienen mejor capacidad de evasión combinada con algo de suerte posicional. La pregunta que queda flotando al ver el sistema correr es: **¿la resistencia es una cualidad real, o es solo una ventaja estadística que a veces no alcanza?**

La contradicción no depende de los colores ni de los nombres "Sano / Infectado / Resistente". Si borrara el color y dejara solo los círculos moviéndose, la tensión seguiría siendo perceptible: hay un grupo que se mueve más rápido y persigue de cerca (Infectados), un grupo que reacciona tarde y casi no evade (Sanos), y un grupo que detecta desde lejos y corre más rápido que su perseguidor (Resistentes) — pero que igual puede quedar rodeado y caer. La resistencia vive en los **parámetros de comportamiento** (radio de detección, velocidad máxima), no en la etiqueta.

---

## 2. Diseño del sistema

### 2.1 Tipos de partículas

Tres tipos: **Sano (S)**, **Infectado (I)**, **Resistente (R)**.

Seleccioné tres tipos porque quiero hacer perceptible que la resistencia no es una categoría absoluta (inmune / no inmune), sino un grado de ventaja dentro de un espectro de comportamiento. Espero que produzca corridas donde a veces todo el sistema termina infectado y a veces algunos Resistentes sobreviven — mostrando la tensión en vez de resolverla en un único desenlace.

### 2.2 Cantidades

Sanos: 150 · Infectados: 4 (foco inicial) · Resistentes: 10.

Seleccioné una minoría de Resistentes porque quiero hacer perceptible que la resistencia es una excepción dentro del sistema, no una alternativa igual de común que ser Sano. Espero que produzca incertidumbre real entre corridas: si hubiera muchos Resistentes, la "inevitabilidad" desaparecería porque el sistema se estabilizaría fácil; si no hubiera ninguno, no habría tensión que mostrar, solo colapso garantizado.

### 2.3 Matriz de relaciones

| origen → destino | → Sano | → Infectado | → Resistente |
|---|---|---|---|
| **Infectado** | atracción fuerte, alcance grande (persigue y alcanza) | repulsión suave, corto alcance (enjambre disperso, no bola) | atracción media (también acecha al Resistente) |
| **Sano** | indiferencia | repulsión débil, corto alcance (huye tarde y de cerca) | indiferencia |
| **Resistente** | indiferencia | repulsión fuerte, alcance grande (detecta y evade desde lejos) | indiferencia |

Seleccioné que Infectado→Sano tenga mucho más alcance que Sano→Infectado porque quiero hacer perceptible que el contagio "busca" activamente mientras la amenaza se detecta tarde. Espero que esto produzca la sensación de inevitabilidad para la mayoría de la población.

En cambio, seleccioné que Resistente→Infectado tenga mayor alcance y fuerza que cualquier otra relación de evasión porque quiero hacer perceptible que ahí vive la "resistencia individual". Pero esta relación no es absoluta: si un Resistente queda rodeado por varios Infectados a la vez, las fuerzas de evasión se cancelan entre sí y el Resistente puede caer igual — la resistencia compra probabilidad de escape, no garantía.

Esta asimetría (I→S ≠ S→I en alcance, R→I ≠ I→R en fuerza) cumple con el requisito de al menos una relación asimétrica, y de hecho el sistema tiene varias.

### 2.4 Intensidad y alcance de cada relación

Cada relación tiene dos parámetros: la fuerza (`a`, positiva atrae, negativa repele) y el alcance (`rMax`, la distancia máxima a la que esa relación existe). Además, un porcentaje corto de ese alcance (`beta`) siempre se reserva a una repulsión universal de muy corto rango, para que ninguna partícula se amontone físicamente sobre otra sin importar el tipo.

Seleccioné mantener ese "colchón" de repulsión universal en todas las relaciones porque quiero hacer perceptible el movimiento como algo orgánico y no como partículas superponiéndose. Espero que produzca un sistema que se lea como enjambre vivo, no como manchas estáticas.

### 2.5 Distancias de interacción

El sistema opera con tres radios de interacción distintos y con función distinta:

- **Radio de contagio** (muy corto): la distancia de contacto real que convierte a una partícula en Infectado.
- **Radio de detección de amenaza** (medio, para Sanos): a qué distancia un Sano empieza a reaccionar ante un Infectado.
- **Radio de persecución / evasión** (largo, para Infectados y Resistentes): a qué distancia un Infectado empieza a perseguir, o un Resistente empieza a huir.

Seleccioné que estos tres radios fueran claramente distintos entre sí (y no uno solo compartido) porque quiero hacer perceptible que la diferencia entre "sentirse inevitable" y "sentirse evitable" no está en si hay o no una regla de evasión, sino en **cuándo** se activa esa regla respecto a cuándo se activa la persecución. Espero que produzca la diferencia de comportamiento observable entre Sanos (reaccionan tarde) y Resistentes (reaccionan temprano).

**Nota de ajuste (registro de pruebas):** originalmente estos radios estaban en píxeles fijos, lo cual hacía que el sistema se comportara distinto según el tamaño de la ventana (ver sección 4). Se corrigió escalándolos según el tamaño real del lienzo, sin cambiar la relación entre ellos.

### 2.6 Fricción y velocidad máxima

Fricción moderada y uniforme para todos los tipos (mismo coeficiente), para que el movimiento se sienta orgánico y no errático o brusco.

Velocidad máxima diferenciada por tipo: Infectados los más rápidos, Resistentes casi igual de rápidos (por encima de los Infectados, tras el ajuste descrito en el registro de pruebas), Sanos los más lentos.

Seleccioné que los Resistentes tuvieran una velocidad máxima mayor que los Infectados (y no solo mejor detección) porque quiero hacer perceptible que la resistencia es una ventaja sostenible en el tiempo, no solo una alerta temprana que igual termina alcanzada. Espero que produzca corridas donde un Resistente que reacciona a tiempo pueda escapar de forma prolongada, y no solo demorar un desenlace ya decidido.

### 2.7 Distribución inicial

Sanos y Resistentes se distribuyen aleatoriamente por todo el lienzo. Los Infectados nacen agrupados en un único punto ("foco del brote"), cuya ubicación cambia en cada ejecución.

Seleccioné que el brote naciera concentrado en un punto (y no disperso desde el inicio) porque quiero hacer perceptible la idea de un origen puntual que se expande, como un brote real. Espero que produzca una fase inicial lenta y localizada, seguida de una expansión que se acelera conforme crece el número de Infectados — la sensación de "punto de no retorno".

### 2.8 Parámetros constantes y variables

**Invariantes** (no cambian entre ejecuciones, son la identidad del sistema):
- La estructura completa de la matriz de relaciones (quién atrae, repele o es indiferente a quién).
- La regla de conversión por contacto.
- La existencia de las tres poblaciones y sus proporciones relativas.
- Los radios de interacción relativos entre sí (aunque su valor absoluto se ajuste según el tamaño de pantalla, ver sección 4).

**Variables** (cambian entre ejecuciones, son la fuente de variabilidad — requisito 6):
- La semilla aleatoria (`randomSeed`), visible en pantalla en cada corrida.
- Las posiciones iniciales de todas las partículas.
- El punto exacto donde nace el foco del brote.

### 2.9 Apariencia e interacción

Círculos simples sin bordes, un color por tipo (azul = Sano, rojo = Infectado, verde = Resistente) únicamente como apoyo de lectura visual — no como base de la contradicción, que vive en las reglas (ver sección 1).

Interacción disponible: reiniciar la simulación con una semilla nueva (barra espaciadora o botón), y modo de pantalla completa (tecla F o botón).

---

## 3. Verificación de las 8 condiciones del reto

| # | Condición | Cómo se cumple |
|---|---|---|
| 1 | Posición, velocidad y aceleración | Cada partícula acumula fuerzas → aceleración → velocidad → posición en cada frame (Motion 101 clásico). |
| 2 | Varias poblaciones | Tres tipos: Sano, Infectado, Resistente. |
| 3 | Interacciones dependientes de la distancia | Tres radios distintos (contagio, detección, persecución/evasión). |
| 4 | Atracción, repulsión o indiferencia | Presentes los tres en la matriz completa (ej. S→S es indiferencia). |
| 5 | Al menos una relación asimétrica | Varias: I→S ≠ S→I en alcance; R→I ≠ I→R en fuerza y alcance. |
| 6 | Variabilidad entre ejecuciones | Semilla aleatoria, posiciones iniciales, punto del foco. |
| 7 | Comportamientos emergentes | La conversión por contacto no define trayectorias: quién sobrevive, cuántos focos se forman y cuándo colapsa el sistema surge de la simulación, no está programado de antemano. |
| 8 | Identidad reconocible entre resultados | Ver sección 4 — este fue el punto que requirió más calibración. |

---

## 4. Registro de pruebas: ajustes, hallazgos y descartes

Esta sección documenta el proceso real de calibración, que fue necesario sobre todo para sostener el requisito 8 (identidad reconocible).

### Hallazgo 1 — Los Infectados formaban "bolas" en vez de enjambre
**Problema observado:** con la relación Infectado→Infectado configurada como atracción (`a: 0.15`), los Infectados que quedaban cerca entre sí se pegaban y no había fuerza que los separara. El resultado visual eran 1 o 2 masas compactas en vez de un enjambre disperso.

**Ajuste:** se cambió Infectado→Infectado de atracción a repulsión suave y de corto alcance.

**Resultado:** los Infectados ahora se ven como un enjambre disperso persiguiendo, reforzando la sensación de "frenesí" en vez de una masa estática. Se descartó mantener la atracción original porque, aunque generaba una forma visualmente interesante (masas grandes), traicionaba la intención de mostrar comportamiento perseguidor activo.

### Hallazgo 2 — Lag severo en pantalla completa
**Problema observado:** el sistema corría fluido en ventana pequeña pero se volvía notablemente lento en pantalla completa, con la misma cantidad de partículas.

**Diagnóstico:** no era un problema de cantidad de partículas, sino de densidad de píxeles (`pixelDensity`) por defecto en pantallas de alta resolución, que hacía que p5.js renderizara a una resolución interna varias veces mayor a la visible.

**Ajuste:** se fijó `pixelDensity(1)` explícitamente.

**Resultado:** el rendimiento se mantiene estable independientemente del tamaño de la ventana.

### Hallazgo 3 — Los Resistentes morían más rápido que los Sanos
**Problema observado:** contraintuitivamente, la población que debía tener ventaja (Resistentes) colapsaba antes que la población sin ninguna ventaja de diseño (Sanos).

**Diagnóstico:** los Resistentes detectaban al Infectado desde más lejos y con más fuerza, pero tenían una velocidad máxima *menor* que la del Infectado que los perseguía. En un mapa sin bordes (wrap-around), si el perseguidor es más rápido que la presa, el alcance eventual es cuestión de tiempo, sin importar qué tan pronto se detectó la amenaza — la detección temprana solo demoraba el desenlace, no lo evitaba. Además, al quedar rodeados por varios Infectados desde direcciones distintas, las fuerzas de evasión se cancelaban entre sí, dejando al Resistente casi inmóvil.

**Ajuste:** se subió la velocidad máxima de los Resistentes por encima de la de los Infectados.

**Resultado:** ahora un Resistente que reacciona a tiempo puede sostener el escape, no solo demorarlo. Siguen sin ser inmunes: rodeados o tocados por sorpresa, se infectan igual — la tensión entre resistencia e inevitabilidad se mantiene, solo que ahora la resistencia sí tiene una expresión de comportamiento real y no solo nominal.

### Hallazgo 4 — El sistema colapsaba a velocidades muy distintas según el tamaño de la ventana
**Problema observado:** en ventana pequeña, el sistema colapsaba (todos infectados) en cuestión de segundos; en pantalla completa, tomaba varios minutos.

**Diagnóstico:** los radios de interacción y de contagio estaban definidos en píxeles absolutos. En una ventana chica, las mismas 164 partículas quedan más apretadas (mayor densidad efectiva de contacto); en pantalla completa, la misma cantidad de partículas queda dispersa en un área mucho mayor, así que tardan más en encontrarse. Esto rompía el requisito 8: el sistema se sentía como un sistema distinto según el tamaño de pantalla, no como el mismo sistema con distintos desenlaces.

**Ajuste:** se introdujo un factor de escala (`worldScale`) calculado a partir del área real del lienzo respecto a una resolución de referencia, que se aplica a todos los radios de interacción y de contagio. Se recalcula automáticamente al cambiar el tamaño de ventana o entrar/salir de pantalla completa.

**Resultado:** el ritmo del colapso se mantiene comparable sin importar el tamaño de la ventana, preservando la identidad reconocible del sistema entre distintos contextos de visualización.

---

## 5. Comportamiento diseñado vs. comportamiento emergente

**Diseñado explícitamente:** la matriz de relaciones, los tres radios de interacción, las velocidades máximas por tipo, la regla de conversión por contacto, la distribución inicial (aleatoria para S y R, agrupada para I).

**Emergente (no programado directamente):** quién sobrevive en cada corrida particular, cuántos focos de contagio llegan a formarse antes de fusionarse, el momento exacto en que el sistema alcanza su "punto de no retorno", y si en una corrida dada gana la inevitabilidad (colapso total) o sobrevive algún Resistente. Nadie programa una trayectoria de escape para un Resistente específico — esa trayectoria surge de la interacción de las reglas locales con la posición y el azar de cada ejecución.

---

## 6. Varias manifestaciones del sistema

*(Aquí van tus capturas de pantalla o clips cortos de al menos 2–3 corridas con semillas distintas — la semilla aparece en el HUD de la simulación. Sugerencia de qué mostrar en cada una: una corrida donde el sistema colapsa por completo, y otra donde algún Resistente sobrevive, para evidenciar visualmente que la tensión entre ambos desenlaces sí está presente en el sistema.)*

---

## 7. Autoevaluación

*(Completa esta tabla asignando una valoración de 0% a 100% a cada criterio, según lo trabajado y documentado arriba, y sustenta cada valor con evidencia de esta bitácora.)*

| Criterio | Peso | Valoración | Aporte |
|---|---|---|---|
| La intención es clara y perceptible en el comportamiento. | 20% | | |
| Los tipos, cantidades, matriz y parámetros están justificados desde la intención. | 25% | | |
| Comprendo y puedo modificar el funcionamiento técnico del sistema. | 20% | | |
| El sistema produce variaciones con una identidad reconocible. | 15% | | |
| Experimenté, comparé, seleccioné y descarté con criterios claros. | 10% | | |
| Puedo distinguir y sustentar lo diseñado y lo emergente. | 10% | | |
| **Total** | **100%** | | |

`aporte = valoración × peso ÷ 100` · `nota propuesta = puntaje total ÷ 20`
