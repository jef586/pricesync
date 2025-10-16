import axios from 'axios'
import { parseStringPromise } from 'xml2js'

function getA5Url(env) {
  const e = String(env || '').toLowerCase()
  if (e === 'prod' || e === 'production') return 'https://aws.afip.gov.ar/sr-padron/webservices/personaServiceA5'
  return 'https://awshomo.afip.gov.ar/sr-padron/webservices/personaServiceA5'
}

function buildA5Envelope({ token, sign, cuitRepresentada, idPersona }) {
  const SOAP_NS = 'http://schemas.xmlsoap.org/soap/envelope/'
  const A5_NS = 'http://a5.soap.ws.server.puc.sr/'
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<soapenv:Envelope xmlns:soapenv="${SOAP_NS}" xmlns:a5="${A5_NS}">\n` +
    `  <soapenv:Body>\n` +
    `    <a5:getPersona>\n` +
    `      <token>${token}</token>\n` +
    `      <sign>${sign}</sign>\n` +
    `      <cuitRepresentada>${cuitRepresentada}</cuitRepresentada>\n` +
    `      <idPersona>${idPersona}</idPersona>\n` +
    `    </a5:getPersona>\n` +
    `  </soapenv:Body>\n` +
    `</soapenv:Envelope>`
}

async function callA5(envelope, env) {
  const url = getA5Url(env)
  try {
    const res = await axios.post(url, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        // Algunos endpoints SOAP de AFIP responden 500 con Fault si falta SOAPAction.
        'SOAPAction': 'getPersona'
      },
      timeout: 10000,
      // Aceptar 500 para poder parsear SOAP Fault sin lanzar excepción
      validateStatus: () => true
    })
    return res.data
  } catch (err) {
    // Si AFIP devuelve 500 con un SOAP Fault, axios rechaza pero response.data contiene el XML.
    // Devolvemos ese XML para que el parser lo interprete y mapee el Fault correctamente.
    const xml = err?.response?.data
    if (xml) return xml
    const e = new Error('AFIP A5 HTTP error: ' + (err?.message || String(err)))
    e.code = 502
    throw e
  }
}

/**
 * Normaliza la respuesta de Padrón A5 al shape PersonaA5Normalized
 * @param {any} json
 * @returns {import('./types').PersonaA5Normalized}
 */
function normalizeA5(json) {
  const persona = json?.getPersonaReturn || json?.persona || json
  const idPersona = persona?.idPersona ?? persona?.id ?? persona?.cuit
  const denominacion = persona?.denominacion || persona?.razonSocial || persona?.nombre
  const estadoClave = persona?.estadoClave ?? persona?.estado ?? persona?.estadoClaveFiscal

  const domicilioFiscalRaw = persona?.domicilioFiscal || persona?.domicilio || {}
  const domicilioFiscal = {
    calle: domicilioFiscalRaw?.calle || domicilioFiscalRaw?.descCalle || undefined,
    numero: domicilioFiscalRaw?.numero || domicilioFiscalRaw?.nro || undefined,
    piso: domicilioFiscalRaw?.piso || undefined,
    depto: domicilioFiscalRaw?.departamento || domicilioFiscalRaw?.depto || undefined,
    localidad: domicilioFiscalRaw?.localidad || domicilioFiscalRaw?.descLocalidad || undefined,
    provincia: domicilioFiscalRaw?.provincia || domicilioFiscalRaw?.descProvincia || undefined,
    codPostal: domicilioFiscalRaw?.codPostal || domicilioFiscalRaw?.cp || undefined,
  }

  const actividadesRaw = persona?.actividades?.actividad || persona?.actividad || []
  const actividadesArr = Array.isArray(actividadesRaw) ? actividadesRaw : (actividadesRaw ? [actividadesRaw] : [])
  const actividades = actividadesArr.map(a => ({
    codigo: String(a?.codigoActividad ?? a?.codigo ?? a?.id ?? ''),
    descripcion: String(a?.descripcionActividad ?? a?.descripcion ?? a?.desc ?? '')
  })).filter(a => a.codigo || a.descripcion)

  const impuestosRaw = persona?.impuesto || persona?.impuestos || []
  const impuestosArr = Array.isArray(impuestosRaw) ? impuestosRaw : (impuestosRaw ? [impuestosRaw] : [])
  const impuestos = impuestosArr.map(i => String(i?.descripcionImpuesto ?? i?.descripcion ?? i?.desc ?? i)).filter(Boolean)

  const regimenesRaw = persona?.regimen ?? persona?.regimenes ?? []
  const regimenesArr = Array.isArray(regimenesRaw) ? regimenesRaw : (regimenesRaw ? [regimenesRaw] : [])
  const regimenes = regimenesArr.map(r => String(r?.descripcionRegimen ?? r?.descripcion ?? r?.desc ?? r)).filter(Boolean)

  return {
    cuit: String(idPersona),
    denominacion: denominacion ? String(denominacion) : '',
    estadoClave: estadoClave ? String(estadoClave) : '',
    domicilioFiscal,
    actividades,
    impuestos,
    regimenes,
  }
}

export async function parseA5(xml) {
  const obj = await parseStringPromise(xml, { explicitArray: false })
  const body = obj?.Envelope?.Body || obj?.['soapenv:Envelope']?.['soapenv:Body'] || obj?.['soap:Envelope']?.['soap:Body']
  const fault = body?.Fault || body?.['soap:Fault']
  if (fault) {
    const msg = fault?.faultstring || fault?.faultcode || 'SOAP Fault'
    const e = new Error('AFIP A5 Fault: ' + msg)
    e.code = 502
    throw e
  }
  const resp = body?.getPersonaResponse || body?.['a5:getPersonaResponse'] || body
  const out = resp?.return || resp?.getPersonaReturn || resp
  if (!out) throw new Error('AFIP A5: respuesta vacía')
  return normalizeA5(out)
}

/**
 * Llama al servicio SOAP A5 getPersona y devuelve JSON normalizado
 * @param {{ token: string, sign: string, idPersona: string, env?: string, cuitRepresentada?: string }} params
 * @returns {Promise<import('./types').PersonaA5Normalized>}
 */
export async function getPersonaA5({ token, sign, idPersona, env, cuitRepresentada }) {
  const envelope = buildA5Envelope({ token, sign, cuitRepresentada, idPersona })
  const xml = await callA5(envelope, env || process.env.AFIP_ENV)
  return await parseA5(xml)
}

export default { getPersonaA5, parseA5 }