import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDb, isFirebaseConfigured } from '../firebase';
import { COLLECTIONS } from '../constants/roles';

export interface EmployeeProfileData {
  fullName: string;
  position: string;
}

export async function saveEmployeeProfile(
  uid: string,
  profile: EmployeeProfileData
): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase не настроен');
  }

  const db = getDb();
  await setDoc(
    doc(db, COLLECTIONS.users, uid),
    {
      fullName: profile.fullName.trim(),
      position: profile.position.trim(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function getSignatureDisplayName(
  fullName: string,
  fallbackDisplayName: string,
  email: string
): string {
  if (fullName.trim()) return fullName.trim();
  if (fallbackDisplayName.trim()) return fallbackDisplayName.trim();
  return email.trim() || '—';
}
