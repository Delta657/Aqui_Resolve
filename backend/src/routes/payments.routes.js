const express = require('express');

const { authenticateRequest } = require('../middlewares/auth');
const {
  processCardPayment,
  processPixPayment,
  getPaymentStatus,
  handlePagarmeWebhook
} = require('../controllers/payments.controller');
const { calculatePricing } = require('../controllers/pricing.controller');

const router = express.Router();

router.post('/webhook/pagarme', handlePagarmeWebhook);

router.use(authenticateRequest);

router.post('/pricing/calculate', calculatePricing);
router.post('/card', processCardPayment);
router.post('/pix', processPixPayment);
router.get('/:orderId/status', getPaymentStatus);

module.exports = router;
