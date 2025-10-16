import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import axios from 'axios'
import { parseStringPromise } from 'xml2js'

const SOAP_NS = 'http://schemas.xmlsoap.org/soap/envelope/'
const WSAA_NS = 'http://wsaa.view.sua.dvadac.desein.afip.gov'

function getWsaaUrl(env) {
  const e = String(env || '').toLowerCase()
  if (e === 'prod' || e === 'production') return 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
  // default to homologación
  return 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms'
}

function buildTRAXml(service) {
  const uniqueId = Math.floor(Date.now() / 1000)
  const generationTime = new Date(Date.now() - 60_000).toISOString()
  const expirationTime = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
  const svc = service || process.env.AFIP_SERVICE || 'ws_sr_padron_a5'
  return `<?xml version="1.0" encoding="UTF-8"?>\n<loginTicketRequest version="1.0">\n  <header>\n    <uniqueId>${uniqueId}</uniqueId>\n    <generationTime>${generationTime}</generationTime>\n    <expirationTime>${expirationTime}</expirationTime>\n  </header>\n  <service>${svc}</service>\n</loginTicketRequest>`
}

function signWithOpenSSL(traXml, certPath, keyPath) {
  const tmpDir = fs.mkdtempSync(path.join(process.cwd(), 'afip-tra-'))
  const traFile = path.join(tmpDir, 'TRA.xml')
  const cmsFile = path.join(tmpDir, 'TRA.cms')
  fs.writeFileSync(traFile, traXml)

  try {
    execFileSync('openssl', [
      'smime', '-sign',
      '-in', traFile,
      '-out', cmsFile,
      '-signer', certPath,
      '-inkey', keyPath,
      '-outform', 'DER',
      '-nodetach'
    ])
  } catch (err) {
    const e = new Error('OpenSSL no disponible o error firmando CMS: ' + (err?.message || String(err)))
    e.code = 500
    throw e
  }

  const cms = fs.readFileSync(cmsFile)
  // Clean temp files quietly
  try { fs.unlinkSync(traFile); fs.unlinkSync(cmsFile); fs.rmdirSync(tmpDir) } catch {}
  return Buffer.from(cms).toString('base64')
}

function buildWsaaEnvelope(cmsB64) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<soapenv:Envelope xmlns:soapenv="${SOAP_NS}" xmlns:wsaa="${WSAA_NS}">\n` +
    `  <soapenv:Body>\n` +
    `    <wsaa:loginCms>\n` +
    `      <wsaa:in0>${cmsB64}</wsaa:in0>\n` +
    `    </wsaa:loginCms>\n` +
    `  </soapenv:Body>\n` +
    `</soapenv:Envelope>`
}

async function callWsaa(envelope, env) {
  const url = getWsaaUrl(env)
  const res = await axios.post(url, envelope, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      // Algunos endpoints SOAP de WSAA pueden devolver 500 con Fault.
      'SOAPAction': 'loginCms'
    },
    timeout: 10000,
    // Aceptar 500 para poder parsear Fault sin lanzar excepción
    validateStatus: () => true
  })
  return res.data
}

async function parseLoginTicket(xml) {
  const obj = await parseStringPromise(xml, { explicitArray: false })
  // Navigate to loginTicketResponse
  const body = obj?.Envelope?.Body || obj?.['soapenv:Envelope']?.['soapenv:Body'] || obj?.['soap:Envelope']?.['soap:Body']
  const fault = body?.Fault || body?.['soap:Fault']
  if (fault) {
    const msg = fault?.faultstring || fault?.faultcode || 'SOAP Fault'
    const e = new Error('WSAA Fault: ' + msg)
    e.code = 502
    throw e
  }
  const resp = body?.loginCmsResponse || body?.['wsaa:loginCmsResponse'] || body?.loginCmsReturn || body
  const out = resp?.loginCmsReturn || resp?.return || resp

  // The return is XML string; parse it
  const innerXml = typeof out === 'string' ? out : out?._ || out?.text
  if (!innerXml) throw new Error('WSAA: respuesta vacía o inesperada')
  const inner = await parseStringPromise(innerXml, { explicitArray: false })
  const ltr = inner?.loginTicketResponse
  const token = ltr?.credential?.token || ltr?.credentials?.token || ltr?.header?.token
  const sign = ltr?.credential?.sign || ltr?.credentials?.sign || ltr?.header?.sign
  const expiration = ltr?.header?.expirationTime

  if (!token || !sign) throw new Error('WSAA: token/sign no presentes')
  return { token, sign, expiration }
}

/**
 * Obtiene TA desde WSAA: { token, sign, expiration }
 * @param {{ service?: string, certPath?: string, keyPath?: string, env?: string }} params
 * @returns {Promise<{ token: string, sign: string, expiration: string }>} TA
 */
export async function getLoginTicket({ service, certPath, keyPath, env } = {}) {
  const traXml = buildTRAXml(service)
  const cmsB64 = signWithOpenSSL(traXml, certPath || process.env.AFIP_CERT_PATH, keyPath || process.env.AFIP_KEY_PATH)
  const envelope = buildWsaaEnvelope(cmsB64)
  const xml = await callWsaa(envelope, env || process.env.AFIP_ENV)
  try {
    return await parseLoginTicket(xml)
  } catch (err) {
    const e = new Error('WSAA parse error: ' + (err?.message || String(err)))
    e.code = 502
    throw e
  }
}

export default { getLoginTicket }