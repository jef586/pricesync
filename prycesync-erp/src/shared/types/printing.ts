// Tipos compartidos para configuración de impresión
// Usar en renderer/main/backend según convenga para coherencia de tipos

export type PrintingConfig = {
  defaultPrinter: string | null
  paperWidth: number
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  fontSize: number
  autoPrintAfterSale: boolean
  // branchId es opcional y nullable
  branchId?: string | null
}

// Alias por compatibilidad con naming existente en renderer
export type PrintingSettings = PrintingConfig