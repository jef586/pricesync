import { app, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'

// File-backed local print queue for Electron (pendingPrints.json)
// Each job: { id, invoiceId, buffer, timestamp }

const FILE_NAME = 'pendingPrints.json'
let initialized = false
let filePath = ''

function ensureDirExists(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  } catch (e) {
    console.error('[PrintQueue] Failed to ensure directory:', dir, e)
  }
}

function readQueue() {
  try {
    if (!fs.existsSync(filePath)) return []
    const raw = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)
    if (Array.isArray(data)) {
      return data.filter(j => j && j.id && j.invoiceId && j.buffer && j.timestamp)
    }
  } catch (e) {
    console.error('[PrintQueue] readQueue error:', e)
  }
  return []
}

function writeQueue(list) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8')
  } catch (e) {
    console.error('[PrintQueue] writeQueue error:', e)
  }
}

export function init() {
  try {
    const userDataDir = app.getPath('userData')
    ensureDirExists(userDataDir)
    filePath = path.join(userDataDir, FILE_NAME)
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf-8')
    }
    initialized = true
    console.log('[PrintQueue] Initialized at', filePath)
  } catch (e) {
    console.error('[PrintQueue] init error:', e)
  }
}

export function getPendingCount() {
  return readQueue().length
}

export function addPending({ invoiceId, buffer, timestamp }) {
  if (!initialized) init()
  const ts = typeof timestamp === 'number' ? timestamp : Date.now()
  const id = `${invoiceId}-${ts}`
  const list = readQueue()
  list.push({ id, invoiceId, buffer, timestamp: ts })
  writeQueue(list)
  return { ok: true, id }
}

export function clearSuccess() {
  // Queue only stores pending items; successful prints are removed on retry.
  // This function is a no-op but kept for API completeness.
  return { ok: true }
}

function getActiveWindow() {
  return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0] || null
}

async function printBuffer({ buffer, printerName }) {
  // buffer is expected to be HTML string or PDF base64 dataURL content
  const temp = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  })

  try {
    if (buffer?.startsWith('data:application/pdf;base64,')) {
      await temp.loadURL(buffer)
    } else {
      await temp.loadURL('about:blank')
      await temp.webContents.executeJavaScript(`document.open();document.write(${JSON.stringify(buffer || '')});document.close();`)
    }

    await new Promise((resolve, reject) => {
      temp.webContents.print({ silent: true, deviceName: printerName || null }, (success, failureReason) => {
        if (!success) return reject(new Error(failureReason || 'print-failed'))
        resolve()
      })
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e?.message || 'print-error' }
  } finally {
    try { temp.destroy() } catch (_) {}
  }
}

export async function retryPending({ printerName } = {}) {
  if (!initialized) init()
  let list = readQueue()
  const tried = list.length
  let succeeded = 0
  let failed = 0

  for (const job of list) {
    const res = await printBuffer({ buffer: job.buffer, printerName })
    if (res.ok) {
      // remove job from queue
      list = list.filter(j => j.id !== job.id)
      writeQueue(list)
      // notify renderer about success
      const win = getActiveWindow()
      try { win?.webContents?.send('print:success', { invoiceId: job.invoiceId }) } catch (_) {}
      succeeded += 1
    } else {
      failed += 1
    }
  }

  return { ok: true, tried, succeeded, failed }
}

export default {
  init,
  addPending,
  retryPending,
  clearSuccess,
  getPendingCount
}