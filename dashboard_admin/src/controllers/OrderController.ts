import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) { res.status(400).json({ success: false, message: 'ID obrigatório' }); return; }

      const order = await this.orderService.getOrderById(id);
      if (!order) { res.status(404).json({ success: false, message: 'Pedido não encontrado' }); return; }

      res.json({ success: true, data: order });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query['status'] as string | undefined;
      const clientId = req.query['clientId'] as string | undefined;
      const assignedProvider = req.query['assignedProvider'] as string | undefined;
      const startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined;
      const endDate = req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined;
      const limitCount = parseInt(req.query['limit'] as string) || 100;

      const result = await this.orderService.getOrders({
        status, clientId, assignedProvider, startDate, endDate, limitCount,
      });

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!id || !status) { res.status(400).json({ success: false, message: 'ID e status obrigatórios' }); return; }

      await this.orderService.updateOrderStatus(id, status);
      res.json({ success: true, message: `Status atualizado para ${status}` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      if (!id) { res.status(400).json({ success: false, message: 'ID obrigatório' }); return; }

      await this.orderService.cancelOrder(id, reason);
      res.json({ success: true, message: 'Pedido cancelado com sucesso' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getOrderStats(req: Request, res: Response): Promise<void> {
    try {
      const startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined;
      const endDate = req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined;

      const stats = await this.orderService.getOrderStats(startDate, endDate);
      res.json({ success: true, data: stats });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
