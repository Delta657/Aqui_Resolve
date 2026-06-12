import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

export interface FirebaseOrder {
  id: string
  numero: string
  cliente: {
    id: string
    nome: string
    telefone: string
    email: string
  }
  servico: {
    id: string
    nome: string
    descricao: string
    categoria: string
  }
  valor: number
  status: 'pendente' | 'aceito' | 'em_andamento' | 'concluido' | 'cancelado'
  dataCriacao: any
  dataAgendamento: string
  endereco: {
    rua: string
    numero: string
    bairro: string
    cidade: string
    cep: string
    complemento?: string
    coordenadas?: {
      lat: number
      lng: number
    }
  }
  prestador?: {
    id: string
    nome: string
    telefone: string
  }
  observacoes?: string
  avaliacao?: {
    nota: number
    comentario?: string
  }
  createdAt: any
  updatedAt: any
}

export class FirebaseOrdersService {
  private static collectionName = 'orders'

  static async getOrders(): Promise<FirebaseOrder[]> {
    if (!db) {
      console.warn('Firebase nao inicializado')
      return []
    }

    try {
      const q = query(collection(db, this.collectionName), orderBy('dataCriacao', 'desc'))
      const snapshot = await getDocs(q)

      return snapshot.docs.map((currentDoc) => ({
        id: currentDoc.id,
        ...currentDoc.data(),
      })) as FirebaseOrder[]
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error)
      return []
    }
  }

  static async getOrdersByStatus(status: FirebaseOrder['status']): Promise<FirebaseOrder[]> {
    if (!db) {
      console.warn('Firebase nao inicializado')
      return []
    }

    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', status),
        orderBy('dataCriacao', 'desc')
      )
      const snapshot = await getDocs(q)

      return snapshot.docs.map((currentDoc) => ({
        id: currentDoc.id,
        ...currentDoc.data(),
      })) as FirebaseOrder[]
    } catch (error) {
      console.error('Erro ao buscar pedidos por status:', error)
      return []
    }
  }

  static async createOrder(
    orderData: Omit<FirebaseOrder, 'id' | 'numero' | 'dataCriacao' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    if (!db) {
      throw new Error('Firebase nao inicializado')
    }

    try {
      const numero = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

      const docRef = await addDoc(collection(db, this.collectionName), {
        ...orderData,
        numero,
        dataCriacao: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return docRef.id
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      throw error
    }
  }

  static async updateOrderStatus(
    orderId: string,
    status: FirebaseOrder['status'],
    prestador?: FirebaseOrder['prestador']
  ): Promise<void> {
    if (!db) {
      throw new Error('Firebase nao inicializado')
    }

    try {
      const orderRef = doc(db, this.collectionName, orderId)
      const updateData: Record<string, unknown> = {
        status,
        updatedAt: serverTimestamp(),
      }

      if (prestador) {
        updateData.prestador = prestador
      }

      await updateDoc(orderRef, updateData)
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error)
      throw error
    }
  }

  static listenToOrders(callback: (orders: FirebaseOrder[]) => void): () => void {
    if (!db) {
      console.warn('Firebase nao inicializado')
      callback([])
      return () => {}
    }

    try {
      const q = query(collection(db, this.collectionName), orderBy('dataCriacao', 'desc'))

      return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map((currentDoc) => ({
          id: currentDoc.id,
          ...currentDoc.data(),
        })) as FirebaseOrder[]

        callback(orders)
      })
    } catch (error) {
      console.error('Erro ao escutar pedidos:', error)
      callback([])
      return () => {}
    }
  }
}
