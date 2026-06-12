import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  type DocumentData,
  type QueryConstraint,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

// Generic Firestore helpers
export const getCollection = async (collectionName: string, ...constraints: QueryConstraint[]): Promise<Array<{ id: string } & Record<string, any>>> => {
  if (!db) return []

  try {
    const q = query(collection(db, collectionName), ...constraints)
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch {
    return []
  }
}

// Buscar subcoleção (ex: orders/orderId/messages)
export const getSubcollection = async (
  parentCollection: string,
  parentId: string,
  subcollectionName: string,
  ...constraints: QueryConstraint[]
): Promise<Array<{ id: string } & Record<string, any>>> => {
  if (!db) return []

  try {
    const ref = collection(db, parentCollection, parentId, subcollectionName)
    const q = constraints.length > 0 ? query(ref, ...constraints) : ref
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch {
    return []
  }
}

export const getDocument = async (collectionName: string, docId: string): Promise<({ id: string } & Record<string, any>) | null> => {
  if (!db) return null

  try {
    const docRef = doc(db, collectionName, docId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
  } catch {
    return null
  }
}

export const addDocument = async (collectionName: string, data: any) => {
  if (!db) {
    throw new Error('Firestore não inicializado')
  }
  
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    throw error
  }
}

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  if (!db) {
    throw new Error('Firestore não inicializado')
  }
  
  try {
    const docRef = doc(db, collectionName, docId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    throw error
  }
}

export const deleteDocument = async (collectionName: string, docId: string) => {
  if (!db) {
    throw new Error('Firestore não inicializado')
  }
  
  try {
    const docRef = doc(db, collectionName, docId)
    await deleteDoc(docRef)
  } catch (error) {
    throw error
  }
}

export const listenToCollection = (
  collectionName: string,
  callback: (data: DocumentData[]) => void,
  ...constraints: QueryConstraint[]
) => {
  if (!db) return () => {}
  
  try {
    const q = query(collection(db, collectionName), ...constraints)
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      callback(data)
    })
  } catch {
    return () => {}
  }
}

export const listenToDocument = (
  collectionName: string,
  docId: string,
  callback: (data: DocumentData | null) => void,
) => {
  if (!db) return () => {}
  
  try {
    const docRef = doc(db, collectionName, docId)
    return onSnapshot(docRef, (doc) => {
      const data = doc.exists() ? { id: doc.id, ...doc.data() } : null
      callback(data)
    })
  } catch {
    return () => {}
  }
}
