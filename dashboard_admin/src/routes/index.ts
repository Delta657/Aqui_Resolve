import { Router } from 'express';
import userRoutes from './userRoutes';
import orderRoutes from './orderRoutes';
import providerLocationRoutes from './providerLocationRoutes';

const router = Router();

// Middleware de logging
router.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API está funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rotas da API
router.use('/api/users', userRoutes);
router.use('/api/orders', orderRoutes);
router.use('/api/providers', providerLocationRoutes);

// Rota para rotas não encontradas
router.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

export default router;
