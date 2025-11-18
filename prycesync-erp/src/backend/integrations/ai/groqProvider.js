import fetch from 'node-fetch'

function ensureEnv(name) {
  const val = process.env[name]
  if (!val) throw new Error(`AI provider env missing: ${name}`)
  return val
}

function timeoutSignal(ms) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)
  return { signal: ctrl.signal, cancel: () => clearTimeout(id) }
}

export async function groqJsonComplete({ systemPrompt, userPrompt, maxTokens = 1000, timeoutMs = 12000 }) {
  const apiKey = ensureEnv('GROQ_API_KEY')
  const model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile'
  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' }
  }
  const { signal, cancel } = timeoutSignal(timeoutMs)
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = json?.error?.message || 'Groq error'
      throw new Error(msg)
    }
    const content = json?.choices?.[0]?.message?.content || '{}'
    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new Error('AI returned non-JSON content')
    }
    return parsed
  } finally {
    cancel()
  }
}

