import Anthropic from '@anthropic-ai/sdk'
import type { Review, Location, BrandVoice, GeneratedVariant } from '@/types'
import { getReviewSentiment } from './constants'
import { LANGUAGES, TONES } from './constants'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ============================================================
// LANGUAGE HELPERS
// ============================================================

function getLanguageLabel(code: string): string {
  const lang = LANGUAGES.find((l) => l.value === code)
  return lang?.label ?? 'English'
}

function getToneDescription(tone: string): string {
  const toneConfig = TONES.find((t) => t.value === tone)
  return toneConfig?.description ?? 'Professional and balanced'
}

// ============================================================
// PROMPT BUILDERS
// ============================================================

function buildBusinessProfileLayer(location: Location): string {
  const parts = [
    `Business Name: ${location.name}`,
    location.address ? `Address: ${location.address}` : null,
    location.category ? `Business Type: ${location.category}` : null,
  ].filter(Boolean)

  return `BUSINESS PROFILE:
${parts.join('\n')}`
}

function buildReviewAnalysisLayer(review: Review): string {
  const sentiment = getReviewSentiment(review.rating)
  const sentimentMap = {
    positive: 'POSITIVE — the reviewer had a great experience',
    neutral: 'NEUTRAL — the reviewer had a mixed experience',
    negative: 'NEGATIVE — the reviewer had a poor experience',
  }

  const lines = [
    `Reviewer Name: ${review.reviewer_name}`,
    `Star Rating: ${review.rating}/5`,
    `Sentiment: ${sentimentMap[sentiment]}`,
    `Review Language: ${getLanguageLabel(review.review_language ?? 'en')}`,
    review.text ? `Review Text:\n"${review.text}"` : 'No written review — only a star rating given.',
  ]

  return `REVIEW ANALYSIS:
${lines.join('\n')}`
}

function buildResponseStrategyLayer(review: Review): string {
  const rating = review.rating
  const hasText = Boolean(review.text?.trim())

  let strategy: string

  if (rating >= 4) {
    strategy = hasText
      ? `POSITIVE REVIEW STRATEGY:
- Open with genuine, warm gratitude (not generic "Thank you for your review")
- Reference 1-2 specific details the reviewer mentioned to show you actually read it
- Express that you look forward to serving them again
- Keep it concise (2-4 sentences) — positive reviews need warm but brief replies
- Do NOT offer discounts or incentives — maintain authenticity`
      : `POSITIVE RATING (no text) STRATEGY:
- Thank them briefly and warmly
- Express you hope to see them again
- Maximum 2 sentences`
  } else if (rating === 3) {
    strategy = `NEUTRAL REVIEW STRATEGY:
- Acknowledge both the positive aspects and areas where you fell short
- Show genuine concern without being overly apologetic
- Mention a specific improvement or commitment
- Invite them to return or contact you directly
- Keep it balanced (3-5 sentences)`
  } else {
    strategy = `NEGATIVE REVIEW STRATEGY:
- Open with a sincere, specific apology — do NOT be defensive
- Acknowledge the specific issue they raised without making excuses
- Show accountability and explain concrete steps to prevent recurrence
- Invite them to contact you directly (offline resolution)
- Close with a genuine commitment to improvement
- CRITICAL: Never argue or make the business look like it's blaming the customer
- Length: 4-6 sentences`
  }

  return `RESPONSE STRATEGY:
${strategy}`
}

function buildBrandVoiceLayer(brandVoice: BrandVoice): string {
  const parts = [
    `Tone Style: ${brandVoice.tone} — ${getToneDescription(brandVoice.tone)}`,
    `Response Language: Write the response in ${getLanguageLabel(brandVoice.language)}`,
    brandVoice.owner_name
      ? `Sign as: ${brandVoice.owner_name} (use this name in the sign-off)`
      : 'Do not include a personal signature',
    brandVoice.sign_off
      ? `Sign-off phrase: "${brandVoice.sign_off}"`
      : 'End naturally without a formal sign-off',
    brandVoice.custom_instructions
      ? `Additional Instructions: ${brandVoice.custom_instructions}`
      : null,
  ].filter(Boolean)

  return `BRAND VOICE:
${parts.join('\n')}`
}

// ============================================================
// MAIN GENERATION FUNCTION
// ============================================================

export async function generateResponses(
  review: Review,
  location: Location,
  brandVoice: BrandVoice,
  variantCount: number
): Promise<GeneratedVariant[]> {
  const variantInstructions =
    variantCount === 1
      ? 'Generate exactly 1 response.'
      : `Generate exactly ${variantCount} distinct response variants. Each variant should:
- Convey the same core message and sentiment
- Use different opening lines and structure
- Vary in length/detail (one shorter, one longer)
- Feel genuinely different, not just minor word changes
Number each variant clearly as VARIANT 1:, VARIANT 2:, etc.`

  const systemPrompt = `You are an expert business reputation manager specializing in Google Business Profile review responses. You write authentic, effective responses that protect and enhance business reputations while building customer relationships.

Your responses are:
- Always authentic and specific (never generic)
- Appropriately toned for the review sentiment
- Concise but complete
- Free of hollow phrases like "Thank you for your feedback" or "We strive for excellence"
- Never defensive or argumentative
- Never include placeholders like [Business Name] or [Date]`

  const userPrompt = `${buildBusinessProfileLayer(location)}

${buildReviewAnalysisLayer(review)}

${buildResponseStrategyLayer(review)}

${buildBrandVoiceLayer(brandVoice)}

TASK:
${variantInstructions}

${variantCount === 1 ? 'Write only the response text — no labels or extra formatting.' : 'Format your output exactly as:\nVARIANT 1:\n[response text]\n\nVARIANT 2:\n[response text]\n\netc.'}`

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: variantCount * 400,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  })

  const responseText = message.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('')

  if (variantCount === 1) {
    return [
      {
        variant_number: 1,
        text: responseText.trim(),
        tone: brandVoice.tone,
      },
    ]
  }

  // Parse multiple variants
  const variants: GeneratedVariant[] = []
  for (let i = 1; i <= variantCount; i++) {
    const pattern = new RegExp(
      `VARIANT\\s+${i}:\\s*([\\s\\S]*?)(?=VARIANT\\s+${i + 1}:|$)`,
      'i'
    )
    const match = responseText.match(pattern)
    if (match) {
      variants.push({
        variant_number: i,
        text: match[1].trim(),
        tone: brandVoice.tone,
      })
    }
  }

  // Fallback: if parsing failed, return whole text as variant 1
  if (variants.length === 0) {
    return [
      {
        variant_number: 1,
        text: responseText.trim(),
        tone: brandVoice.tone,
      },
    ]
  }

  return variants
}

// ============================================================
// DETECT LANGUAGE
// ============================================================

export async function detectLanguage(text: string): Promise<string> {
  if (!text || text.trim().length < 5) return 'en'

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: `Detect the language of this text and respond with ONLY the ISO 639-1 two-letter language code (e.g., en, hi, ta, kn, te, mr, gu, bn, fr, de, es, etc.):\n\n"${text.slice(0, 200)}"`,
        },
      ],
    })

    const lang = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()
      .toLowerCase()
      .slice(0, 2)

    return lang || 'en'
  } catch {
    return 'en'
  }
}
