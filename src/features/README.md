# Feature modules

Economy is implemented in Phase 1A. Create other feature folders only when requested. Planned names:
`economy`, `buildings`, `upgrades`, `cars`, `garage`, `rebirth`, `skills`,
`territories`, `heat`, `crew`, `events`, `automation`, `achievements`, `statistics`.

A feature may grow `model/` (pure domain logic/types), `config/` (definitions and
balance), and `ui/` (React views), with `index.ts` as its public entry point.
Start with the few files needed; these are conventions, not mandatory empty folders.
Domain code must not import React, browser APIs, UI, or another feature's internals.
See docs/ARCHITECTURE.md for planned integration contracts.
