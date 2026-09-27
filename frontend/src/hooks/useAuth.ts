// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut, GoogleAuthProvider, linkWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, appId } from '../firebase';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState(null);
  const [globalAuthError, setGlobalAuthError] = useState("");
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);

  const currentUser = user;
  const SUPER_ADMIN_EMAILS = ['ai@ly-tech.ly', 'weeshi.design@gmail.com'];
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(currentUser?.email?.toLowerCase());

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setGoogleAccessToken(null);
      setUser(null);
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const linkGoogleAccount = useCallback(async () => {
    if (!currentUser) return { success: false, error: "لا يوجد مستخدم حالي" };
    
    setIsLinkingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      
      const result = await linkWithPopup(currentUser, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        return { success: true };
      }
      return { success: false, error: "لم يتم الحصول على رمز الوصول" };
    } catch (err) {
      console.error("Link Google error:", err);
      let errorMsg = "فشل ربط حساب جوجل";
      
      if (err.code === 'auth/credential-already-in-use') {
        errorMsg = "حساب جوجل هذا مرتبط بحساب آخر بالفعل في النظام. إذا كنت تريد استخدام هذا الحساب، يرجى تسجيل الخروج والدخول مباشرة بحساب جوجل.";
      } else if (err.code === 'auth/provider-already-linked') {
        errorMsg = "حسابك الحالي مرتبط بالفعل بحساب جوجل. يمكنك استخدام النسخ الاحتياطي السحابي.";
        // محاولة الحصول على التوكن
        try {
          const result = await linkWithPopup(currentUser, provider);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential && credential.accessToken) {
            setGoogleAccessToken(credential.accessToken);
            return { success: true };
          }
        } catch (e) {
          console.error("Retry failed:", e);
        }
      } else if (err.code === 'auth/popup-blocked') {
        errorMsg = "تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع";
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMsg = "تم إغلاق النافذة المنبثقة. حاول مرة أخرى";
      } else if (err.code === 'auth/network-request-failed') {
        errorMsg = "فشل الاتصال بالشبكة. تحقق من اتصالك بالإنترنت";
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = "عدد كبير جداً من المحاولات. انتظر قليلاً ثم حاول مرة أخرى";
      } else if (err.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    } finally {
      setIsLinkingGoogle(false);
    }
  }, [currentUser]);

  const refreshGoogleToken = useCallback(async () => {
    if (!currentUser) return { success: false, error: "لا يوجد مستخدم حالي" };
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      const result = await linkWithPopup(currentUser, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        return { success: true };
      }
      return { success: false, error: "لم يتم الحصول على رمز الوصول" };
    } catch (err) {
      console.error("Refresh token error:", err);
      let errorMsg = "فشل تحديث التوكن";
      if (err.code === 'auth/popup-blocked') {
        errorMsg = "تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة";
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMsg = "تم إغلاق النافذة المنبثقة";
      } else if (err.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    }
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (SUPER_ADMIN_EMAILS.includes(firebaseUser.email?.toLowerCase())) {
          setUser(firebaseUser);
          setIsAuthReady(true);
          setGlobalAuthError("");
        } else {
          try {
            const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'system_users', firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists() && userDocSnap.data().isActive === false) {
              await signOut(auth);
              setUser(null);
              setGlobalAuthError("تم إيقاف حسابك من قبل الإدارة. يرجى التواصل مع المدير.");
            } else {
              setUser(firebaseUser);
              setGlobalAuthError("");
            }
          } catch (e) {
            setUser(firebaseUser);
          }
          setIsAuthReady(true);
        }
      } else {
        setUser(null);
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  return {
    user,
    currentUser,
    isSuperAdmin,
    isAuthReady,
    googleAccessToken,
    setGoogleAccessToken,
    globalAuthError,
    handleLogout,
    linkGoogleAccount,
    refreshGoogleToken,
    isLinkingGoogle,
  };
};

export default useAuth;