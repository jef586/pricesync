import express from "express";
import SalesController from "../controllers/SalesController.js";
import { authenticate } from "../middleware/auth.js";
import { validateCompanyAccess } from "../middleware/invoiceValidation.js";
import { validateCreateSale, validateGetSale, validateAddPayments } from "../middleware/salesValidation.js";
import PaymentController from "../controllers/PaymentController.js";

const router = express.Router();

router.use(authenticate);
router.use(validateCompanyAccess);

router.post('/', validateCreateSale, SalesController.create);
router.get('/:id', validateGetSale, SalesController.getById);
router.post('/:id/payments', validateAddPayments, PaymentController.addPayments);
router.get('/:id/payments', validateGetSale, PaymentController.listPayments);

// Park/Resume endpoints and parked listing
router.post('/:id/park', validateGetSale, SalesController.park);
router.post('/:id/resume', validateGetSale, SalesController.resume);
router.get('/parked', SalesController.listParked);

export default router;
