import type { RestaurantConfig } from './schema'

// ==============================================================================
// Feature Flag Resolver (client-safe: no server imports)
// ==============================================================================
// Pure functions over a RestaurantConfig object.
// ==============================================================================

export interface FeatureFlags {
  aiReviews: boolean
  privateFeedback: boolean
  crm: boolean
  campaignAnalytics: boolean
  menuManagement: boolean
  weeklyReports: boolean
  customerRecovery: boolean
}

/**
 * Get all feature flags for a restaurant configuration.
 */
export function getFeatureFlags(config: RestaurantConfig): FeatureFlags {
  return {
    aiReviews: config.features.aiReviews,
    privateFeedback: config.features.privateFeedback,
    crm: config.features.crm,
    campaignAnalytics: config.features.campaignAnalytics,
    menuManagement: config.features.menuManagement,
    weeklyReports: config.features.weeklyReports || false,
    customerRecovery: config.features.customerRecovery || false,
  }
}

/**
 * Check if a specific feature is enabled.
 */
export function isFeatureEnabled(config: RestaurantConfig, feature: keyof FeatureFlags): boolean {
  return getFeatureFlags(config)[feature]
}
