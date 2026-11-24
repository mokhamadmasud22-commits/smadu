import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
] as const;

let cachedAccessToken: string | null = null;
let authInstance: Auth | null = null;

function ensureAuth(): Auth {
  if (!authInstance) {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(app);
  }
  return authInstance;
}

export function getInMemoryAccessToken(): string | null {
  return cachedAccessToken;
}

export function clearInMemoryAccessToken(): void {
  cachedAccessToken = null;
}

export function initGoogleWorkspaceAuth(
  onChange: (user: User | null, accessToken: string | null) => void,
): () => void {
  const auth = ensureAuth();
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedAccessToken = null;
    }
    onChange(user, cachedAccessToken);
  });
}

export async function signInWithGoogleWorkspace(): Promise<{
  user: User;
  accessToken: string;
}> {
  const auth = ensureAuth();
  const provider = new GoogleAuthProvider();
  WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));
  provider.setCustomParameters({
    prompt: 'select_account',
    access_type: 'online',
  });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  if (!token) {
    throw new Error(
      'Token akses Google Workspace tidak diterima. Silakan masuk ulang dan izinkan akses Google Sheets & Drive.',
    );
  }
  cachedAccessToken = token;
  return { user: result.user, accessToken: token };
}

export async function signOutGoogleWorkspace(): Promise<void> {
  const auth = ensureAuth();
  cachedAccessToken = null;
  await signOut(auth);
}
