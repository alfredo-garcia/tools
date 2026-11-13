# Datos del knowledge-base sin conexión

> Project: `fitness-coach`
> Feature: `fitness-coach/001` · Status: Approved (2026-11-12)
> MVP: yes (Product Vision §5/§7) — Backlog item: #1
> Epic: none · Issue: n/a

* **Feature Name:** Datos del knowledge-base sin conexión.

* **Goal:** Que Al abra My Coach en cualquier sitio, incluida la piscina sin cobertura, y tenga al instante sus ejercicios, rutinas y programa tal como estaban en su última conexión, sin abrir ficheros ni preguntar a Claude; y que lo que cambie en el Drive (por ejemplo, una rutina que `fitness-manager` ajusta por Telegram) le llegue solo la próxima vez que haya red. Éxito: sin red, la app abre con los datos en menos de 1 s; con red, Al nunca tiene que hacer nada para ver los cambios.

* **The Delta:** Hoy no existe la app. Para consultar una rutina, Al abre los ficheros Markdown/YAML de la carpeta `fitness` del Drive o se lo pregunta a Claude, y sin cobertura no tiene ni lo uno ni lo otro.

* **User Persona:** Al (única persona de la visión), que entrena en casa, en la piscina y caminando, a menudo sin conexión.

* **Core Mechanics (High Level):**
  - La app lee de la carpeta `fitness` del Drive los ejercicios, las rutinas (activas y pausadas), el programa y las sesiones recientes, y guarda una copia en el móvil con la que funciona entera sin red.
  - Se actualiza sola al abrir la app o volver a ella, al recuperar la conexión y al tirar hacia abajo para refrescar; mientras tanto se sigue viendo la copia que ya había, nunca una pantalla en blanco.
  - La primera vez pide la clave de acceso y la recuerda; si deja de valer, la vuelve a pedir sin perder los datos guardados. La primera apertura sin red y sin copia guardada pide conectarse ("Necesitas conexión la primera vez").
  - Siempre se ve el estado de los datos: sincronizado (y hace cuánto), sin conexión, sincronizando o error.
  - Un fichero del Drive que no cumple el esquema se deja fuera sin bloquear el resto, y el resumen lo indica ("1 fichero no se pudo leer") sin mostrar su contenido.
  - Home provisional dentro del marco de la app (barra Inicio / Rutinas / Ejercicios) con un resumen de lo cargado ("29 ejercicios · 7 rutinas · actualizado hace 5 min"); Rutinas y Ejercicios muestran un estado vacío "Próximamente" hasta las features #3 y #4. La Home real llega con la #2.
  - La app se puede instalar en el móvil como "My Coach", con un icono provisional "MC" en el naranja de la app.

* **Constraints / Out of Scope:**
  - Ninguna escritura en el Drive: ni sesiones ni la cola de envíos pendientes (llegan con la #5). Esta feature solo lee.
  - Ni "Hoy te toca", ni listas o detalles de rutinas o ejercicios, ni filtros (#2, #3, #4); qué se muestra de las rutinas pausadas se decide en la #2 y la #3.
  - Sin botón "Sincronizar" en el móvil; bastan los tres disparadores. En pantallas de 640 px o más, donde no hay gesto de tirar, la cabecera lleva un botón "Actualizar" (decidido en el prototipo, 2026-11-12).
  - Sin sincronización entre dispositivos, avisos ni notificaciones.
  - No se edita ni se reinterpreta el formato del knowledge-base: manda `fitness/_system/schema.md`.
  - No se diseña un logo; el icono "MC" es provisional.
  - Ninguna pantalla ni mensaje de error muestra contenido de rutinas, notas o programa.
