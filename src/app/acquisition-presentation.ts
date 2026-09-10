export function acquisitionPresentation(requirementsMet: boolean, affordable: boolean, noun = 'Business', verb = 'acquire') {
  return !requirementsMet
    ? { status: 'LOCKED', note: `Meet the requirements above to unlock this ${noun}.` }
    : !affordable ? { status: 'INSUFFICIENT CASH', note: `Build your Cash balance to ${verb} this ${noun}.` }
    : { status: 'PURCHASABLE', note: null };
}
