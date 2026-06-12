import { Router } from 'express';
import { UserController } from '../controllers/UserController';

const router = Router();
const userController = new UserController();

router.get('/', userController.getUsers.bind(userController));
router.get('/:id', userController.getUserById.bind(userController));
router.put('/:id', userController.updateUser.bind(userController));
router.patch('/:id/toggle-status', userController.toggleUserStatus.bind(userController));

export default router;
