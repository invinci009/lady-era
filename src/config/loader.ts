import 'server-only'
import { validateRestaurantConfig, type RestaurantConfig } from './schema'
import { readFileSync } from 'fs'
import { join } from 'path'

// ==============================================================================
// Centralized Restaurant Configuration Loader
// ==============================================================================
// Loads and validates the client configuration from config.json.
// This is the single source of truth for all restaurant-specific settings.
// ==============================================================================

let cachedConfig: RestaurantConfig | null = null

/**
 * Load the restaurant configuration from the config file.
 * In production, this reads from config.json at the project root.
 * Falls back to environment variables for Firebase config.
 */
export function getRestaurantConfig(): RestaurantConfig {
  if (process.env.NODE_ENV === 'production' && cachedConfig) return cachedConfig

  // Try to load from config.json
  const configPath = join(process.cwd(), 'config.json')

  try {
    const raw = readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(raw)
    const result = validateRestaurantConfig(parsed)

    if (!result.success) {
      console.error('Invalid restaurant configuration:', result.errors?.message)
      // Return a minimal fallback config to prevent crashes
      cachedConfig = getDefaultConfig()
      return cachedConfig
    }

    cachedConfig = result.data!
    return cachedConfig
  } catch {
    // If config.json doesn't exist, try environment-based config
    const envConfig = loadConfigFromEnv()
    if (envConfig) {
      cachedConfig = envConfig
      return cachedConfig
    }

    // Final fallback
    cachedConfig = getDefaultConfig()
    return cachedConfig
  }
}

/**
 * Load configuration from environment variables (for simple deployments)
 */
function loadConfigFromEnv(): RestaurantConfig | null {
  const name = process.env.RESTAURANT_NAME
  const slug = process.env.RESTAURANT_SLUG
  const reviewUrl = process.env.GOOGLE_REVIEW_URL

  if (!name || !slug || !reviewUrl) return null

  const result = validateRestaurantConfig({
    name,
    slug,
    contact: {
      phone: process.env.RESTAURANT_PHONE,
      helpline: process.env.RESTAURANT_HELPLINE,
      email: process.env.RESTAURANT_EMAIL,
    },
    location: {
      address: process.env.RESTAURANT_ADDRESS,
      city: process.env.RESTAURANT_CITY,
      state: process.env.RESTAURANT_STATE,
      country: process.env.RESTAURANT_COUNTRY,
    },
    google: { reviewUrl },
    branding: {
      logoUrl: process.env.RESTAURANT_LOGO_URL,
      primaryColor: process.env.BRAND_PRIMARY_COLOR || '#d97706',
      secondaryColor: process.env.BRAND_SECONDARY_COLOR || '#1e293b',
      accentColor: process.env.BRAND_ACCENT_COLOR,
    },
    features: {
      aiReviews: process.env.FEATURE_AI_REVIEWS !== 'false',
      privateFeedback: process.env.FEATURE_PRIVATE_FEEDBACK !== 'false',
      crm: process.env.FEATURE_CRM !== 'false',
      campaignAnalytics: process.env.FEATURE_CAMPAIGN_ANALYTICS !== 'false',
      menuManagement: process.env.FEATURE_MENU_MANAGEMENT !== 'false',
    },
    settings: {
      defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
      supportedLanguages: process.env.SUPPORTED_LANGUAGES?.split(',') || ['en'],
      timezone: process.env.TIMEZONE || 'Asia/Kolkata',
    },
  })

  return result.success ? result.data! : null
}

/**
 * Default fallback config (prevents crashes but should not be used in production)
 */
function getDefaultConfig(): RestaurantConfig {
  return {
    name: 'Restaurant',
    slug: 'restaurant',
    contact: {},
    location: {},
    google: {
      reviewUrl: 'https://search.google.com/local/writereview?placeid=placeholder',
    },
    branding: {
      primaryColor: '#d97706',
      secondaryColor: '#1e293b',
    },
    features: {
      aiReviews: true,
      privateFeedback: true,
      crm: true,
      campaignAnalytics: true,
      menuManagement: true,
    },
    settings: {
      defaultLanguage: 'en',
      supportedLanguages: ['en'],
      timezone: 'Asia/Kolkata',
    },
    welcomeMessage: {
      en: "Thanks for dining with us! We'd love to hear about your experience today.",
    },
  }
}

/**
 * Clear the cached config (useful for testing or hot reload)
 */
export function clearConfigCache(): void {
  cachedConfig = null
}
