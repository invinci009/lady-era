import type { RestaurantConfig } from './schema'

// ==============================================================================
// Branding Token Resolver (client-safe: no server imports)
// ==============================================================================
// Pure functions over a RestaurantConfig object. Server components load the
// config via getRestaurantConfig() and pass it in; client components get it
// from useClientConfig().
// ==============================================================================

export interface BrandingTokens {
  primary: string
  secondary: string
  accent: string
  logoUrl: string | null
  faviconUrl: string | null
}

/**
 * Get branding tokens for a restaurant configuration.
 */
export function getBrandingTokens(config: RestaurantConfig): BrandingTokens {
  return {
    primary: config.branding.primaryColor,
    secondary: config.branding.secondaryColor,
    accent: config.branding.accentColor || config.branding.primaryColor,
    logoUrl: config.branding.logoUrl || null,
    faviconUrl: config.branding.faviconUrl || null,
  }
}

/**
 * Generate CSS custom properties string for inline style injection.
 * Use this in the root layout to set CSS variables on :root.
 */
export function generateBrandingCSS(config: RestaurantConfig): string {
  const tokens = getBrandingTokens(config)
  return [
    `--brand-primary: ${tokens.primary};`,
    `--brand-secondary: ${tokens.secondary};`,
    `--brand-accent: ${tokens.accent};`,
  ].join('\n')
}

/**
 * Get the restaurant name from config.
 */
export function getRestaurantName(config: RestaurantConfig): string {
  return config.name
}

/**
 * Get the welcome message for the specified language.
 */
export function getWelcomeMessage(config: RestaurantConfig, language?: string): string {
  const lang = language || config.settings.defaultLanguage
  return config.welcomeMessage[lang] || config.welcomeMessage['en'] || ''
}
