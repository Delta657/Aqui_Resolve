import { Router } from 'express';
import { ProviderLocationController } from '../controllers/ProviderLocationController';

const router = Router();
const ctrl = new ProviderLocationController();

router.get('/', ctrl.getAllProviderLocations.bind(ctrl));
router.get('/:providerId/location', ctrl.getProviderLocation.bind(ctrl));
router.put('/:providerId/location', ctrl.updateLocation.bind(ctrl));
router.put('/:providerId/status', ctrl.updateProviderStatus.bind(ctrl));

export default router;
