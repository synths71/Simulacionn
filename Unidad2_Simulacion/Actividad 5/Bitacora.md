# Reto de diseño 

## Intención: 

**Quiero explorar la tensión entre la resistencia individual y la inevitabilidad estadística del contagio.**

El sistema pienso que se debería ejecutar como en un colapso total que vendría siendo la parte de inevitabilidad, pero queda abierta la posibilidad de que algunos individuos escapen, no porque sean inmunes, sino porque tienen mejor capacidad de evasión combinada con algo de suerte posicional. La intención que tengo es que al ver el sistema quede en el aire la pregunta ¿la resistencia es una cualidad real, o es solo una ventaja estadística que a veces no alcanza?

La contradicción no depende de los colores ni de los nombres "Sano / Infectado / Resistente". Si borrara el color y dejara solo los círculos moviéndose, la tensión seguiría siendo visible: hay un grupo que se mueve más rápido y persigue de cerca (Infectados), un grupo que reacciona tarde y lento y casi no evade (Sanos), y un grupo que detecta desde lejos y corre más rápido que su perseguidor (Resistentes) pero eso no quiere decir que se va a salvar de ser comido por los infectados. 

# Diseño del sistema: 

## Tipos de particulas: 

Existen tres tipos que serian los siguientes: Sano (S), Infectado (I), Resistente (R).

Seleccioné tres tipos porque quiero hacer perceptible que la resistencia no es una categoría absoluta así como tipo inmudidad, sino un grado de ventaja dentro de un espectro de comportamiento. Logre observar y era como esperaba que pasara y es que el sistema aveces colapsa todo y quedan infectados todos y en otras ocasiones logran sobrevivir un par, que muestra la tensión  en vez de que sea un unico resultado siempre. 

## Cantidad: 

Sanos: 150, Infectados: 4, Resistentes: 10.

Seleccioné una minoría de Resistentes porque quiero hacer perceptible que la resistencia es una excepción dentro del sistema, no una alternativa igual de común que ser Sano. Con esto busco que genere una incertidumbre porque si habría mucho resistente entonces la inevitabilidad desapareceria porque el sistema estaria menos caotico y más estable. 

## Matriz:

| origen → destino | → Sano | → Infectado | → Resistente |
|---|---|---|---|
| **Infectado** | atracción fuerte, alcance grande (persigue y alcanza) | repulsión suave, corto alcance (enjambre disperso, no bola) | atracción media (también acecha al Resistente) |
| **Sano** | indiferencia | repulsión débil, corto alcance (huye tarde y de cerca) | indiferencia |
| **Resistente** | indiferencia | repulsión fuerte, alcance grande (detecta y evade desde lejos) | indiferencia |

Seleccioné que Infectado→Sano tenga mucho más alcance que Sano→Infectado porque quiero hacer perceptible que el contagio "busca" activamente mientras la amenaza se detecta tarde. Espero que esto produzca la sensación de inevitabilidad para la mayoría de la población.

En cambio, seleccioné que Resistente→Infectado tenga mayor alcance y fuerza que cualquier otra relación de evasión porque quiero hacer perceptible que ahí vive la "resistencia individual". Pero esta relación no es absoluta: si un Resistente queda rodeado por varios Infectados a la vez, las fuerzas de evasión se cancelan entre sí y el Resistente puede caer igual — la resistencia compra probabilidad de escape, no garantía.

## Intensidad y alcance de cada relación: 

Cada relación tiene dos parámetros: la fuerza (`a`, positiva atrae, negativa repele) y el alcance (`rMax`, la distancia máxima a la que esa relación existe). Además, un porcentaje corto de ese alcance (`beta`) siempre se reserva a una repulsión universal de muy corto rango, para que ninguna partícula se amontone físicamente sobre otra sin importar el tipo.

Seleccioné mantener ese "colchón" de repulsión universal en todas las relaciones porque quiero hacer perceptible el movimiento como algo orgánico y no como partículas superponiéndose. Espero que produzca un sistema que se lea como enjambre vivo, no como manchas estáticas.

## Distancias de interacción: 

El sistema opera con tres radios de interacción distintos y con función distinta:

- Contagio: es más bien corto para que no sea muy fuerte en el sistema.

