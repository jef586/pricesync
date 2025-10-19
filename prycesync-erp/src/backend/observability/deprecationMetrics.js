// Simple deprecation metrics module (ESM)
// Counters and histogram for legacy /api/products alias usage

const state = {
  legacyRequests: 0,
  articlesRequests: 0,
  // counters by {route|method|status}
  requestsByLabel: new Map(),
  // callers counter by id
  callers: new Map(),
  // store latency samples (ms)
  latencies: [],
  maxLatencySamples: 5000
}

function labelKey(route, method, status) {
  return `${route}|${method}|${status}`
}

export function recordLegacyRequest({ route, method, status, caller, durationMs }) {
  state.legacyRequests += 1
  const key = labelKey(route, method, status)
  state.requestsByLabel.set(key, (state.requestsByLabel.get(key) || 0) + 1)
  if (caller) state.callers.set(caller, (state.callers.get(caller) || 0) + 1)

  if (typeof durationMs === 'number') {
    state.latencies.push(durationMs)
    if (state.latencies.length > state.maxLatencySamples) {
      state.latencies.splice(0, state.latencies.length - state.maxLatencySamples)
    }
  }
}

export function recordArticleRequest() {
  state.articlesRequests += 1
}

function percentile(values, p) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))]
}

export function getDeprecationState() {
  const total = state.legacyRequests + state.articlesRequests
  const legacyShare = total > 0 ? +(state.legacyRequests / total * 100).toFixed(2) : 0

  // Build breakdown for requestsByLabel
  const breakdown = []
  for (const [key, count] of state.requestsByLabel.entries()) {
    const [route, method, status] = key.split('|')
    breakdown.push({ route, method, status, count })
  }
  breakdown.sort((a, b) => b.count - a.count)

  // Top callers
  const callers = []
  for (const [caller, count] of state.callers.entries()) {
    callers.push({ caller, count })
  }
  callers.sort((a, b) => b.count - a.count)

  const p95 = percentile(state.latencies, 95)
  const p50 = percentile(state.latencies, 50)
  const p99 = percentile(state.latencies, 99)

  return {
    legacyRequests: state.legacyRequests,
    articlesRequests: state.articlesRequests,
    legacySharePercent: legacyShare,
    breakdown,
    topCallers: callers.slice(0, 20),
    latency: {
      samples: state.latencies.length,
      p50,
      p95,
      p99
    }
  }
}

// Optional Prometheus-like text exposition for counters and a simple summary
export function getMetricsText() {
  const lines = []
  // Counters
  for (const [key, count] of state.requestsByLabel.entries()) {
    const [route, method, status] = key.split('|')
    const labels = `route="${route}",method="${method}",status="${status}"`
    lines.push(`legacy_products_requests_total{${labels}} ${count}`)
  }
  for (const [caller, count] of state.callers.entries()) {
    const labels = `caller="${caller}"`
    lines.push(`legacy_products_callers_total{${labels}} ${count}`)
  }
  // Summary latencies
  const s = getDeprecationState()
  lines.push(`# TYPE legacy_products_latency_ms summary`)
  lines.push(`legacy_products_latency_ms{quantile="0.5"} ${s.latency.p50}`)
  lines.push(`legacy_products_latency_ms{quantile="0.95"} ${s.latency.p95}`)
  lines.push(`legacy_products_latency_ms{quantile="0.99"} ${s.latency.p99}`)
  lines.push(`legacy_products_latency_ms_count ${s.latency.samples}`)

  // Legacy vs articles
  lines.push(`legacy_products_total ${state.legacyRequests}`)
  lines.push(`articles_total ${state.articlesRequests}`)

  return lines.join('\n') + '\n'
}

// Testing helpers
export function _resetMetrics() {
  state.legacyRequests = 0
  state.articlesRequests = 0
  state.requestsByLabel.clear()
  state.callers.clear()
  state.latencies = []
}