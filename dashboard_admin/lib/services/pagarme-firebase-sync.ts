/**
 * SERVIÇO DE SINCRONIZAÇÃO PAGAR.ME ↔ FIREBASE
 * Persiste dados do Pagar.me no Firestore para histórico e analytics
 */

import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore'
import {
  PagarmeOrder,
  PagarmeCharge,
  PagarmeCustomer,
  PagarmeSubscription,
} from '@/types/pagarme'

// ==========================================
// COLEÇÕES DO FIRESTORE
// ==========================================

const COLLECTIONS = {
  ORDERS: 'pagarme_orders',
  CHARGES: 'pagarme_charges',
  CUSTOMERS: 'pagarme_customers',
  SUBSCRIPTIONS: 'pagarme_subscriptions',
  SYNC_LOG: 'pagarme_sync_log',
}

// ==========================================
// SINCRONIZAÇÃO DE PEDIDOS
// ==========================================

export class PagarmeFirebaseSync {
  /**
   * Salva um pedido do Pagar.me no Firestore
   */
  static async saveOrder(order: PagarmeOrder): Promise<void> {
    try {
      if (!db) throw new Error('Firebase não inicializado')

      const orderRef = doc(db, COLLECTIONS.ORDERS, order.id)
      await setDoc(orderRef, {
        ...order,
        created_at: Timestamp.fromDate(new Date(order.created_at)),
        updated_at: Timestamp.fromDate(new Date(order.updated_at)),
        synced_at: Timestamp.now(),
      }, { merge: true })

      console.log('✅ Pedido salvo no Firestore:', order.id)
    } catch (error) {
      console.error('❌ Erro ao salvar pedido:', error)
      throw error
    }
  }

  /**
   * Salva uma cobrança do Pagar.me no Firestore
   */
  static async saveCharge(charge: PagarmeCharge): Promise<void> {
    try {
      if (!db) throw new Error('Firebase não inicializado')

      const chargeRef = doc(db, COLLECTIONS.CHARGES, charge.id)
      await setDoc(chargeRef, {
        ...charge,
        created_at: Timestamp.fromDate(new Date(charge.created_at)),
        updated_at: Timestamp.fromDate(new Date(charge.updated_at)),
        paid_at: charge.paid_at ? Timestamp.fromDate(new Date(charge.paid_at)) : null,
        synced_at: Timestamp.now(),
      }, { merge: true })

      console.log('✅ Cobrança salva no Firestore:', charge.id)
    } catch (error) {
      console.error('❌ Erro ao salvar cobrança:', error)
      throw error
    }
  }

  /**
   * Salva um cliente do Pagar.me no Firestore
   */
  static async saveCustomer(customer: PagarmeCustomer): Promise<void> {
    try {
      if (!db) throw new Error('Firebase não inicializado')

      const customerRef = doc(db, COLLECTIONS.CUSTOMERS, customer.id)
      await setDoc(customerRef, {
        ...customer,
        created_at: customer.created_at ? Timestamp.fromDate(new Date(customer.created_at)) : null,
        updated_at: customer.updated_at ? Timestamp.fromDate(new Date(customer.updated_at)) : null,
        synced_at: Timestamp.now(),
      }, { merge: true })

      console.log('✅ Cliente salvo no Firestore:', customer.id)
    } catch (error) {
      console.error('❌ Erro ao salvar cliente:', error)
      throw error
    }
  }

