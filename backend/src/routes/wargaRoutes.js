import express from 'express';
import {
  getAllWarga,
  getWargaById,
  createWarga,
  updateWarga,
  deleteWarga,
  getKepalaKeluarga,
  getWargaByBarcode
} from '../controllers/wargaController.js';

const router = express.Router();

router.get('/', getAllWarga);
router.get('/kepala-keluarga', getKepalaKeluarga);
router.get('/barcode/:barcode', getWargaByBarcode);
router.get('/:id', getWargaById);
router.post('/', createWarga);
router.put('/:id', updateWarga);
router.delete('/:id', deleteWarga);

export default router;
