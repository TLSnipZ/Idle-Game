# Overview / City card spacing recovery

Status: implemented and browser-checked on the fix branch; production build/deploy
and manual live acceptance are separate gates. No new artwork or redesign.

## Report and reproduced cause

The user's screenshots show Overview cards touching vertically and the City Heat
panel touching the district cards. On baseline main `520ea18`, `overview-command`
and `district-pressure-layout` have no layout/gap rules. Chromium measured **0px**
between all seven Overview cards and **0px** between the district group and Heat.
The outer City `section-stack` and the territory/crew/event-choice catalogs already
have their own working gaps; these are not replaced.

## Minimal correction

Append scoped rules to `src/app/sections.css`; preserve all existing file contents.

- `[data-section="overview"] > .overview-command`: explicit single-column grid.
- `[data-section="city"] .district-pressure-layout`: explicit single-column grid.
- Both use `--space-lg` (1.5rem / 24px at default font size), falling back to
  `--space-md` (1rem / 16px) at viewport widths up to 740px.
- Reset only the direct Heat panel's legacy bottom margin. The existing 2rem City
  section-stack gap owns separation from Crew; otherwise margins would add twice.
- Keep Overview order, card widths/heights, City catalog columns, all text and actions.

No generic `.panel` or `.section-stack` override. No edits to App.tsx, Operations.css,
Hud2.css, gameplay, saves, localization, artwork, navigation or dependencies.

## Browser verification

Used the actual Pages artifact for commit `68d6bbb` (run `34722063196`). GitHub's
comparison confirms main `520ea18` differs only in POST_ROADMAP documentation.
The compiled HTML/CSS/JS were loaded in an offline Chromium harness. The Kairo asset
URL was inlined and localStorage used an in-memory adapter because the sandbox
cannot navigate network/file origins. Gameplay code and component markup were not
mocked. The candidate CSS was injected after the compiled stylesheet.

**22 before/after cases passed:**

- 320, 390, 740, 741, 900, 901, 1024, 1440 and 1920px in both English and German;
- 390 and 1440px in German with 20px and 24px root fonts;
- all seven Overview cards have exact expected gaps, unchanged dimensions/order;
- district-to-Heat gap matches Overview; Heat-to-Crew and Crew-to-Events retain 2rem;
- territory/crew catalog column counts remain unchanged;
- all five navigation destinations work; Operations business grid, static category
  navigation, HUD/XP geometry, Garage and Empire geometry match the baseline;
- no browser JavaScript errors during these checks;
- desktop/mobile before/after screenshots inspected;
- added CSS parses and its diff has no whitespace errors.

Source checkout is blocked by sandbox DNS, so local npm typecheck/build/Vitest were
not run. The existing Pages workflow performs the checked production build after
merge; it does not run the Vitest suite. Do not report browser geometry checks as
full gameplay regression coverage or as manual user acceptance.

## Future regression checks

At a normal 16px root font, measure adjacent `.overview-command > .summary-card`
rectangles: next.top minus previous.bottom must be 24px above 740px or 16px below.
Measure `.district-pressure-layout > .heat-panel`.top minus `.district-zone`.bottom
against the same target. Ensure no doubled margin before Crew. Repeat at 390/1440px,
with longer German copy and increased text size. Verify Operations remains two
Business columns above 900px and one below, without sticky category navigation.

Business artwork rollout remains paused pending the existing presentation acceptance
and explicit Dockside artwork approval. No next phase is started by this hotfix.
