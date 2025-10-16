export interface DomicilioFiscal {
  calle?: string
  numero?: string
  piso?: string
  depto?: string
  localidad?: string
  provincia?: string
  codPostal?: string
}

export interface Actividad {
  codigo: string
  descripcion: string
}

export interface PersonaA5Normalized {
  cuit: string
  denominacion: string
  estadoClave: string
  domicilioFiscal?: DomicilioFiscal
  actividades?: Actividad[]
  impuestos?: string[]
  regimenes?: string[]
}