// Simple deprecation metrics module (ESM)
// Counters and histogram for legacy /api/products alias usage

const state = {
  legacyRequests: 0,
  articlesRequests: 0,
  lookupOk: 0,
  lookupNotFound: 0,
  lookupError: 0,
  // counters by {route|method|status}
  requestsByLabel: new Map(),
  // callers counter by id
  callers: new Map(),
  // store latency samples (ms)
  latencies: [],
  lookupLatencies: [],
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

export function recordLookupOk() {
  state.lookupOk += 1
}

export function recordLookupNotFound() {
  state.lookupNotFound += 1
}

export function recordLookupError() {
  state.lookupError += 1
}

export function recordLookupLatencyMs(ms) {
  if (typeof ms === 'number') {
    state.lookupLatencies.push(ms)
    if (state.lookupLatencies.length > state.maxLatencySamples) {
      state.lookupLatencies.splice(0, state.lookupLatencies.length - state.maxLatencySamples)
    }
  }
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
  const lp50 = percentile(state.lookupLatencies, 50)
  const lp95 = percentile(state.lookupLatencies, 95)
  const lp99 = percentile(state.lookupLatencies, 99)

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
    },
    lookup: {
      ok: state.lookupOk,
      notFound: state.lookupNotFound,
      error: state.lookupError,
      latency: {
        samples: state.lookupLatencies.length,
        p50: lp50,
        p95: lp95,
        p99: lp99
      }
    }
  }
}

// Optional Prometheus-like text exposition for counters and a simple summary
export function getMetricsText() {
  const lines = []
  // Counters
  for (const [key, count] of state.requestsByLabel.entries()) {
    const [keyRoute, keyMethod, keyStatus] = key.split('|')
    const labels = `route="${keyRoute}",method="${keyMethod}",status="${keyStatus}"`
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

  // Lookup counters and latency
  lines.push(`# TYPE lookup_ok_total counter`)
  lines.push(`lookup_ok_total ${s.lookup.ok}`)
  lines.push(`# TYPE lookup_not_found_total counter`)
  lines.push(`lookup_not_found_total ${s.lookup.notFound}`)
  lines.push(`# TYPE lookup_error_total counter`)
  lines.push(`lookup_error_total ${s.lookup.error}`)
  lines.push(`# TYPE lookup_latency_ms summary`)
  lines.push(`lookup_latency_ms{quantile="0.5"} ${s.lookup.latency.p50}`)
  lines.push(`lookup_latency_ms{quantile="0.95"} ${s.lookup.latency.p95}`)
  lines.push(`lookup_latency_ms{quantile="0.99"} ${s.lookup.latency.p99}`)
  lines.push(`lookup_latency_ms_count ${s.lookup.latency.samples}`)

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
