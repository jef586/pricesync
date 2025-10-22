import { defineStore } from 'pinia'
import { apiClient } from '../../../services/api'

export type ChatRole = 'user' | 'assistant' | 'system'
export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  payload?: any
  timestamp: string
}

const STORAGE_KEY = 'ai_chat_history'

function uid() {
  return Math.random().toString(36).slice(2)
}

export const useChatStore = defineStore('ai-chat', {
  state: () => ({
    messages: [] as ChatMessage[],
    isLoading: false as boolean
  }),
  actions: {
    init() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) this.messages = parsed
        }
      } catch (_) {}
    },
    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages))
      } catch (_) {}
    },
    async sendMessage(text: string) {
      const trimmed = text.trim()
      if (!trimmed) return
      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        text: trimmed,
        timestamp: new Date().toISOString()
      }
      this.messages.push(userMsg)
      this.isLoading = true
      try {
        const { data } = await apiClient.post('/ai/chat', { text: trimmed })
        const assistantMsg: ChatMessage = {
          id: uid(),
          role: 'assistant',
          text: String(data?.message || 'Consulta respondida.'),
          payload: data?.payload,
          timestamp: new Date().toISOString()
        }
        this.messages.push(assistantMsg)
      } catch (err: any) {
        const errorMsg: ChatMessage = {
          id: uid(),
          role: 'system',
          text: String(err?.response?.data?.message || 'Error en la consulta.'),
          timestamp: new Date().toISOString()
        }
        this.messages.push(errorMsg)
      } finally {
        this.isLoading = false
        this.persist()
      }
    },
    clear() {
      this.messages = []
      this.persist()
    }
  }
})