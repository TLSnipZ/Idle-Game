import type { GameState } from '../game/game-state';
import { selectRiskyDelivery } from '../game/risky-delivery';
import { evaluateXpReward } from '../game/xp-reward';
import { isManualJobReady, manualJobRemainingMs } from '../game/manual-job-readiness';
import { formatReward } from './number-format';
import { formatXp } from './progression-presentation';
