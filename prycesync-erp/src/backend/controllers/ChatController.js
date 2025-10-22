import { ChatService } from '../services/ChatService.js'
import { body, validationResult } from 'express-validator'

const chatService = new ChatService()

export const postMessageValidators = [
  body('text').isString().trim().isLength({ min: 2, max: 500 }).withMessage('Consulta inválida')
]

export async function postMessage(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() })
  }
  const text = String(req.body.text || '')
  const userId = req.user?.id || 'anonymous'
  try {
    const result = await chatService.ask({ userId, text })
    res.json({ ok: true, ...result })
  } catch (err) {
    res.status(400).json({ ok: false, error: 'QUERY_ERROR', message: err.message })
  }
}