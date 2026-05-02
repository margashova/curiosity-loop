import dotenv from 'dotenv'
dotenv.config({ override: true })

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const SYSTEM_PROMPT = `You are a curious, knowledgeable educator who writes for a personal learning system.
Given a topic, generate one interesting, specific fact and three multiple-choice quiz questions about it.
Return ONLY valid JSON matching this schema — no markdown, no explanation:
{
  "fact_text": "string (2-4 sentences, specific and interesting)",
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_index": 0,
      "explanation": "string (1-2 sentences explaining why the answer is correct)"
    }
  ]
}`

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

  // Generate fact + questions via Claude
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: `Topic: ${topic.name} (category: ${topic.category})` }
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
