export { STARTER_BUSINESS, BUSINESS_CATALOG, findBusiness } from './config/business-config';
export { createInitialBusinessState, ownsBusiness } from './model/business';
export type { BusinessId, BusinessDefinition, BusinessState } from './model/business';
export { prepareBusinessOwnership } from './model/prepare-business-ownership';
export type { BusinessOwnershipError } from './model/prepare-business-ownership';
export { getOwnedProductionInputs } from './model/production';

export { MAX_BUSINESS_LEVEL, isBusinessLevel, getBusinessLevel, getLevelProduction, getUpgradeCost } from './model/levels';
