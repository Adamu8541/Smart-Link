/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function initAuthSync(
  onUserSynced: (user: any) => void,
  onPolicyCheck?: (uid: string) => void
): () => void {
  let unsub: (() => void) | null = null;
  let isCancelled = false;

  import("../firebase").then(({ auth, db, doc, setDoc, onAuthStateChanged, isFirebaseConfigured }) => {
    if (isCancelled || !isFirebaseConfigured) return;

    unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser || isCancelled) return;

      const email = (fbUser.email || "").toLowerCase().trim();
      const fullName = fbUser.displayName || email.split("@")[0] || "Smart Link User";
      const phone = fbUser.phoneNumber || "";

      try {
        const syncRes = await fetch("/api/auth/sync-firebase-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: fbUser.uid,
            email: email,
            fullName: fullName,
            phoneNumber: phone,
            isVerified: true,
          }),
        });

        const syncData = syncRes.ok ? await syncRes.json() : null;
        let userObj = syncData?.user || null;

        if (!userObj) {
          userObj = {
            uid: fbUser.uid,
            email: email,
            fullName: fullName,
            phoneNumber: phone,
            role: "CUSTOMER",
            walletBalance: 0.0,
            referralCode: "SL" + Math.floor(1000 + Math.random() * 9000),
            isVerified: true,
            createdAt: new Date().toISOString(),
          };
        }

        // Keep Firestore users document merged in background
        setDoc(
          doc(db, "users", fbUser.uid),
          {
            uid: fbUser.uid,
            email: email,
            fullName: fullName,
            phoneNumber: phone || userObj.phoneNumber || "",
            isVerified: true,
            role: userObj.role || "CUSTOMER",
            walletBalance: userObj.walletBalance ?? 0.0,
            referralCode: userObj.referralCode || "SL" + Math.floor(1000 + Math.random() * 9000),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch(() => {});

        localStorage.setItem("smart_link_user", JSON.stringify(userObj));
        onUserSynced(userObj);

        if (onPolicyCheck) {
          onPolicyCheck(fbUser.uid);
        }
      } catch (e) {
        console.warn("[onAuthStateChanged] Sync note:", e);
      }
    });
  }).catch((err) => {
    console.warn("Failed to load Firebase auth listener:", err);
  });

  return () => {
    isCancelled = true;
    if (unsub) {
      unsub();
    }
  };
}
