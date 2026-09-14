# Whole-game layout review

## Scope
Requested before the next tuning phase, after PR #36. Reviewed Overview, Operations,
City, Collection and Empire with fresh, midgame and advanced saves. This is a
presentation and navigation pass; Save v21 / CE1 and all economic rules are unchanged.

## Findings and changes
- Overview stacked seven full-width cards on desktop. A responsive two/three-column
  dashboard gives income the strongest emphasis and groups the remaining summaries.
- Operations had no equipment shortcut. Its four destinations now share the same
  control style as new City, Collection and Empire indexes. Desktop indexes remain
  beside the content while scrolling; narrow screens use wrapping controls.
- Risky and discreet deliveries were far apart vertically. They now sit side by
  side where space allows, with normal delivery first and all exact payout/Heat
  information retained. No action or prerequisite is hidden.
- Activity items enlarged the fixed HUD as more systems unlocked. Activity now
  sits below the fixed stats/navigation and scrolls with the page. Its event,
  automation and Rebirth buttons target their actual section headings.
- Overview Crew/Event shortcuts previously opened the top of City. They now focus
  and scroll directly to Crew/Events, including repeated same-section requests.
- Fixed pixel/rem offsets could place destinations behind wrapped/zoomed chrome.
  A ResizeObserver measures the actual sticky HUD; resize and cleanup are handled,
  and short viewports use static chrome. Destination/control scroll margins follow it.
- RebirthNotice had no stylesheet: its screenreader announcement and both responsive
  button labels rendered visibly. The notice now has a compact banner, one visible
  button label and a visually hidden, still accessible live announcement.
- Collection typography, card padding, section headings and record cards now share
  a quieter visual hierarchy. Existing artwork, humor and all three locales remain.

## Boundaries
Primary sections still mount one presentation tree, with runtime and confirmation
controllers above navigation. Section indexes move focus only; they do not write
storage, reset automation, change selection or trigger game commands. Native
disclosures retain keyboard behavior. Error, payment, reset and import confirmations
remain visible and keep their existing persistence protections.

The five primary areas remain separate pages. Local area controls are explicitly
quick access links, not tabs that pretend to hide content. Game catalogs remain
available to browsing and existing Next Objective destinations.

## Verification
Strict build and the complete existing regression suite are release gates.
Two additional interaction tests exercise all new index destinations and repeated
Crew/Event navigation with no clock/storage/runtime side effects. Existing
navigation assertions now verify the precise destination and the fourth Operations
entry rather than the former top-of-page behavior.

The production layout matrix covers 225 cases: three locales, five widths
(320/390/740/1024/1440), three progression stages and five sections, at 125% text
size. It checks overflow, navigation labels, keyboard focus destinations, actual
HUD clearance, repeated event routing and responsive Rebirth labels. It complements
the existing 360 gameplay/browser cases. Run outcomes and deployment are recorded
in the PR; automated checks do not replace user visual acceptance.

## Remaining work
Large catalogs can still require substantial scrolling on narrow phones. True
subpages/filtering can be a future explicit scope if the catalogs grow. This review
does not claim exhaustive absence of gameplay bugs. Senda/Lilt model-specific tuning
remains the next separate gameplay phase.
