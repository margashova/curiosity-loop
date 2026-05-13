import dotenv from 'dotenv'
dotenv.config({ override: true })

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const SYSTEM_PROMPT = `You are a curious, knowledgeable educator who writes for a personal spaced-repetition learning system.

Your job is to generate one fact and three quiz questions about a given topic. Each time you are called, the learner has already received some facts on this topic — those previous facts are provided so you can avoid any repetition.

Depth guidance:
- introductory (0 prior facts): Cover a foundational concept or widely-known-but-underappreciated truth. Make it vivid and concrete.
- intermediate (1–3 prior facts): Go one level deeper. Assume the learner knows the basics. Introduce a mechanism, nuance, or surprising exception.
- advanced (4–7 prior facts): Assume solid familiarity. Explore edge cases, historical context, technical detail, or expert-level relationships between ideas.
- expert (8+ prior facts): Treat the learner as a near-specialist. Cover cutting-edge research, contested debates, subtle distinctions, or highly specific applications.

Rules:
1. Do NOT repeat, paraphrase, or lightly restate any fact already listed under "Previous facts covered".
2. Match the depth level specified in the user message precisely.
3. Write fact_text in 2–5 sentences. Deeper levels warrant the longer end.
4. Quiz questions must test the new fact, not prior ones.

Return ONLY valid JSON matching this schema — no markdown, no explanation:
{
  "fact_text": "string",
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_index": 0,
      "explanation": "string (1-2 sentences explaining why the answer is correct)"
    }
  ]
}`

function computeDepthLevel(priorFactCount) {
  if (priorFactCount === 0) return 'introductory'
  if (priorFactCount <= 3)  return 'intermediate'
  if (priorFactCount <= 7)  return 'advanced'
  return 'expert'
}

export async function run() {
  // Pick the next topic (round-robin by last_sent_at)
  const { data: topicRows, error: topicError } = await supabase
    .from('topics')
    .select('id, name, category')
    .eq('paused', false)
    .order('last_sent_at', { ascending: true, nullsFirst: true })
    .limit(1)

  if (topicError) throw new Error(`Failed to fetch topic: ${topicError.message}`)
  if (!topicRows || topicRows.length === 0) throw new Error('No active topics found')

  const topic = topicRows[0]

  // Fetch all prior facts for this topic to inform depth and prevent repetition
  const { data: priorFacts, error: priorError } = await supabase
    .from('facts')
    .select('fact_text')
    .eq('topic_id', topic.id)
    .order('sent_at', { ascending: true })

  if (priorError) throw new Error(`Failed to fetch prior facts: ${priorError.message}`)

  const priorFactTexts = priorFacts ?? []
  const depthLabel = computeDepthLevel(priorFactTexts.length)

  const userMessage = [
    `Topic: ${topic.name} (category: ${topic.category})`,
    `Depth level: ${depthLabel} (${priorFactTexts.length} prior fact${priorFactTexts.length === 1 ? '' : 's'} on this topic)`,
    priorFactTexts.length > 0
      ? `Previous facts covered:\n${priorFactTexts.map((f, i) => `${i + 1}. ${f.fact_text}`).join('\n')}`
      : 'Previous facts covered: none — this is the first fact for this topic.',
  ].join('\n\n')

  // Generate fact + questions via Claude
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userMessage }
    ],
  })

  const raw = message.content[0].text.trim()
  const parsed = JSON.parse(raw)

  const { fact_text, questions } = parsed
  if (!fact_text || !Array.isArray(questions) || questions.length !== 3) {
    throw new Error('Unexpected response shape from Claude')
  }

  // Insert fact
  const { data: factRow, error: factError } = await supabase
    .from('facts')
    .insert({ topic_id: topic.id, topic_name: topic.name, category: topic.category, fact_text, sent_at: new Date().toISOString(), quizzed: false })
    .select()
    .single()

  if (factError) throw new Error(`Failed to insert fact: ${factError.message}`)

  // Insert quiz questions
  const questionRows = questions.map(q => ({
    fact_id: factRow.id,
    question: q.question,
    options: q.options,
    correct_index: q.correct_index,
    explanation: q.explanation,
  }))

  const { error: qError } = await supabase.from('quiz_questions').insert(questionRows)
  if (qError) throw new Error(`Failed to insert questions: ${qError.message}`)

  // Update topic's last_sent_at
  await supabase.from('topics').update({ last_sent_at: new Date().toISOString() }).eq('id', topic.id)

  return {
    topicName: topic.name,
    category: topic.category,
    factText: fact_text,
    factId: factRow.id,
  }
}

// Run directly if called as main module
if (process.argv[1] === new URL(import.meta.url).pathname) {
  run()
    .then(result => {
      console.log('✓ Daily fact generated')
      console.log(`  Topic: ${result.topicName}`)
      console.log(`  Fact ID: ${result.factId}`)
      console.log(`  ${result.factText.slice(0, 80)}…`)
    })
    .catch(err => {
      console.error('✗ Failed:', err.message)
      process.exit(1)
    })
}
