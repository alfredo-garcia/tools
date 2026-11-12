# Product Vision: Fitness Coach (PWA "My Coach")

> Project: `fitness-coach`
> Status: Approved (2026-11-12)
> Last material change: 2026-11-12

## 1. Problem

Al sigue un programa de rehabilitación lumbar (hernia L4-L5) con 4–5 sesiones por semana: natación, estabilidad, fuerza con banda, movilidad y caminata. Las rutinas, los ejercicios y la planificación semanal ya viven en su knowledge-base (carpeta `fitness` en Google Drive), mantenidos por la skill `fitness-manager`. Pero durante el entrenamiento no tiene una forma cómoda de consultarlas: tiene que abrir ficheros Markdown/YAML o preguntarle a Claude, llevar la cuenta de series, repeticiones y segundos de cabeza o con el cronómetro del móvil, y después contar por Telegram o en un chat qué hizo y cómo le fue. Por eso el registro de sesiones (`sessions/al.yaml`) está vacío, y sin ese registro el entrenador no puede adaptar la intensidad ejercicio a ejercicio.

## 2. Vision Statement

My Coach es el compañero de bolsillo de Al en cada entrenamiento: le dice qué le toca hoy, le guía ejercicio a ejercicio, serie a serie, y deja en su knowledge-base lo que hizo y cómo valoró cada ejercicio, para que su entrenador (Claude) vaya ajustando el programa.

## 3. Target Users & Personas

- **Al (primaria y única).** Entrena en casa (esterilla, banda), en la piscina y caminando, por la mañana y a menudo sin cobertura. Su tarea: hacer la rutina que toca sin pensar en la dosis y sin agravar la hernia, y dejar constancia de lo que hizo. Hoy usa el knowledge-base a través de Claude y Telegram, y el cronómetro del móvil.

## 4. Value Proposition

- Ver al instante qué rutina toca hoy y si ya la hizo, sin abrir ficheros.
- Un modo guiado que se encarga de la cuenta: series, repeticiones una a una y temporizador con tiempo extra, con el monigote, la descripción y las notas de cada ejercicio a la vista.
- El registro de la sesión se guarda solo en el knowledge-base. Más adelante, una valoración rápida de cada ejercicio (bájale / mantenlo / súbele) dará al entrenador lo que necesita para progresar sin riesgo.
- Funciona sin conexión y con el lenguaje visual que Al ya conoce de My Food Manager.

## 5. MVP Definition

**Hipótesis:** si la app guía la rutina del día y registra automáticamente lo que hizo, Al registrará la mayoría de sus sesiones planificadas en el knowledge-base, sin necesidad de Telegram ni del cronómetro del móvil.

**En alcance:**
- Leer del Drive (carpeta `fitness`) los ejercicios, las rutinas, el programa y las sesiones, y mantener una copia para usar la app entera sin conexión. Los cambios se sincronizan cuando vuelve la red.
- Home con cuatro secciones: botón "Iniciar rutina"; "Hoy te toca", con las rutinas activas del día de la semana y su estado (pendiente / parcial; las completadas hoy no se muestran); acceso a "Mis rutinas"; acceso a "Mis ejercicios".
- Selector "Iniciar rutina": un modal con las rutinas de hoy primero ("Para hoy") y luego "Otras rutinas"; cada card lleva una descripción breve y un botón "Iniciar".
- Modo guiado: un ejercicio por pantalla, con el monigote (si existe), la descripción y las notas, dejando claro cuántas series tiene y en cuál va; "Saltar serie" y "Saltar ejercicio completo".
  - Ejercicios de repeticiones: avanzar repetición a repetición o "Completar todas"; al llegar a la última aparece "Continuar".
  - Ejercicios de tiempo o duración: temporizador por serie con "play", cuenta atrás y, al llegar a 0, cuenta del tiempo extra hasta que Al pulsa "Continuar". Él decide cuándo pasar a la siguiente serie. Siempre se ofrece el temporizador; marcarlo como hecho a mano también vale (por ejemplo, la piscina).
  - Valoración de cada ejercicio (bájale / mantenlo / súbele; por defecto, mantenlo), solo como interfaz: en el MVP no se guarda ni tiene efecto, y se ve claramente que "todavía no hace nada". Su diseño (cómo se guarda y cómo la usa `fitness-manager`) se define más adelante.
