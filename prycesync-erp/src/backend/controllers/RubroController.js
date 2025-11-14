import RubroService from '../services/RubroService.js';
import { asyncHandler } from '../utils/httpError.js';

class RubroController {
  /**
   * Create a new rubro
   * POST /api/rubros
   */
  static createRubro = asyncHandler(async (req, res) => {
    const { name, parentId } = req.body;
    
    // Validate required fields
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        error: 'El nombre es requerido',
        code: 'VALIDATION_ERROR',
        field: 'name'
      });
    }

    const rubro = await RubroService.createRubro({
      name,
      parentId
    }, req.user);

    res.status(201).json({
      success: true,
      message: 'Rubro creado exitosamente',
      data: rubro
    });
  });

  /**
   * List rubros with pagination and filtering
   * GET /api/rubros
   */
  static listRubros = asyncHandler(async (req, res) => {
    const {
      page = 1,
      size = 20,
      q,
      parentId,
      status = 'active',
      includeDeleted = false
    } = req.query;

    const result = await RubroService.listRubros({
      page,
      size,
      q,
      parentId,
      status,
      includeDeleted
    }, req.user);

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Get rubro by ID
   * GET /api/rubros/:id
   */
  static getRubroById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { includeDeleted = false } = req.query;

    const rubro = await RubroService.getRubroById(id, req.user, includeDeleted === 'true');

    res.json({
      success: true,
      data: rubro
    });
  });

  /**
   * Update rubro
   * PUT /api/rubros/:id
   */
  static updateRubro = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, parentId } = req.body;

    // Validate at least one field is provided
    if (name === undefined && parentId === undefined) {
      return res.status(400).json({
        error: 'Debe proporcionar al menos un campo para actualizar',
        code: 'VALIDATION_ERROR'
      });
    }

    const rubro = await RubroService.updateRubro(id, {
      name,
      parentId
    }, req.user);

    res.json({
      success: true,
      message: 'Rubro actualizado exitosamente',
      data: rubro
    });
  });

  /**
   * Move rubro in hierarchy
   * PUT /api/rubros/:id/move
   */
  static moveRubro = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { new_parent_id } = req.body;

    if (new_parent_id !== null && new_parent_id !== undefined && typeof new_parent_id !== 'string') {
      return res.status(400).json({
        error: 'new_parent_id inválido',
        code: 'VALIDATION_ERROR',
        field: 'new_parent_id'
      });
    }

    const updated = await RubroService.moveRubro(id, new_parent_id ?? null, req.user, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      data: updated
    });
  });

  /**
   * Soft delete rubro
   * DELETE /api/rubros/:id
   */
  static deleteRubro = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { force = false } = req.query;

    await RubroService.softDeleteRubro(id, req.user, force === 'true');

    res.status(204).send();
  });

  /**
   * Restore soft-deleted rubro
   * POST /api/rubros/:id/restore
   */
  static restoreRubro = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { cascade = false } = req.query;

    const rubro = await RubroService.restoreRubro(id, req.user, cascade === 'true');

    res.json({
      success: true,
      message: 'Rubro restaurado exitosamente',
      data: rubro
    });
  });

  /**
   * Permanent delete rubro
   * DELETE /api/rubros/:id/permanent
   */
  static deleteRubroPermanent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { force = false } = req.query;

    await RubroService.permanentDeleteRubro(id, req.user, force === 'true', {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(204).send();
  });

  /**
   * Get rubro tree (hierarchical structure)
   * GET /api/rubros/tree
   */
  static getRubroTree = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId || req.user.company?.id;
    
    const rubros = await RubroService.listRubros({
      page: 1,
      size: 1000 // Get all rubros for tree
    }, req.user);

    // Build hierarchical tree
    const rubroMap = new Map();
    const rootRubros = [];

    // Create map of rubros
    rubros.items.forEach(rubro => {
      rubroMap.set(rubro.id, {
        ...rubro,
        children: []
      });
    });

    // Build hierarchy
    rubros.items.forEach(rubro => {
      if (rubro.parentId) {
        const parent = rubroMap.get(rubro.parentId);
        if (parent) {
          parent.children.push(rubroMap.get(rubro.id));
        }
      } else {
        rootRubros.push(rubroMap.get(rubro.id));
      }
    });

    res.json({
      success: true,
      data: rootRubros
    });
  });

  /**
   * Search rubros
   * GET /api/rubros/search
   */
  static searchRubros = asyncHandler(async (req, res) => {
    const { q, limit = 10 } = req.query;
    const companyId = req.user.companyId || req.user.company?.id;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const rubros = await RubroService.listRubros({
      q,
      size: limit,
      page: 1
    }, req.user);

    // Return simplified search results
    const searchResults = rubros.items.map(rubro => ({
      id: rubro.id,
      name: rubro.name,
      description: rubro.description,
      parentId: rubro.parentId,
      parent: rubro.parent,
      level: rubro.level
    }));

    res.json(searchResults);
  });
}

export default RubroController;
