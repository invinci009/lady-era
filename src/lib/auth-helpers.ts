import { getRestaurantConfig } from '@/config/loader'

// ==============================================================================
// Authentication Helpers
// ==============================================================================
// Resolves email aliases to the configured admin email.
// ==============================================================================

/**
 * Get the admin email from configuration, falling back to Firebase admin account.
 */
export function getAdminEmail(): string {
  const config = getRestaurantConfig()
  return config.contact.email || 'admin@ladysera.com'
}

/**
 * Resolve any email alias or input to the configured admin email.
 */
export function resolveAdminEmail(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null

  const adminEmail = getAdminEmail()

  // If the input matches the admin email, return it
  if (trimmed.toLowerCase() === adminEmail.toLowerCase()) {
    return adminEmail
  }

  // Check for common aliases
  const aliases = ['admin', 'owner', 'manager', 'staff', 'ladys-era', 'ladysera']
  if (aliases.includes(trimmed.toLowerCase())) {
    return adminEmail
  }

  return trimmed
}