- Terminar la rutina (al acabar o con "Terminar rutina"): un resumen sencillo de los ejercicios hechos y "Volver a inicio".
- Registro de la sesión en `sessions/al.yaml` cuando se completa (`completed`).
- Sesión parcial (se terminó antes o se saltaron ejercicios): se queda solo en el almacenamiento del dispositivo y no sale al Drive. Sigue en "Hoy te toca" con un indicador de "Parcial" y, si Al vuelve a ella el mismo día, continúa donde la dejó.
- Detalle de rutina (desde "Hoy te toca" y desde "Mis rutinas"): toda su información, con bloques, ejercicios, series, repeticiones y tiempos, y "Iniciar rutina" en un pie fijo.
- "Mis rutinas": cards con la información básica, filtrables por día de la semana y por tipo (categoría). Solo consulta.
- "Mis ejercicios": cards filtrables por grupo muscular, dificultad y equipamiento, y detalle del ejercicio.

**Fuera del MVP (explícitamente):**
- Editar rutinas (dosis, orden, quitar o añadir ejercicios): implica escribir la `## History` de la rutina y mantener `program.week`. Llega en la siguiente fase; en el MVP solo se consulta.
- Filtro de dificultad en rutinas: las rutinas no tienen nivel y no se va a calcular ni añadir.
- Temporizador de descanso entre series: Al controla cuándo pasa de serie.
- Historial y estadísticas de sesiones: el análisis lo hace Claude sobre el knowledge-base.
- Crear rutinas nuevas desde la app: lo hace `fitness-manager`.
- Fotos o vídeos de los ejercicios: basta el monigote actual.
- Sensaciones globales de la sesión (esfuerzo y dolor de 0 a 10): se sustituyen por la valoración por ejercicio.
- Guardar la valoración por ejercicio y que el entrenador la use: requiere diseñarlo con `fitness-manager` y ampliar el esquema de `sessions`.
- Llevar las sesiones parciales al knowledge-base: se quedan en el dispositivo.

**MVP terminado cuando:** Al puede abrir My Coach en el móvil sin conexión, ver lo que le toca hoy, hacer una rutina completa en modo guiado (incluida una que abandona y retoma el mismo día) y encontrar la sesión completada en `sessions/al.yaml` del Drive, en un formato que `fitness-manager` lee sin intervención manual.

## 6. Success Metrics

- **Adopción (métrica):** ≥ 80 % de las sesiones planificadas de 4 semanas seguidas quedan registradas desde la app.
- **Utilidad del registro (cualitativa):** Claude puede leer en el knowledge-base lo que Al hizo cada día sin pedirle datos.
- **Fricción (cualitativa):** Al no necesita el cronómetro del móvil ni Telegram para registrar una sesión normal.

## 7. Initial Feature Backlog

| # | Candidate feature | Persona | MVP? (yes/no) | Priority (Must/Should/Could) | Notes |
|---|---|---|---|---|---|
| 1 | Datos del knowledge-base sin conexión (lectura del Drive, copia local, sincronización) | Al | yes | Must | Base de todo lo demás |
| 2 | Home y "Hoy te toca" (estado pendiente / parcial / completada) | Al | yes | Must | Depende del registro de sesiones para el estado |
| 3 | Mis rutinas: lista con filtros (día, tipo) y detalle con pie "Iniciar rutina" | Al | yes | Must | Solo consulta |
| 4 | Mis ejercicios: catálogo con filtros (grupo muscular, dificultad, equipamiento) y detalle con monigote | Al | yes | Must | |
| 5 | Modo guiado y registro de sesión (selector "Iniciar rutina", series, repeticiones, temporizador, saltar, valoración sin efecto, resumen, sesión parcial local y reanudación) | Al | yes | Must | La más grande; puede partirse en Mode A |
| 10 | Valoración por ejercicio con efecto (guardarla y que `fitness-manager` ajuste la intensidad) | Al | no | Should | Requiere ampliar el esquema de `sessions` con `fitness-manager` |
| 6 | Edición de rutinas (dosis, orden, quitar y añadir ejercicios) | Al | no | Should | Escribe `## History` y mantiene `program.week` |
| 7 | Temporizador de descanso entre series | Al | no | Could | |
| 8 | Historial y estadísticas de sesiones | Al | no | Could | |
| 9 | Crear rutinas desde la app | Al | no | Could | Hoy es de `fitness-manager` |