  /**
   * Salva uma assinatura do Pagar.me no Firestore
   */
  static async saveSubscription(subscription: PagarmeSubscription): Promise<void> {
    try {
      if (!db) throw new Error('Firebase não inicializado')

      const subscriptionRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, subscription.id)
      await setDoc(subscriptionRef, {
        ...subscription,
        created_at: Timestamp.fromDate(new Date(subscription.created_at)),
        updated_at: Timestamp.fromDate(new Date(subscription.updated_at)),
        canceled_at: subscription.canceled_at ? Timestamp.fromDate(new Date(subscription.canceled_at)) : null,
        synced_at: Timestamp.now(),
      }, { merge: true })

      console.log('✅ Assinatura salva no Firestore:', subscription.id)
    } catch (error) {
      console.error('❌ Erro ao salvar assinatura:', error)
      throw error
    }
  }

  /**
   * Sincroniza múltiplos pedidos em lote
   */
  static async syncOrders(orders: PagarmeOrder[]): Promise<void> {
    try {
      if (!db) throw new Error('Firebase não inicializado')

      const batch = writeBatch(db)

      orders.forEach(order => {
        const orderRef = doc(db, COLLECTIONS.ORDERS, order.id)
        batch.set(orderRef, {
          ...order,
          created_at: Timestamp.fromDate(new Date(order.created_at)),
          updated_at: Timestamp.fromDate(new Date(order.updated_at)),
          synced_at: Timestamp.now(),
        }, { merge: true })
      })

      await batch.commit()
      console.log(`✅ ${orders.length} pedidos sincronizados no Firestore`)
    } catch (error) {
      console.error('❌ Erro ao sincronizar pedidos:', error)
      throw error
    }
  }

  /**
   * Sincroniza múltiplas cobranças em lote
   */
  static async syncCharges(charges: PagarmeCharge[]): Promise<void> {
    try {
      if (!db) throw new Error('Firebase não inicializado')

      const batch = writeBatch(db)

      charges.forEach(charge => {
        const chargeRef = doc(db, COLLECTIONS.CHARGES, charge.id)
        batch.set(chargeRef, {
          ...charge,
          created_at: Timestamp.fromDate(new Date(charge.created_at)),
          updated_at: Timestamp.fromDate(new Date(charge.updated_at)),
          paid_at: charge.paid_at ? Timestamp.fromDate(new Date(charge.paid_at)) : null,
          synced_at: Timestamp.now(),
        }, { merge: true })
      })

      await batch.commit()
      console.log(`✅ ${charges.length} cobranças sincronizadas no Firestore`)
    } catch (error) {
      console.error('❌ Erro ao sincronizar cobranças:', error)
      throw error
    }
  }

  /**
   * Busca pedidos do Firestore
   */
  static async getOrders(options?: {
    status?: string
    limit?: number
  }): Promise<any[]> {
    try {
      if (!db) throw new Error('Firebase não inicializado')

      const ordersRef = collection(db, COLLECTIONS.ORDERS)
      let q = query(ordersRef, orderBy('created_at', 'desc'))

      if (options?.status) {
        q = query(q, where('status', '==', options.status))
      }

      if (options?.limit) {
        q = query(q, limit(options.limit))
      }

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }))
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos:', error)
      return []
    }
  }

  /**
   * Busca cobranças do Firestore
   */
  static async getCharges(options?: {
    status?: string
    limit?: number
  }): Promise<any[]> {
    try {
      if (!db) throw new Error('Firebase não inicializado')

      const chargesRef = collection(db, COLLECTIONS.CHARGES)
      let q = query(chargesRef, orderBy('created_at', 'desc'))

      if (options?.status) {
        q = query(q, where('status', '==', options.status))
      }

      if (options?.limit) {
        q = query(q, limit(options.limit))
      }

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }))
    } catch (error) {
      console.error('❌ Erro ao buscar cobranças:', error)
      return []
    }
  }

  /**
   * Registra log de sincronização
   */
  static async logSync(type: string, count: number, status: 'success' | 'error', details?: any): Promise<void> {
    try {
      if (!db) throw new Error('Firebase não inicializado')

      const logRef = doc(collection(db, COLLECTIONS.SYNC_LOG))
      await setDoc(logRef, {
        type,
        count,
        status,
        details: details || null,
        timestamp: Timestamp.now(),
      })
    } catch (error) {
      console.error('❌ Erro ao registrar log:', error)
    }
  }

  /**
   * Listener em tempo real para cobranças
   */
  static listenToCharges(callback: (charges: any[]) => void): () => void {
    try {
      if (!db) throw new Error('Firebase não inicializado')

      const chargesRef = collection(db, COLLECTIONS.CHARGES)
      const q = query(chargesRef, orderBy('created_at', 'desc'), limit(100))

      return onSnapshot(q, (snapshot) => {
        const charges = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }))
        callback(charges)
      })
    } catch (error) {
      console.error('❌ Erro ao criar listener:', error)
      return () => {}
    }
  }
}

