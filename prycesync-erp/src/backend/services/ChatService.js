import fs from 'fs'
import path from 'path'
import { getChatContext } from '../integrations/ai/chat-service/context-manager.js'
import { processQuery } from '../integrations/ai/chat-service/query-processor.js'
import { formatResponse } from '../integrations/ai/chat-service/response-formatter.js'

const reportsDir = path.resolve(process.cwd(), 'core_reports')
const reportFile = path.join(reportsDir, 'ai_chat.log')

function ensureReportsDir() {
  try {
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true })
  } catch (_) {}
}

function logAudit(entry) {
  try {
    ensureReportsDir()
    fs.appendFileSync(reportFile, JSON.stringify(entry) + '\n', { encoding: 'utf-8' })
  } catch (_) {}
}

export class ChatService {
  async ask({ userId, text }) {
    const ctx = getChatContext()
    const startedAt = Date.now()
    try {
      const { results, source, error } = await processQuery(text, ctx)
      const formatted = formatResponse(results, { source })
      const elapsedMs = Date.now() - startedAt

      logAudit({
        type: 'AI_CHAT_QUERY',
        userId,
        text,
        source,
        error: error || null,
        count: formatted.payload.count,
        elapsedMs,
        at: new Date().toISOString()
      })

      return { ...formatted, elapsedMs }
    } catch (err) {
      const elapsedMs = Date.now() - startedAt
      logAudit({ type: 'AI_CHAT_ERROR', userId, text, error: err.message, elapsedMs, at: new Date().toISOString() })
      throw err
    }
  }
}