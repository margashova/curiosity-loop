import dotenv from 'dotenv'
dotenv.config({ override: true })

import { run } from './generate-daily-fact.js'

const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, QUIZ_URL } = process.env

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('✗ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID')
  process.exit(1)
}

async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' }),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(`Telegram API error: ${data.description}`)
  return data
}

function formatMessage(topicName, factText) {
  const isSunday = new Date().getDay() === 0
  const quizLine = isSunday && QUIZ_URL
    ? `\n─\nSunday: take this week's quiz → ${QUIZ_URL}`
    : ''

  return `📖 <b>${topicName}</b>\n\n${factText}${quizLine}`
}

run()
  .then(async ({ topicName, factText }) => {
    const text = formatMessage(topicName, factText)
    await sendTelegramMessage(text)
    console.log('✓ Fact generated and sent to Telegram')
    console.log(`  Topic: ${topicName}`)
  })
  .catch(err => {
    console.error('✗ Failed:', err.message)
    process.exit(1)
  })
