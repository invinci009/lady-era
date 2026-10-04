import { getRestaurantConfig } from '@/config/loader'

// ==============================================================================
// Authentication Helpers
// ==============================================================================
// Resolves email aliases to the configured admin email.
// ==============================================================================

/**
 * Get the admin email from configuration.
 */
export function getAdminEmail(): string | null {
  const config = getRestaurantConfig()
  return config.contact.email || null
}

/**
 * Resolve any email alias or input to the configured admin email.
 */
export function resolveAdminEmail(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null

  const adminEmail = getAdminEmail()
  if (!adminEmail) return trimmed

  // If the input matches the admin email, return it
  if (trimmed.toLowerCase() === adminEmail.toLowerCase()) {
    return adminEmail
  }

  // Check for common aliases
  const aliases = ['admin', 'owner', 'manager', 'staff']
  if (aliases.includes(trimmed.toLowerCase())) {
    return adminEmail
  }

  return trimmed
}
