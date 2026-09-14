# Garage IV-D — Tier-2 tuning and finishes

## Scope and baseline

Requested after the IV-D handoff: `d96067ec6e855fb24f80edcf7c768ad23e46ed70`,
with PR #48 merged, six cars and Save v25 / CE1. This phase extends Serein,
Rendan and Canto Club through the existing Workshop. It adds no vehicles,
manufacturer identities, racing systems, body kits or changes to acquisition gates.
The seventeen-identity wishlist remains planning only.

## Two alternative permanent setups per model

| Model / setup | One-time cost | Additional effect while fitted and active |
| --- | ---: | --- |
| Serein / Nightshift ECU | $24,000 | +8% manual delivery Cash |
| Serein / Workshop support gearing | $22,000 | +5% Business Production |
| Rendan / Dispatch gearing | $28,000 | +12% Dispatcher Cash |
| Rendan / Express route ECU | $25,000 | +6% manual delivery Cash |
| Canto Club / Boardroom gearing | $40,000 | +5% Business Production |
| Canto Club / Night manager ECU | $30,000 | +8% Dispatcher Cash |

Ownership and sufficient Cash are the only purchase requirements. Each purchase
fits that setup; it never activates the vehicle. Stock and previously purchased
setups can be fitted for free. One setup per model applies, and only on the active
car. Buying both setups does not stack their effects. Existing base effects remain.
New Dispatcher-only parts have explicit EN/DE scope text; Villager uses the existing
localization transformation. Prices use integer cents, effects use shared modifiers.

## Balance and practical limits

The six additions preserve existing roles and keep tuned Tier-1 models useful.
No acquisition price, base bonus, Heat rule, job reward, Dispatcher cadence or
Business production constant changes. Percent modifiers multiply, not add.

| Active setup | Cold manual $25 job | Dispatcher $25 job | Production factor |
| --- | ---: | ---: | ---: |
| Serein Nightshift | $34.02 | $25.00 | 1.00 |
| Serein Workshop | $31.50 | $25.00 | 1.05 |
| Rendan Dispatch | $29.50 | $33.04 | 1.00 |
| Rendan Express | $31.27 | $29.50 | 1.00 |
| Canto Boardroom | $25.00 | $28.00 | 1.239 |
| Canto Night manager | $25.00 | $30.24 | 1.18 |

Serein remains the manual specialist: even stock Serein ($31.50) beats Rendan
Express ($31.27). Rendan Dispatch remains ahead of Canto Night manager for
Dispatcher payout. Serein Workshop does not overtake KX-R Fleet production
(1.155). Lilt retains its exclusive cooling/decoy niche.

These are optional permanent specializations, not a recommended income route.
At the isolated cold base payout, Serein Nightshift adds $2.52 per job and takes
9,524 jobs to recover $24,000; Rendan Express adds $1.77 and takes 14,125 jobs.
Rendan Dispatch adds $3.54 per dispatch: 7,910 jobs, about 21.97 hours at 10s/job.
Canto Night manager adds $2.24: 13,393 dispatches, about 37.20 hours at 10s/job.
Those are fixed-rate marginal comparisons, not sustained Heat/progression forecasts.

At the documented 15/10/5/no-Nights portfolio ($136.25/s base), Serein Workshop
adds $6.8125/s: about 0.897 hours for $22,000; Canto Boardroom adds $8.03875/s:
about 1.382 hours for $40,000. Against a 25/15/8/1 portfolio ($253.75/s), these
become about 0.482 and 0.742 hours. These figures hold Businesses fixed and omit
Crew, skills and equipment. Reinvesting the money in Business levels can be better.
The broader manual-income imbalance recorded in TIER_TWO_GARAGE.md remains;
this bounded phase does not attempt an Operations economy overhaul.

## Curated finishes

| Model | Finish 1 | Finish 2 |
| --- | --- | --- |
| Serein | Midnight Plum / Mitternachtspflaume | Copper Getaway / Kupferflucht |
| Rendan | Crimson Alibi / Karmin-Alibi | Ice Witness / Eiszeuge |
| Canto Club | Burgundy Dividend / Bordeaux-Dividende | Slate Account / Schieferkonto |

Factory paint remains available. Preview and discard do not save or charge Cash;
explicit application is free for an owned vehicle. Garage and Workshop show the
applied finish. Paint does not activate cars, fit parts or change bonuses.

The existing approved PNG/WebP assets remain byte-for-byte unchanged. Each new
silhouette has separately traced body/opening/mirror contours in the existing SVG
paint renderer, normalized from its own 1672x940 reference to 720x405. No Tier-1
mask was reused. Lamps, glass, wheels, intakes, badges and the showroom are protected.
Model-specific luminance weights retain usable body shading on the dark blue and
green references without overdriving highlights. Tier-1 rendering coefficients stay
unchanged. Floor reflections remain factory-colored.
This is curated 2D paint, not a 3D material renderer or new model artwork.

## Save v26 / CE1

No new state fields: existing per-vehicle builds and appearance maps are extended.
Sequential v25→v26 validation freezes the historical Tier-1-only customization
boundary before accepting the new IDs. Historical saves cannot inject Tier-2
parts or finishes. Migration retains all six vehicle identities, purchased parts,
selected setups, applied looks, active car, timestamps, earned fractions and every
unrelated progression field. Nothing is granted or reset. CE1 stays unchanged.

Runtime still reconciles old effects before a real fit, then saves before publishing.
Quota/conflict failures retain the prior build, appearance and Cash. Offline uses
the saved active setup exactly once; Rebirth retains the whole Garage; explicit
New Game is the only reset that clears it. Old clients reject the newer envelope.

## Verification and release status

Implementation is complete; PR #49 tracks verification and release status.
Local production build and all 2,626 tests passed. Enlarged review of factory plus
all six finishes identified and corrected Rendan's front arch, the painted mirror
bases and narrow tail-lamp boundaries. All 100 rendered body/protected comparisons
and three complete desktop customization flows passed after those corrections.
Body samples must change by more than 8 channel levels (including dark paint);
protected samples may change by at most 2. These samples supplement visual review,
not a claim that every boundary pixel is perfect.

The initial CI passed build, all tests, Garage, all sections/locales/settings,
225 layout cases, Tier-1 tuning/paint and the Serein/Rendan/Canto purchase matrices.
It caught the same Rendan tail-lamp overlap; the follow-up fixes that contour and
Canto's corresponding boundary. The final full CI remains a release gate.
Release evidence must name its exact commit; this document does not claim merge,
deployment or live acceptance.
The new verifier is `scripts/verify-tier-two-customization.mjs`: three models,
three languages and five widths, migration, failure/retry, both setups, free stock
switching, preview/discard/apply, reload, activation, retained KX-R build/finish,
125% text, runtime errors and rendered body/protected pixel samples.
Existing Serein/Rendan/Canto purchase checks now expect available customization.

Future work remains separately scoped. Do not start Tier 3 or the wishlist here.
