import * as admin from 'firebase-admin';

export interface ProviderLocationData {
  id?: string;
  providerId?: string;
  latitude?: number;
  longitude?: number;
  status?: 'available' | 'busy' | 'online' | 'offline';
  accuracy?: number;
  heading?: number;
  speed?: number;
  altitude?: number;
  updatedAt?: any;
}

function getDb(): FirebaseFirestore.Firestore {
  if (!admin.apps.length) throw new Error('Firebase Admin não inicializado');
  return admin.firestore();
}

export class ProviderLocationService {
  async getProviderLocation(providerId: string): Promise<ProviderLocationData | null> {
    const snap = await getDb()
      .collection('provider_locations')
      .where('providerId', '==', providerId)
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0]!;
    return { id: doc.id, ...doc.data() } as ProviderLocationData;
  }

  async getAllProviderLocations(): Promise<ProviderLocationData[]> {
    const snap = await getDb()
      .collection('provider_locations')
      .where('status', 'in', ['available', 'busy', 'online'])
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProviderLocationData));
  }

  async updateProviderLocation(providerId: string, data: Partial<ProviderLocationData>): Promise<void> {
    const db = getDb();
    const snap = await db
      .collection('provider_locations')
      .where('providerId', '==', providerId)
      .limit(1)
      .get();

    const payload = {
      ...data,
      providerId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (snap.empty) {
      await db.collection('provider_locations').add(payload);
    } else {
      await snap.docs[0]!.ref.update(payload);
    }
  }
}
