'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { RestaurantConfig } from './schema'
import { getBrandingTokens, type BrandingTokens } from './branding'
import { getFeatureFlags, type FeatureFlags } from './features'

// ==============================================================================
// Client-Side Restaurant Configuration
// ==============================================================================
// The root server layout loads config.json and injects the public-safe
// subset here. Client components consume it via useClientConfig() — they
// must NEVER import @/config/loader (which uses Node fs + server-only).
// ==============================================================================

export type PublicRestaurantConfig = RestaurantConfig

const ClientConfigContext = createContext<PublicRestaurantConfig | null>(null)

export function ClientConfigProvider({
  config,
  children,
}: {
  config: PublicRestaurantConfig
  children: ReactNode
}) {
  return (
    <ClientConfigContext.Provider value={config}>
      {children}
    </ClientConfigContext.Provider>
  )
}

export interface ClientConfig {
  config: PublicRestaurantConfig
  restaurantName: string
  branding: BrandingTokens
  features: FeatureFlags
  helplinePhone: string
}

/**
 * Access the restaurant configuration from any client component.
 */
export function useClientConfig(): ClientConfig {
  const config = useContext(ClientConfigContext)
  if (!config) {
    throw new Error('useClientConfig must be used within <ClientConfigProvider>')
  }
  return {
    config,
    restaurantName: config.name,
    branding: getBrandingTokens(config),
    features: getFeatureFlags(config),
    helplinePhone: config.contact?.helpline || config.contact?.phone || '',
  }
}
