# Game integration boundary

Phase 1A owns GameState creation, the starter job coordinator and cash selectors.
Feature rules remain in economy. Domain modules are independent of React, browser
APIs, clocks and artwork. No other feature or persistence contract is implemented.
See docs/ARCHITECTURE.md for state and money contracts.