## 8. Product Principles

1. **El knowledge-base manda.** La app lee y escribe siguiendo `fitness/_system/schema.md`; nunca inventa un formato propio ni pisa lo que escribe `fitness-manager`.
2. **Sin conexión primero.** Todo funciona sin red; sincronizar es cosa de la app, no de Al.
3. **Al decide el ritmo.** La app cuenta, pero no avanza sola: Al pulsa play, Continuar o Saltar.
4. **Registrar cuesta cero.** Lo normal se registra solo; valorar es opcional y tiene un valor por defecto.
5. **Mismo lenguaje que My Food Manager.** Mismos patrones visuales y de interacción, pensado para el móvil primero.

## 9. Constraints

- **Equipo:** Al, en solitario, con Claude Code; tiempo personal.
- **Presupuesto:** coste mensual ~0 € (planes gratuitos). *Inferido; confirmar.*
- **Calendario:** sin fecha objetivo.
- **Plataformas:** `web` (PWA instalable, nombre "My Coach"), mobile-first.
- **Integración obligatoria:** carpeta `fitness` de Google Drive, con el contrato de `fitness/_system/schema.md`. El esquema es de `fitness-manager`: cualquier ampliación (por ejemplo, la valoración por ejercicio, después del MVP) se hace allí, no desde la app. En el MVP la app solo escribe sesiones completadas, con el formato actual.
- **Datos de salud:** el programa contiene datos de salud de Al (hernia, dolor). Uso exclusivamente personal, sin logins; las credenciales de Drive no pueden quedar expuestas en el cliente.
- **Referencia de diseño:** my-food-manager (ui_standards, ui_kit_registry y su forma de acceder al Drive), solo lectura, según la excepción registrada en `SDLC.md`.

## 10. Scale & Quality Expectations

- **Usuarios:** 1 (Al), ahora y dentro de 12 meses.
- **Uso:** 4–5 sesiones por semana de 30–60 min, por la mañana; consultas sueltas. Sin concurrencia.
- **Datos:** ~30 ejercicios, ~10 rutinas, ~250 sesiones al año (archivadas por año). Datos de salud personales. Se conservan indefinidamente en el Drive.
- **Disponibilidad:** una caída es una molestia, no un problema, siempre que el modo sin conexión funcione.
- **Sin conexión:** imprescindible en toda la app (piscina, gimnasio, de viaje), incluido registrar sesiones y subirlas al recuperar la red. Un solo dispositivo; no hace falta tiempo real. Las sesiones parciales viven solo en el almacenamiento del dispositivo.

## 11. Risks & Assumptions

- **Supuesto:** una sesión parcial que no se completa ese día no deja rastro en el knowledge-base; Al lo acepta.
- **Riesgo:** borrar los datos del navegador hace perder una sesión parcial en curso. Aceptado.
- **Riesgo:** escrituras concurrentes en `sessions/al.yaml` (la app y Claude o Telegram a la vez). Se mitiga con la regla de escritura optimista del knowledge-base.
- **Supuesto:** el monigote basta como imagen; los 8 ejercicios sin `figure` muestran un marcador.
- **Supuesto:** "Hoy" es el día de la semana local del móvil, y los `days` de las rutinas activas prevalecen sobre `program.week`, como dice el esquema.
- **Supuesto:** reanudar solo en el mismo dispositivo y el mismo día; al día siguiente la sesión parcial se descarta.

## 12. Open Questions

- Diseño de la valoración por ejercicio (cómo se guarda y cómo la usa `fitness-manager`): fuera del MVP. Responsable: Al, con la skill `fitness-manager`; antes de la feature 10.
- "Grupo muscular" en el filtro de ejercicios: ¿zonas (glúteo, brazo, core…) o músculos concretos? *Propuesta: zonas.* Antes del PRD de la feature 4.
