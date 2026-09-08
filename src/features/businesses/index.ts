export { STARTER_BUSINESS, findBusiness } from './config/business-config';
export { createInitialBusinessState, ownsBusiness } from './model/business';
export type { BusinessId, BusinessDefinition, BusinessState } from './model/business';
export { prepareBusinessOwnership } from './model/prepare-business-ownership';
export type { BusinessOwnershipError } from './model/prepare-business-ownership';
export { getOwnedProductionRates } from './model/production';

export { MAX_BUSINESS_LEVEL, isBusinessLevel, getBusinessLevel, getLevelProduction, getUpgradeCost } from './model/levels';
