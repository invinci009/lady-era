import { createHash } from 'crypto'
import type { FactSheet } from './fact-sheet'
import { validateDraft } from './validators'

export interface GenerationResult {
  text: string
  method: 'llm' | 'fallback'
}

/**
 * Deterministic sentence banks seeded by session_id to satisfy CG-7 (anti-repetition).
 */
const OVERALL_POSITIVE = [
  'Had a really pleasant visit here today.',
  'Really enjoyed my dining experience at this place.',
  'Had a great time visiting today.',
  'Wonderful experience dining here today.',
]

const OVERALL_NEUTRAL = [
  'Visited here today for a meal.',
  'Stopped by for dining today.',
  'An okay visit overall today.',
]

const OVERALL_NEGATIVE = [
  'Visited here today, but the visit was disappointing.',
  'Dined here today, though the overall visit fell short.',
  'Stopped by today, but my experience was not as expected.',
]

const FOOD_POSITIVE = [
  'The food was very flavorful and fresh.',
  'Really enjoyed the flavors and quality of the dishes.',
  'The dishes were prepared well and tasted good.',
]

const FOOD_NEUTRAL = [
  'The food was acceptable and decent.',
  'The meal was okay and met standard expectations.',
]

const FOOD_NEGATIVE = [
  'The food was lacking flavor and did not meet expectations.',
  'The dishes served were disappointing in taste.',
]

const SERVICE_POSITIVE = [
  'The staff was polite and attentive throughout.',
  'Service was friendly and promptly delivered.',
  'The hospitality was warm and accommodating.',
]

const SERVICE_NEUTRAL = [
  'Service was standard and adequate.',
  'Staff attended to our table without delay.',
]

const SERVICE_NEGATIVE = [
  'The service was quite slow and needed more attention.',
  'Staff could have been more attentive and responsive.',
]

function getSeededIndex(seed: string, length: number): number {
  const hash = createHash('md5').update(seed).digest('hex')
  const num = parseInt(hash.substring(0, 8), 16)
  return num % length
}

/**
 * Generates a deterministic review draft using tone-matched phrasing banks.
 */
export function generateDeterministicDraft(factSheet: FactSheet, sessionId: string): string {
  const sentences: string[] = []

  // 1. Overall Sentence
  const overallTone = factSheet.overall?.tone || 'positive'
  if (overallTone === 'positive') {
    sentences.push(OVERALL_POSITIVE[getSeededIndex(sessionId + '-ov', OVERALL_POSITIVE.length)])
  } else if (overallTone === 'neutral') {
    sentences.push(OVERALL_NEUTRAL[getSeededIndex(sessionId + '-ov', OVERALL_NEUTRAL.length)])
  } else {
    sentences.push(OVERALL_NEGATIVE[getSeededIndex(sessionId + '-ov', OVERALL_NEGATIVE.length)])
  }

  // 2. Food Sentence
  const foodTone = factSheet.food?.tone || 'positive'
  if (foodTone === 'positive') {
    sentences.push(FOOD_POSITIVE[getSeededIndex(sessionId + '-fd', FOOD_POSITIVE.length)])
  } else if (foodTone === 'neutral') {
    sentences.push(FOOD_NEUTRAL[getSeededIndex(sessionId + '-fd', FOOD_NEUTRAL.length)])
  } else {
    sentences.push(FOOD_NEGATIVE[getSeededIndex(sessionId + '-fd', FOOD_NEGATIVE.length)])
  }

  // 3. Dishes ordered or compliments liked
  if (factSheet.ordered.length > 0 && foodTone === 'positive') {
    const dishes = factSheet.ordered.slice(0, 2).join(' and ')
    sentences.push(`The ${dishes} stood out during our meal.`)
  } else if (factSheet.liked.length > 0 && overallTone === 'positive') {
    const aspects = factSheet.liked.slice(0, 2).join(' and ')
    sentences.push(`We especially appreciated the ${aspects}.`)
  }

  // 4. Service Sentence
  const serviceTone = factSheet.service?.tone || 'positive'
  if (serviceTone === 'positive') {
    sentences.push(SERVICE_POSITIVE[getSeededIndex(sessionId + '-sv', SERVICE_POSITIVE.length)])
  } else if (serviceTone === 'neutral') {
    sentences.push(SERVICE_NEUTRAL[getSeededIndex(sessionId + '-sv', SERVICE_NEUTRAL.length)])
  } else {
    sentences.push(SERVICE_NEGATIVE[getSeededIndex(sessionId + '-sv', SERVICE_NEGATIVE.length)])
  }

  return sentences.join(' ')
}

