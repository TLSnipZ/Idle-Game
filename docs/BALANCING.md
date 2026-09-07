# Balancing policy

## Phase 0

There are no gameplay balance values, live formulas or economy configuration yet.
This document defines how future balance work is organized. All formulas below
are candidate models or contract examples, not approved tuning.

## Source of truth

Place typed balance/content definitions in each feature's config directory. Shared
constants require a real shared owner. UI consumes definitions and selectors; it
must not duplicate costs, growth rates, thresholds, caps or bonus magnitudes.
Presentation tokens belong in styles and are unrelated to game balance.

Use explicit units and state whether a value is base or effective. Costs and income
must follow the economy's agreed numeric range and rounding policy. Derive values
where possible instead of keeping contradictory config fields.

## Candidate models for later evaluation

| Concern | Candidate | Decision required before implementation |
| --- | --- | --- |
| Business cost scaling | baseCost × growthRate^owned | Growth curve, limits, rounding and bulk purchase behavior |
| Production | Base rate adjusted by effective modifiers | Units, level curve, cycle/rate semantics and caps |
| Upgrade value | Cost / additional effective income | Target payback windows and meaningful alternatives |
| Rebirth reward | Function of eligible run achievement | Eligibility, scaling, reset/retention matrix and exploit prevention |
| Offline reward | Shared simulation over bounded elapsed time | Cap, efficiency, clock changes, expired effects and random event policy |
| Collections | Explicit set requirements and modifier sources | Duplicate ownership and stacking eligibility |
| Heat | Explicit penalties/recovery tied to actions/time | Bounds, risk visibility and active/idle fairness |

Modifier evaluation order is owned by ARCHITECTURE.md; do not redefine it per
feature. Keep prices, income and speed as distinct targets with explicit clamps
and rounding. For example, doubling production speed need not mean doubling a
stored duration: the stat semantics must say which quantity is modified.

## Goals and tuning practice

Measure time to first purchase, time to automation, marginal upgrade payback,
collection completion pace, rebirth duration and the value of permanent choices.
Set actual target ranges in the relevant phase. Preserve useful choices instead
of one dominant purchase path; automation should remove repetition without making
all decisions disappear. Temporary bonuses, permanent bonuses and collectibles
must not multiply without understood bounds.

Record balance changes here or beside the relevant config with: rationale, changed
values, simulation scenario, observed progression impact and save compatibility.
Balance-only changes normally recalculate derived stats; changes to owned state,
ID meaning or numeric representation may require migrations. No balancing tools,
simulators, spreadsheets or telemetry infrastructure are needed in Phase 0.

## Validation once systems exist

Test affordability at boundaries; no NaN/Infinity, negative funds or overflow;
modifier stacking/expiry/scopes; active vs automated action consistency; online vs
offline progression; prestige retention; and save migrations. Use deterministic
fixtures and simulations for actual rules, not duplicated implementation tests.
