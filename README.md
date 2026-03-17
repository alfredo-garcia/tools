# tools

Repositorio de herramientas.

## Arquitectura (apps)

Las apps del monorepo son **web PWA** únicamente. Dos paquetes compartidos:

- **@tools/shared** (`apps/shared`): design system — tokens CSS, componentes de UI (HTML + Tailwind), AuthContext, hooks y utilidades. Las apps web importan componentes y tokens desde aquí.
- **@tools/shared-planner** (`apps/shared-planner`): lógica de negocio del planner (tareas, hábitos, calendario). Sin UI; para pantallas se usa @tools/shared en la app (p. ej. planner-web).

## n8n

Servidor n8n en local con Docker. Ver [n8n/README.md](n8n/README.md). Arranque: `cd n8n && docker compose up -d`, luego http://localhost:5678.