/**
 * Random narrative angles — a different one is picked per generation so
 * Groq doesn't converge on the same sentence structures every time.
 * Each angle still only uses facts from the Fact Sheet.
 */
const STYLE_ANGLES = [
  'Open with the dish that impressed you most, then mention service briefly.',
  'Open with the overall feeling of the visit, then highlight one specific detail.',
  'Start with the occasion or company (family dinner, friends, team lunch), then describe food and service.',
  'Open with the hospitality and service, then describe the food.',
  'Start with a standout flavor or specific dish, then zoom out to the overall experience.',
  'Open with ambience and comfort, then cover food quality and staff behavior.',
]

function pickAngle(): string {
  return STYLE_ANGLES[Math.floor(Math.random() * STYLE_ANGLES.length)]
}

/**
 * Main review draft pipeline.
 * Uses Groq (OpenAI-compatible API) with high temperature + a random
 * narrative angle per call so every draft is unique. Validates the output
 * and retries once with a different angle on failure, then falls back
 * to the deterministic template.
 */
export async function generateReviewDraft(
  factSheet: FactSheet,
  sessionId: string,
  restaurantName: string
): Promise<GenerationResult> {
  // GROQ_API_KEY is canonical; also accept a Groq key stored in
  // ANTHROPIC_API_KEY (gsk_ prefix) for backwards compatibility.
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const apiKey =
    process.env.GROQ_API_KEY ||
    (anthropicKey?.startsWith('gsk_') ? anthropicKey : undefined)
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b'

  if (apiKey) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        // 12s timeout controller
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 12000)

        const angle = pickAngle()
        const variationSeed = Math.random().toString(36).slice(2, 10)
        const prompt = `You are helping a restaurant customer write a brief, authentic review draft for ${restaurantName}.
STRICT RULES:
1. Write in the first person ("I" / "We").
2. Length MUST be between 30 and 70 words.
3. Use ONLY facts from this Fact Sheet:
${JSON.stringify(factSheet, null, 2)}
4. Preserve sentiment: negative ratings MUST sound polite but dissatisfied; positive ratings must sound pleased.
5. Do NOT include staff names, prices, promotional offers, discounts, star ratings (e.g. "5 stars"), URLs, or hashtags.
6. Narrative angle for THIS review: ${angle}
7. Variation seed "${variationSeed}": phrase everything in fresh, unique wording. Do NOT reuse generic openers like "Had a wonderful dining experience".
8. Return plain text only without markdown formatting or quotation marks.`

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model,
            temperature: attempt === 0 ? 0.9 : 1.0,
            top_p: 0.95,
            max_tokens: 1024,
            reasoning_effort: 'low',
            messages: [{ role: 'user', content: prompt }],
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          const candidateText = data?.choices?.[0]?.message?.content?.trim()
          if (candidateText) {
            const validation = validateDraft(candidateText, factSheet)
            if (validation.valid) {
              return { text: candidateText, method: 'llm' }
            }
            console.warn('Groq draft failed validation, retrying:', validation.errors)
          }
        } else {
          console.warn('Groq draft request failed:', response.status, await response.text().catch(() => ''))
        }
      } catch (err) {
        console.warn('Groq draft generation failed or timed out, retrying/falling back:', err)
      }
    }
  }

  // Graceful deterministic template fallback
  const fallbackText = generateDeterministicDraft(factSheet, sessionId)
  return { text: fallbackText, method: 'fallback' }
}
