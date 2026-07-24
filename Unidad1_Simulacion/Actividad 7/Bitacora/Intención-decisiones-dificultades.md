# Intro:

El festival gira en torno a combate de aviación, una pelea en el aire de la era de la segunda guerra mundial son dos aviones o objetos en este caso que giran entre si pero uno de los dos siempre va a ser el que persigue y otro que intenta huir o pelear pero para el contexto del festival va solo a huir. 

Las dos bolitas siempre van a estar cerquita entre si tal como aviones en una pelea mientras una siempre intenta estar atras o generalmente persiguiendo la otra bolita.

El encargo pide que la incertidumbre no se vea como caos random, sino como reglas distintas que producen comportamientos distintos, yo pense en la solución con las 2 bolitas, una que el visitante puede influenciar y otra que persigue a la primera bolita sin descanso ni influencia de la persona y no son 2 sketches sino que es uno solo con 2 elementos iguales pero que tienen un comportamiento distinto y hacen una sola pieza.

# 5 momentos:

**Posibilidad**: Cuando nadie toca la pantalla y se inicia el codigo, el movimiento de cada bolita sale de una distribución gaussiana centrada en cero, es decir, no hay una dirección preferida, cualquier rumbo es igual de probable y no hay necesidad de tener un texto, el mismo comportamiento lo muestra.

**Tendencia**: Cada vez que dejas presionado el dedo o el clic, se va sumando un pequeño empujón a la dirección del movimiento. Al principio casi no cambia nada, pero con el tiempo esos empujoncitos se acumulan y terminan cambiando hacia dónde va. La idea es que una acción pequeña, repetida muchas veces, termina haciendo la diferencia. Es por eso que si uno deja el click presionado pues se pone a toda marcha ya que no dejas de meter influencia.

**Normalidad**: La bolita roja siempre se va a comportar diferente y de la misma manera, siempre va a intentar perseguir la bolita azul, no importa que tanto se aleje y también tiene las mismas habilidades de la azul como los salto y la aceleración por el click de la persona.

**Excepción**: De vez en cuando, con muy baja probabilidad, se dispara un salto tipo Lévy flight, la bolita se desplaza por una corta distancia mucho más rapido de lo normal y no se ve como si se teletransportara sino que si recorre la distancia y deja el recorrido en las particulas que de por si dejan las bolitas como un rastro.

**Influencia**: La persona directamente no mueve nada en el programa, solo cambia el punto de referencia que el sistema usa para calcular el sesgo, la desviación que va a tomar y la probabilidad de que haga una excepción y también cuando más cerca este más probabilidad haya de que haga un salto de excepción. el sistema reacciona a la de uno presencia sin que uno controle el resultado exacto.

# Versiones: 

<video controls src="20260724-1814-02.8761737-1.mp4" title="Title"></video>

<video controls src="20260724-1837-46.1395947.mp4" title="Title"></video>

# Decisiones tomadas y alternativas descartadas:

Al inicio pensaba poner que las bolitas se movieran entre un sistema de particulas pero luego en el desarrollo del codigo note que al hacerlo así se confundia un poco cuales eran las bolitas que se mueven y cuales eran particulas normales, otra es que el diseño que había pensado originalmente es que fuera solo una bola que siguiera como un camino y fuera como cambiando entre caminos, como si estuviera en una autopista pero no parecía tan interesante y decidí ponerle un segundo walker que lo siguiera y que fuera aleatorio hacía donde iba.

# Dificultades y soluciones: 

Se me dificulto un poco conseguir un resultado como tal, aveces salían errores o no era el resultado esperado e incluso con IA no me daba muchas soluciones, también una falta de creatividad para plantear que iba a ser como tal lo que se iba a mostrar ya que no tenía muchas referencias de algo nuevo con los temas vistos en la unidad.

# Evidencias visuales y enlace al prototipo: 

<video controls src="20260724-1844-33.0986756.mp4" title="Title"></video>

# Uso dado a la IA generativa y cambios realizados sobre sus propuestas: 

La IA generalmente la use para poder escribir el codigo y hacer cambios de como funciona la aplicación, al inicio también le pregunte que haría ella en el proyecto pero solo como en ideas para yo ver si habia algo interesante de lo que podría empezar a modificar con el contexto del festival y ya con mis ideas de como visualizaba el reto.


# Aplicación en p5js:

https://editor.p5js.org/synths71/sketches/_Rm4G6dcp


# Autoevaluación: 

1. Encargo completo: interpreto los cinco momentos dentro de un mismo sistema visual. 

**Cumplo**

2. Simulación con intención: utilizo al menos tres conceptos de la unidad para comunicar las ideas del encargo.

**cumplo**

3. Interacción significativa: la interacción modifica el comportamiento o las probabilidades del sistema, que también funciona sin intervención. 

**cumplo**

4. Prototipo funcional: la experiencia puede ejecutarse y recorrerse completa sin errores que impidan comprenderla.

**cumplo**

5. Proceso documentado: la bitácora evidencia avances, decisiones, dificultades, soluciones, uso de IA y enlace al prototipo. 

**cumplo**