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
  'Had a really wonderful shopping experience here today.',
  'Really enjoyed browsing and shopping the collection today.',
  'Had a lovely time visiting this boutique today.',
  'A truly delightful boutique experience shopping here today.',
]

const OVERALL_NEUTRAL = [
  'Visited here today to browse the collection.',
  'Stopped by for boutique shopping today.',
  'An okay shopping visit overall today.',
]

const OVERALL_NEGATIVE = [
  'Visited here today, but the shopping experience was disappointing.',
  'Shopped here today, though the overall visit fell short of expectations.',
  'Stopped by today, but my visit was not as expected.',
]

const FOOD_POSITIVE = [
  'The clothing collection was trendy, elegant, and of great quality.',
  'Really loved the beautiful designs and fabric finish.',
  'The outfits were stylish, comfortable, and beautifully crafted.',
]

const FOOD_NEUTRAL = [
  'The collection was decent with standard designs.',
  'The styles were okay and met basic expectations.',
]

const FOOD_NEGATIVE = [
  'The collection lacked variety and fabric quality did not meet expectations.',
  'The designs available were disappointing.',
]

const SERVICE_POSITIVE = [
  'The staff was polite, patient, and very helpful with trials and styling.',
  'Customer service was warm, attentive, and welcoming throughout.',
  'The styling assistance was courteous and pleasant.',
]

const SERVICE_NEUTRAL = [
  'Customer service was standard and adequate.',
  'Staff was polite and available when needed.',
]

const SERVICE_NEGATIVE = [
  'The staff was inattentive and could have been more helpful.',
  'Customer assistance was slow and needed more attention.',
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

  // 2. Collection / Fabric Sentence
  const foodTone = factSheet.food?.tone || 'positive'
  if (foodTone === 'positive') {
    sentences.push(FOOD_POSITIVE[getSeededIndex(sessionId + '-fd', FOOD_POSITIVE.length)])
  } else if (foodTone === 'neutral') {
    sentences.push(FOOD_NEUTRAL[getSeededIndex(sessionId + '-fd', FOOD_NEUTRAL.length)])
  } else {
    sentences.push(FOOD_NEGATIVE[getSeededIndex(sessionId + '-fd', FOOD_NEGATIVE.length)])
  }

  // 3. Items browsed or compliments liked
  if (factSheet.ordered.length > 0 && foodTone === 'positive') {
    const items = factSheet.ordered.slice(0, 2).join(' and ')
    sentences.push(`The ${items} especially stood out.`)
  } else if (factSheet.liked.length > 0 && overallTone === 'positive') {
    const aspects = factSheet.liked.slice(0, 2).join(' and ')
    sentences.push(`We especially appreciated the ${aspects}.`)
  }

  // 4. Service / Styling Sentence
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
  'Open with the outfit or collection that caught your eye, then mention staff assistance.',
  'Open with the overall boutique ambience and feeling, then highlight fabric quality.',
  'Start with shopping for an occasion (festive, wedding, party wear, daily chic), then describe the clothing and service.',
  'Open with the warm styling assistance and trial room comfort, then describe the designs.',
  'Start with a standout piece or fabric quality, then zoom out to the overall shopping experience.',
  'Open with boutique elegance, then cover apparel fit, variety, and polite staff behavior.',
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
        const prompt = `You are helping a customer write a brief, authentic Google review draft for ${restaurantName}, an exclusive women's clothing and fashion boutique.
STRICT RULES:
1. Write in the first person ("I" / "We").
2. Length MUST be between 30 and 70 words.
3. Use ONLY facts from this Fact Sheet:
${JSON.stringify(factSheet, null, 2)}
4. Preserve sentiment: negative ratings MUST sound polite but dissatisfied; positive ratings must sound pleased.
5. Do NOT include staff names, prices, promotional offers, discounts, star ratings (e.g. "5 stars"), URLs, or hashtags.
6. Narrative angle for THIS review: ${angle}
7. Variation seed "${variationSeed}": phrase everything in fresh, unique boutique wording. Do NOT reuse generic openers like "Had a wonderful dining experience".
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
