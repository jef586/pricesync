import fetch from 'node-fetch'

function ensureEnv(name) {
  const val = process.env[name]
  if (!val) throw new Error(`AI provider env missing: ${name}`)
  return val
}

async function openaiComplete(systemPrompt, userPrompt, maxTokens) {
  const apiKey = ensureEnv('OPENAI_API_KEY')
  const model = process.env.AI_MODEL || 'gpt-4o-mini'
  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2,
    max_tokens: maxTokens
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  const json = await res.json()
  if (!res.ok) {
    const msg = json?.error?.message || 'OpenAI error'
    throw new Error(msg)
  }
  return json?.choices?.[0]?.message?.content || ''
}

export async function completePrompt({ provider, systemPrompt, userPrompt, maxTokens }) {
  switch ((provider || 'openai').toLowerCase()) {
    case 'openai':
      return openaiComplete(systemPrompt, userPrompt, maxTokens)
    case 'claude':
    case 'anthropic':
    case 'gemini':
      // Implementaciones futuras
      throw new Error('AI provider not configured')
    default:
      throw new Error('Unknown AI provider')
  }
}