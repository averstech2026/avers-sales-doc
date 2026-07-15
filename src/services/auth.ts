/**
 * Рекомендуемые правила Firestore (firestore.rules) для командной работы:
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   function isSignedIn() {
 *     return request.auth != null;
 *   }
 *
 *   function isValidEstimate() {
 *     let data = request.resource.data;
 *     return data.keys().hasAll([
 *         'id', 'projectName', 'clientName', 'description',
 *         'sections', 'rates', 'createdAt', 'updatedAt',
 *         'createdByUid', 'createdByName',
 *       ])
 *       && data.createdByUid is string
 *       && data.createdByName is string
 *       && data.id is string
 *       && data.projectName is string
 *       && data.clientName is string
 *       && data.description is string
 *       && data.sections is list
 *       && data.rates is map
 *       && data.createdAt is string
 *       && data.updatedAt is string;
 *   }
 *
 *   function isAuthor() {
 *     return isSignedIn() && resource.data.createdByUid == request.auth.uid;
 *   }
 *
 *   match /databases/{database}/documents {
 *     match /users/{userId} {
 *       allow read: if isSignedIn();
 *       allow create, update: if isSignedIn() && request.auth.uid == userId;
 *     }
 *
 *     // Вариант A — только автор редактирует свои сметы:
 *     match /estimates/{estimateId} {
 *       allow read: if isSignedIn();
 *       allow create: if isSignedIn()
 *         && isValidEstimate()
 *         && request.resource.data.createdByUid == request.auth.uid;
 *       allow update: if isSignedIn() && isValidEstimate() && isAuthor();
 *       allow delete: if false;
 *     }
 *
 *     // Вариант B — общая база организации (любой авторизованный участник):
 *     // match /estimates/{estimateId} {
 *     //   allow read, create, update: if isSignedIn() && isValidEstimate();
 *     //   allow delete: if false;
 *     // }
 *   }
 * }
 */

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuthInstance, getDb, isFirebaseConfigured } from '../firebase';
import { COLLECTIONS } from '../constants/roles';
import {
  DEFAULT_USER_ROLE,
  resolveUserRole,
  type AppRole,
} from '../constants/accessControl';

interface UserProfileDoc {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role?: AppRole;
  fullName?: string;
  position?: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: AppRole;
  fullName: string;
  position: string;
}

function mapFirebaseUser(user: User, role: AppRole, profile?: UserProfileDoc | null): AppUser {
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName?.trim() || user.email?.split('@')[0] || 'Пользователь',
    photoURL: user.photoURL,
    role,
    fullName: profile?.fullName?.trim() ?? '',
    position: profile?.position?.trim() ?? '',
  };
}

async function loadUserProfile(uid: string): Promise<UserProfileDoc | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, COLLECTIONS.users, uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfileDoc;
}

export { loadUserProfile };

async function buildAppUser(firebaseUser: User): Promise<AppUser> {
  const email = firebaseUser.email ?? '';
  const profile = await loadUserProfile(firebaseUser.uid);
  const role = resolveUserRole(email, profile?.role);
  const appUser = mapFirebaseUser(firebaseUser, role, profile);

  const profileOutdated =
    !profile ||
    profile.displayName !== appUser.displayName ||
    profile.email !== appUser.email ||
    profile.photoURL !== appUser.photoURL;

  if (profileOutdated) {
    await saveUserProfile(appUser);
  }

  return appUser;
}

export function subscribeToAuth(callback: (user: AppUser | null) => void): () => void {
  if (!isFirebaseConfigured()) {
    callback(null);
    return () => {};
  }

  const auth = getAuthInstance();
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    void buildAppUser(firebaseUser)
      .then(callback)
      .catch(() => {
        callback(mapFirebaseUser(firebaseUser, resolveUserRole(firebaseUser.email ?? ''), null));
      });
  });
}

export async function refreshAppUser(uid: string): Promise<AppUser | null> {
  const auth = getAuthInstance();
  const firebaseUser = auth.currentUser;
  if (!firebaseUser || firebaseUser.uid !== uid) return null;
  return buildAppUser(firebaseUser);
}

export async function signInWithEmail(email: string, password: string): Promise<AppUser> {
  const auth = getAuthInstance();
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return buildAppUser(credential.user);
}

export async function logOut(): Promise<void> {
  await signOut(getAuthInstance());
}

export async function saveUserProfile(user: AppUser): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const db = getDb();
  const existing = await loadUserProfile(user.uid);

  const payload: Record<string, unknown> = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    updatedAt: serverTimestamp(),
  };

  if (!existing) {
    payload.role = DEFAULT_USER_ROLE;
  }

  await setDoc(doc(db, COLLECTIONS.users, user.uid), payload, { merge: true });
}

export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function resolveAuthorName(
  user: Pick<AppUser, 'displayName' | 'email' | 'fullName'>
): string {
  const fullName = user.fullName?.trim();
  if (fullName) return fullName;
  const name = user.displayName?.trim();
  if (name) return name;
  return user.email?.trim() || 'Пользователь';
}

/** ФИО автора сметы — только из профиля, без логина и email. */
export function resolveEstimateCreatorName(user: Pick<AppUser, 'fullName'>): string {
  return user.fullName?.trim() || 'Не указан';
}

export function formatEstimateAuthorName(name?: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.includes('@')) return 'Не указан';
  return trimmed;
}

export function getAuthErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: string }).code)
    : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Некорректный адрес email.';
    case 'auth/user-disabled':
      return 'Учётная запись заблокирована.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Неверный email или пароль.';
    case 'auth/too-many-requests':
      return 'Слишком много попыток. Попробуйте позже.';
    default:
      return error instanceof Error ? error.message : 'Ошибка авторизации.';
  }
}

export { DEFAULT_USER_ROLE };
