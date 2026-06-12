import * as admin from 'firebase-admin';

export interface ServiceOrder {
  id: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  protocol?: string;
  serviceType?: string;
  serviceName?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  status?: string;
  paymentStatus?: string;
  estimatedPrice?: number;
  finalPrice?: number;
  providerCommission?: number;
  assignedProvider?: string;
  assignedProviderName?: string;
  createdAt?: any;
  updatedAt?: any;
  completedAt?: any;
  cancelledAt?: any;
  cancelledBy?: string;
  cancellationReason?: string;
}

const ORDER_STATUSES = [
  'awaiting_payment',
  'pending',
  'distributing',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
] as const;

function getDb(): FirebaseFirestore.Firestore {
  if (!admin.apps.length) throw new Error('Firebase Admin não inicializado');
  return admin.firestore();
}

export class OrderService {
  async getOrderById(id: string): Promise<ServiceOrder | null> {
    const snap = await getDb().collection('orders').doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as ServiceOrder;
  }

  async getOrders(filters?: {
    status?: string;
    clientId?: string;
    assignedProvider?: string;
    startDate?: Date;
    endDate?: Date;
    limitCount?: number;
  }): Promise<{ orders: ServiceOrder[]; total: number }> {
    let q: FirebaseFirestore.Query = getDb().collection('orders').orderBy('createdAt', 'desc');

    if (filters?.status) q = q.where('status', '==', filters.status);
    if (filters?.clientId) q = q.where('clientId', '==', filters.clientId);
    if (filters?.assignedProvider) q = q.where('assignedProvider', '==', filters.assignedProvider);
    if (filters?.startDate) q = q.where('createdAt', '>=', filters.startDate);
    if (filters?.endDate) q = q.where('createdAt', '<=', filters.endDate);
    q = q.limit(filters?.limitCount ?? 100);

    const snap = await q.get();
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceOrder));
    return { orders, total: orders.length };
  }

  async updateOrderStatus(
    id: string,
    status: (typeof ORDER_STATUSES)[number]
  ): Promise<void> {
    const update: Record<string, any> = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (status === 'completed') update.completedAt = admin.firestore.FieldValue.serverTimestamp();
    await getDb().collection('orders').doc(id).update(update);
  }

  async cancelOrder(id: string, reason?: string): Promise<void> {
    await getDb()
      .collection('orders')
      .doc(id)
      .update({
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        cancelledBy: 'admin',
        cancellationReason: reason ?? '',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  }

  async getOrderStats(startDate?: Date, endDate?: Date) {
    const { orders } = await this.getOrders({ startDate, endDate, limitCount: 2000 });

    const byStatus: Record<string, number> = {};
    let totalRevenue = 0;

    for (const order of orders) {
      const s = order.status ?? 'unknown';
      byStatus[s] = (byStatus[s] ?? 0) + 1;
      if (order.status === 'completed' && order.finalPrice) {
        totalRevenue += order.finalPrice;
      }
    }

    return {
      total: orders.length,
      totalRevenue,
      byStatus,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    };
  }
}
