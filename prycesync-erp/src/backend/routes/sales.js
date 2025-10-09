import express from "express";
import SalesController from "../controllers/SalesController.js";
import { authenticate } from "../middleware/auth.js";
import { validateCompanyAccess } from "../middleware/invoiceValidation.js";
import { validateCreateSale, validateGetSale } from "../middleware/salesValidation.js";

const router = express.Router();

router.use(authenticate);
router.use(validateCompanyAccess);

router.post('/', validateCreateSale, SalesController.create);
router.get('/:id', validateGetSale, SalesController.getById);

export default router;
