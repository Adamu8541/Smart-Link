/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSupabaseClient } from "./supabaseAuth";

export function initAuthSync(
  onUserSynced: (user: any) => void,
  onPolicyCheck?: (uid: string) => void
): () => void {
  let isCancelled = false;

  // Initial local storage check
  try {
    const stored = localStorage.getItem("smart_link_user");
    if (stored) {
      const user = JSON.parse(stored);
      onUserSynced(user);
      if (onPolicyCheck && (user.uid || user.id)) {
        onPolicyCheck(user.uid || user.id);
      }
    }
  } catch (e) {}

  const sbClient = getSupabaseClient();
  if (sbClient) {
    const { data: { subscription } } = sbClient.auth.onAuthStateChange(async (event, session) => {
      if (isCancelled || !session?.user) return;
      const sbUser = session.user;
      const email = (sbUser.email || "").toLowerCase().trim();
      const userObj = {
        uid: sbUser.id,
        id: sbUser.id,
        email: email,
        fullName: sbUser.user_metadata?.full_name || email.split("@")[0] || "Smart Link User",
        phoneNumber: sbUser.user_metadata?.phone || "",
        role: sbUser.user_metadata?.role || "CUSTOMER",
        walletBalance: 0.0,
        referralCode: "SL" + Math.floor(1000 + Math.random() * 9000),
        isVerified: true,
        createdAt: sbUser.created_at || new Date().toISOString(),
      };
      localStorage.setItem("smart_link_user", JSON.stringify(userObj));
      onUserSynced(userObj);
      if (onPolicyCheck) {
        onPolicyCheck(sbUser.id);
      }
    });

    return () => {
      isCancelled = true;
      subscription?.unsubscribe();
    };
  }

  return () => {
    isCancelled = true;
  };
}
