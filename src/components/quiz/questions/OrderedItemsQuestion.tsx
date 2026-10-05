'use client'

import { ShoppingBag, Check, Plus, Sparkles } from 'lucide-react'

export interface MenuItemData {
  id: string
  name: Record<string, string> | string
}

interface OrderedItemsQuestionProps {
  menuItems: MenuItemData[]
  value: string[]
  onChange: (value: string[]) => void
}

const DEFAULT_COLLECTIONS: MenuItemData[] = [
  { id: 'sarees', name: 'Designer Sarees' },
  { id: 'kurti_sets', name: 'Kurti & Anarkali Sets' },
  { id: 'lehengas', name: 'Party & Bridal Lehengas' },
  { id: 'western_wear', name: 'Western Wear & Tops' },
  { id: 'coord_sets', name: 'Co-ord Sets & Tunics' },
  { id: 'ethnic_suits', name: 'Festive Ethnic Suits' },
  { id: 'dupattas', name: 'Dupattas & Stoles' },
  { id: 'accessories', name: 'Boutique Jewellery & Accessories' },
]

export default function OrderedItemsQuestion({
  menuItems,
  value,
  onChange,
}: OrderedItemsQuestionProps) {
  // Use passed menuItems if configured in DB, or elegant fallback collections
  const activeItems = menuItems && menuItems.length > 0 ? menuItems : DEFAULT_COLLECTIONS

  const toggleItem = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((i) => i !== id))
    } else {
      onChange([...value, id])
    }
  }

  const getItemName = (item: MenuItemData): string => {
    if (typeof item.name === 'string') return item.name
    if (typeof item.name === 'object' && item.name !== null) {
      return item.name.en || Object.values(item.name)[0] || 'Fashion item'
    }
    return 'Fashion item'
  }

  return (
    <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200/80 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-rose-900">
            Question 5 of 6
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-[11px] text-rose-800 font-medium">Optional</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          Which collections did you{' '}
          <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
            explore today
          </span>
          ?
        </h2>
        <p className="text-sm text-stone-600">
          Select outfits, styles, or categories you browsed or shopped
        </p>
      </div>

      {/* Grid of Collection Chips */}
      <div
        role="group"
        aria-label="Explored collections"
        className="py-2 flex flex-wrap justify-center gap-2.5 max-w-lg mx-auto"
      >
        {activeItems.map((item) => {
          const isSelected = value.includes(item.id)
          const name = getItemName(item)

          return (
            <button
              key={item.id}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              onClick={() => toggleItem(item.id)}
              aria-label={name}
              className={`px-4 py-2.5 min-h-[44px] rounded-full border text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 shadow-xs ${
                isSelected
                  ? 'border-rose-600 bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/20'
                  : 'border-stone-200 bg-stone-50/70 text-stone-700 hover:bg-white hover:border-rose-300 hover:text-stone-900'
              }`}
            >
              {isSelected ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Plus className="w-3.5 h-3.5 text-stone-400" />
              )}
              <span>{name}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
        <ShoppingBag className="w-3.5 h-3.5 text-rose-600" />
        <span>Tap multiple items if you explored several collections</span>
      </div>
    </div>
  )
}
