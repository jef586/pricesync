import prisma from '../config/database.js'
import crypto from 'crypto'
import ExcelJS from 'exceljs'
import ImportArticlesService from '../services/ImportArticlesService.js'

class ImportArticlesController {
  static async start(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo' })
      }

      const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream'
      ]
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Tipo de archivo no válido. Solo Excel (.xlsx, .xls)' })
      }
      if (req.file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 10MB' })
      }

      const companyId = req.user?.company?.id
      const startedBy = req.user?.id || 'system'
      if (!companyId) {
        return res.status(401).json({ error: 'Usuario sin empresa asignada' })
      }

      const presetId = req.body?.presetId || req.query?.presetId || null
      const supplierId = req.body?.supplierId || req.query?.supplierId || null
      const isDryRun = (req.body?.dryRun ?? req.query?.dryRun ?? 'true').toString() === 'true'

      const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex')

      // Crear el job en estado processing
      const job = await prisma.importJob.create({
        data: {
          status: 'processing',
          fileName: req.file.originalname || 'import.xlsx',
          fileHash,
          presetId,
          supplierId,
          companyId,
          startedBy,
          isDryRun,
          chunkSize: 500,
          totalRows: 0,
          processedRows: 0,
          createdCount: 0,
          skippedCount: 0,
          errorCount: 0,
          warningCount: 0,
          previewJson: null
        }
      })

      const result = await ImportArticlesService.processExcel({
        jobId: job.id,
        buffer: req.file.buffer,
        companyId,
        presetId,
        supplierId,
        isDryRun,
        startedBy
      })

      return res.status(201).json({ success: true, job: result })
    } catch (error) {
      console.error('Error starting import job:', error)
      try {
        // Marcar el último job como failed si existe id en error context
        const jobId = error?.jobId || null
        if (jobId) {
          await prisma.importJob.update({ where: { id: jobId }, data: { status: 'failed', finishedAt: new Date() } })
        }
      } catch (e) {
        console.warn('Failed to mark job as failed:', e?.message || e)
      }
      return res.status(500).json({ error: 'Error procesando importación de artículos' })
    }
  }

  static async status(req, res) {
    try {
      const { jobId } = req.params
      const companyId = req.user?.company?.id
      if (!jobId) return res.status(400).json({ error: 'JobId es requerido' })
      const job = await prisma.importJob.findFirst({
        where: { id: jobId, companyId },
        include: { preset: true, supplier: true }
      })
      if (!job) return res.status(404).json({ error: 'Job no encontrado' })
      return res.json({ success: true, job })
    } catch (error) {
      console.error('Error fetching import job status:', error)
      return res.status(500).json({ error: 'Error interno consultando estado de importación' })
    }
  }
}

export default ImportArticlesController