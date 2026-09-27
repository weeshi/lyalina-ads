// @ts-nocheck
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig, appId } from '../config/firebaseConfig';

export { appId };
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const secondaryApp = initializeApp(firebaseConfig, "AdminSecondaryApp");
export const secondaryAuth = getAuth(secondaryApp);