- Amenaza para los sanos: es medio para que los sanos huyan de los infectados pero no mucho porque sino entonces no serian infectados nunca.

- Persecución: Es relativamente fuerte para que el sistema no se sienta muerto, también incluye la evasión de los resistentes. 

Seleccioné que estos tres radios fueran claramente distintos entre sí porque quiero hacer perceptible que la diferencia entre "sentirse inevitable" y "sentirse evitable" no está en si hay o no una regla de evasión, sino en cuándo se activa esa regla respecto a cuándo se activa la persecución. Espero que produzca la diferencia de comportamiento observable entre sanos que reaccionan más bien lento y resistentes que si corren lo más posible.

## Fricción y velocidad máxima: 

Fricción moderada y es la misma para todos, así el movimiento se siente natural y no erratico y brusco. La velocidad maxima depende de que particula sea, las más rapidas son las infectadas y los resistentes son igual de rapidos o más, los sanos son los más lentos. 

Seleccioné que los Resistentes tuvieran una velocidad máxima mayor que los Infectados porque quiero hacer perceptible que la resistencia es una ventaja sostenible en el tiempo, no solo una alerta temprana que igual termina alcanzada.

## Distribución inicial: 

Los sanos y resistentes salen en cualquier lado del mapa, mientras que los infectados salen todos en un grupo en un punto de la pantalla que cambia cada vez que se reinicie, esto lo hago porque quiero dar la idea de un brote de la vida real que ocurre en un punto especifico del mundo y se va expandiendo, y busco que el sistema inicie lento y vaya aumentando el caos mientras más infectados aparecen tal como en la vida real, donde despues de cierto momento se conoce como un punto de no retorno. 

## Parámetros constantes y variables:

Constantes: 

- La estructura completa de la matriz de relaciones (quién atrae, repele o es indiferente a quién).
- La regla de conversión por contacto.
- La existencia de las tres poblaciones y sus proporciones relativas.
- Los radios de interacción relativos entre sí.

Variables: 

- Las posiciones iniciales de todas las partículas.
- El punto exacto donde nace el foco del brote.

Seleccione estos parametros porque quiero hacer perceptible que las particulas, la vida como tal no tiene variaciones y son iguales, tal como personas reales pero los puntos y focos de infecciones pueden salir de cualquier lado en cualquier momento y se pueden propagar incluso si las particulas están creadas de igual manera. 

## Apariencia e interacción: 

La interacción disponible de momento es que se puede reiniciar el brote con uno nuevo en cierto lugar por si el anterior se quedo estancado en el sistema.

# Registro de pruebas (ajustes, hallazgos y descartes):

- Hallazgo 1: 

Los Infectados formaban bolas y no se separaban entonces reducia la cantidad de infectados que producian, la idea es que quede como un enjambre. El ajuste fue que se cambió Infectado→Infectado de atracción a repulsión suave y de corto alcance.

- Hallazgo 2: 

Los resistentes morian más rapido que los mismos sanos, esto porque tenían una velocidad maxima menor que la de los infectados entonces incluso si corrían pues eran alcanzados facilmente, el ajuste es que se le subio la velocidad maxima a los resistentes para que tuvieran mejores chances de sobrevivir. 

# Varias manifestaciones del sistema: 

![alt text](<Grabación 2026-08-04 114004.gif>)

![alt text](<Grabación 2026-08-04 115530.gif>)

![alt text](<Grabación 2026-08-04 114632.gif>)
# Autoevaluación: 

| Criterio | Peso | Valoración | Aporte |
|---|---|---|---|
| La intención es clara y perceptible en el comportamiento. | 20% |90% |18.00 |
| Los tipos, cantidades, matriz y parámetros están justificados desde la intención. | 25% |85% |21.25 |
| Comprendo y puedo modificar el funcionamiento técnico del sistema. | 20% |90% | 18.00|
| El sistema produce variaciones con una identidad reconocible. | 15% | 85%| 12.75|
| Experimenté, comparé, seleccioné y descarté con criterios claros. | 10% |80% | 8.00|
| Puedo distinguir y sustentar lo diseñado y lo emergente. | 10% |80% | 8.00|
| **Total** | **100%** |100% |86 |

## Nota propuesta: 4.3

# Aplicación en p5js:
https://editor.p5js.org/synths71/sketches/5SxGz3cGp
 