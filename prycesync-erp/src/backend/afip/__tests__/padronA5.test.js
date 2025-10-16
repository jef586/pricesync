import { describe, it, expect } from 'vitest'
import { parseA5 } from '../padronA5.js'

const SAMPLE_OK = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <getPersonaResponse>
      <return>
        <idPersona>20301234567</idPersona>
        <denominacion>ACME SA</denominacion>
        <estadoClave>Activo</estadoClave>
        <domicilioFiscal>
          <calle>Falsa</calle>
          <numero>123</numero>
          <localidad>CABA</localidad>
          <provincia>Capital Federal</provincia>
          <codPostal>1000</codPostal>
        </domicilioFiscal>
        <actividades>
          <actividad>
            <codigoActividad>1111</codigoActividad>
            <descripcionActividad>Comercio</descripcionActividad>
          </actividad>
          <actividad>
            <codigoActividad>2222</codigoActividad>
            <descripcionActividad>Servicios</descripcionActividad>
          </actividad>
        </actividades>
        <impuesto>
          <descripcionImpuesto>IVA</descripcionImpuesto>
        </impuesto>
        <regimen>
          <descripcionRegimen>MONOTRIBUTO</descripcionRegimen>
        </regimen>
      </return>
    </getPersonaResponse>
  </soapenv:Body>
</soapenv:Envelope>`

const SAMPLE_FAULT = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <soap:Fault xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <faultcode>soap:Server</faultcode>
      <faultstring>Persona inexistente</faultstring>
    </soap:Fault>
  </soapenv:Body>
  </soapenv:Envelope>`

describe('AFIP A5 parser', () => {
  it('parses and normalizes persona data', async () => {
    const res = await parseA5(SAMPLE_OK)
    expect(res.cuit).toBe('20301234567')
    expect(res.denominacion).toBe('ACME SA')
    expect(res.estadoClave).toMatch(/Activo/i)
    expect(res.domicilioFiscal.calle).toBe('Falsa')
    expect(res.actividades.length).toBe(2)
    expect(res.impuestos).toContain('IVA')
    expect(res.regimenes).toContain('MONOTRIBUTO')
  })

  it('throws with SOAP Fault', async () => {
    await expect(parseA5(SAMPLE_FAULT)).rejects.toMatchObject({ code: 502 })
  })
})