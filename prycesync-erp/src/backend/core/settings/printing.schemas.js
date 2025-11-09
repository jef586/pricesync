import { z } from "zod";

// Backend validation matching renderer's PrintingSettingsSchema
export const PrintingSettingsSchema = z.object({
  defaultPrinter: z.string().nullable().optional(),
  paperWidth: z.number().min(30).max(120),
  marginTop: z.number().min(0).max(50),
  marginRight: z.number().min(0).max(50),
  marginBottom: z.number().min(0).max(50),
  marginLeft: z.number().min(0).max(50),
  fontSize: z.number().min(8).max(24),
  autoPrintAfterSale: z.boolean(),
  branchId: z.string().nullable().optional(),
});

export const defaultPrintingSettings = {
  defaultPrinter: null,
  paperWidth: 80,
  marginTop: 5,
  marginRight: 5,
  marginBottom: 5,
  marginLeft: 5,
  fontSize: 12,
  autoPrintAfterSale: false,
  branchId: null,
};