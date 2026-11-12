# ADR 001: Sin conexión con snapshot local y outbox de operaciones

> Project: `fitness-coach`
> Status: Accepted (2026-11-12)
> Triggered by: Phase 0.2 (Visión §10: toda la app sin conexión)

## Context
La app debe funcionar entera sin red (piscina, gimnasio, viajes), incluido terminar una rutina y registrarla. El Drive es la fuente de verdad y `fitness-manager` escribe en la misma carpeta (Visión §8.1, §11).

## Options Considered
- **Solo online:** lo más simple, pero incumple el driver principal.
- **Snapshot en IndexedDB + outbox de operaciones de intención aplicadas en el servidor:** una sola copia local, el servidor fusiona contra el fichero más reciente. Poca complejidad.
- **Sincronización completa con CRDT / base local replicada:** innecesaria para 1 usuario que solo añade sesiones.

## Decision
Snapshot normalizado en IndexedDB, service worker para el shell y una outbox ordenada de operaciones `{ op_id, type, payload }` que el servidor aplica con read-modify-write, comprobación de `modifiedTime`, un reintento e idempotencia por `op_id`. La sesión en curso o parcial vive solo en IndexedDB.

## Consequences
tech_standards §3, §9 y §11; hl_architecture §5, §7. Una sesión parcial no completada no llega al Drive (aceptado en la Visión §11). Señal de error: sesiones duplicadas o perdidas en `sessions/al.yaml`.

## Enforcement
Tests unitarios del merge, la idempotencia y el reenvío de la outbox (tech_standards §14); e2e del flujo sin conexión. Revisión: ninguna escritura fuera de `POST /api/ops`.
