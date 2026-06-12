import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';

const router = Router();
const orderController = new OrderController();

router.get('/', orderController.getOrders.bind(orderController));
router.get('/stats', orderController.getOrderStats.bind(orderController));
router.get('/:id', orderController.getOrderById.bind(orderController));
router.put('/:id/status', orderController.updateOrderStatus.bind(orderController));
router.delete('/:id', orderController.cancelOrder.bind(orderController));

export default router;
