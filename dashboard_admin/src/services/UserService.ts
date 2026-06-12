import * as admin from 'firebase-admin';

export interface AppUser {
  id: string;
  uid: string;
  name?: string;
  nome?: string;
  email?: string;
  phone?: string;
  userType?: string;
  tipo?: string;
  isActive?: boolean;
  ativo?: boolean;
  verificationStatus?: string;
  createdAt?: any;
  updatedAt?: any;
}

function getDb(): FirebaseFirestore.Firestore {
  if (!admin.apps.length) throw new Error('Firebase Admin não inicializado');
  return admin.firestore();
}

export class UserService {
  async getUserById(id: string): Promise<AppUser | null> {
    const snap = await getDb().collection('users').doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as AppUser;
  }

  async getUserByEmail(email: string): Promise<AppUser | null> {
    const snap = await getDb()
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0]!;
    return { id: doc.id, ...doc.data() } as AppUser;
  }

  async getUsers(filters?: {
    userType?: string;
    isActive?: boolean;
    limitCount?: number;
  }): Promise<{ users: AppUser[]; total: number }> {
    let q: FirebaseFirestore.Query = getDb().collection('users').orderBy('createdAt', 'desc');

    if (filters?.userType) q = q.where('userType', '==', filters.userType);
    if (filters?.isActive !== undefined) q = q.where('isActive', '==', filters.isActive);
    q = q.limit(filters?.limitCount ?? 100);

    const snap = await q.get();
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppUser));
    return { users, total: users.length };
  }

  async updateUser(id: string, data: Partial<AppUser>): Promise<void> {
    await getDb()
      .collection('users')
      .doc(id)
      .update({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  }

  async toggleUserStatus(id: string): Promise<void> {
    const ref = getDb().collection('users').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Usuário não encontrado');
    const current = snap.data()?.isActive ?? true;
    await ref.update({
      isActive: !current,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
