/**
 * SmartLink Automated Payment Reconciliation & Recovery Worker
 *
 * Periodically and on-demand:
 * 1. Scans unmatched or pending payment notifications.
 * 2. Re-resolves users via normalized virtual accounts, customer references (SL-...), email, or phone.
 * 3. Verifies and credits deposits to customer wallets without manual intervention.
 * 4. Ensures bidirectional synchronization of virtual accounts between Turso and db.json.
 * 5. Notifies customers in real-time when a recovery credit is completed.
 */

import { readDB, writeDB } from "../db";
import { executeTurso } from "../turso/client";
import { VirtualAccountRepository, UserRepository, TransactionRepository } from "../turso/repositories/index";
import { PaymentVerificationReconciliationEngine } from "../../src/services/paymentVerificationReconciliationEngine";
import * as usersStore from "../../src/services/usersStore";
import { createNotification } from "../../src/services/notificationsStore";
import { formatNaira } from "../../src/utils/formatUtils";
import { syncAuthoritativeWalletBalance } from "./unifiedTransactions";

let isWorkerRunning = false;
let workerInterval: NodeJS.Timeout | null = null;

/**
 * Reconciles any unmatched or pending payments for a specific user on-demand.
 * Called when a customer clicks "Refresh Balance", opens the dashboard, or visits the wallet.
 */
export async function reconcileUserPendingDeposits(db: any, userId: string): Promise<{
  reconciledCount: number;
  totalAmountReconciled: number;
  newBalance: number;
}> {
  if (!userId) return { reconciledCount: 0, totalAmountReconciled: 0, newBalance: 0 };

  const targetIds = new Set<string>();
  targetIds.add(userId);

  let targetPhone = "";
  let targetEmail = "";
  let targetAccounts: string[] = [];

  try {
    const user = (await usersStore.getUserById(userId)) || (await usersStore.getUserByUid(userId));
    if (user) {
      if (user.uid) targetIds.add(user.uid);
      if (user.id) targetIds.add(user.id);
      if (user.email) {
        targetEmail = user.email.toLowerCase().trim();
        targetIds.add(targetEmail);
      }
      if (user.phoneNumber || user.phone) {
        targetPhone = String(user.phoneNumber || user.phone).replace(/\D/g, "");
      }
    }
  } catch {}

  // Resolve user's virtual account numbers from Turso & memory
  try {
    const tursoVa = await VirtualAccountRepository.findByUserId(userId);
    if (tursoVa?.account_number) {
      targetAccounts.push(tursoVa.account_number.trim());
    }
  } catch {}

  if (Array.isArray(db.virtualAccounts)) {
    for (const va of db.virtualAccounts) {
      const vaUserId = String(va.userId || va.user_id || "");
      if (targetIds.has(vaUserId) && va.accountNumber) {
        targetAccounts.push(String(va.accountNumber).trim());
      }
    }
  }

  // Clean account list (raw and 10-digit padded)
  const cleanAccountSet = new Set<string>();
  for (const acc of targetAccounts) {
    const raw = acc.replace(/\D/g, "");
    if (raw) {
      cleanAccountSet.add(raw);
      if (raw.length === 9) cleanAccountSet.add(`0${raw}`);
    }
  }

  if (!Array.isArray(db.unmatched_payments) || db.unmatched_payments.length === 0) {
    const balance = await syncAuthoritativeWalletBalance(db, userId);
    return { reconciledCount: 0, totalAmountReconciled: 0, newBalance: balance };
  }

  let reconciledCount = 0;
  let totalAmountReconciled = 0;
  const remainingUnmatched: any[] = [];

  for (const item of db.unmatched_payments) {
    const itemAccRaw = String(item.accountNumber || "").replace(/\D/g, "");
    const itemAccPadded = itemAccRaw.length === 9 ? `0${itemAccRaw}` : itemAccRaw;

    const itemEmail = String(item.userEmail || item.rawPayload?.email || item.rawPayload?.customer?.email || "").toLowerCase().trim();
    const itemPhone = String(item.rawPayload?.phone || item.rawPayload?.customer?.phone || "").replace(/\D/g, "");
    const itemRef = String(item.paymentReference || item.providerTransactionId || "");

    const isAccountMatch = itemAccRaw && (cleanAccountSet.has(itemAccRaw) || cleanAccountSet.has(itemAccPadded));
    const isEmailMatch = itemEmail && targetEmail && itemEmail === targetEmail;
    const isPhoneMatch = itemPhone && targetPhone && (itemPhone === targetPhone || itemPhone.slice(-10) === targetPhone.slice(-10));
    const isRefMatch = itemRef && itemRef.startsWith("SL-") && (itemRef.includes(userId) || Array.from(targetIds).some(id => itemRef.includes(id)));

    if (isAccountMatch || isEmailMatch || isPhoneMatch || isRefMatch) {
      console.log(`[ReconciliationWorker] Auto-reconciling deposit for user ${userId}: Ref ${itemRef}, Amount: ₦${item.amount}`);

      const result = await PaymentVerificationReconciliationEngine.verifyAndReconcilePayment(db, {
        payload: item.rawPayload || {
          reference: itemRef,
          amount: item.amount,
          accountNumber: itemAccPadded || itemAccRaw,
          event: "charge.success",
          status: "SUCCESS",
        },
        providerOverride: "Aspfiy Payment Portal",
      });

      if (result.success || result.isDuplicate) {
        reconciledCount++;
        totalAmountReconciled += Number(item.amount || 0);

        // Mark reconciliation record as VERIFIED
        if (Array.isArray(db.reconciliation_records)) {
          const rec = db.reconciliation_records.find((r: any) => r.id === item.id || r.paymentReference === itemRef);
          if (rec) {
            rec.status = "VERIFIED";
            rec.userId = userId;
            rec.updatedAt = new Date().toISOString();
          }
        }

        // Notify user
        try {
          await createNotification({
            userId,
            title: "Wallet Credited Successfully",
            message: `Your bank deposit of ${formatNaira(item.amount, true)} has been verified and credited to your wallet balance.`,
            type: "WALLET_FUNDING",
            read: false,
          });
        } catch {}
      } else {
        remainingUnmatched.push(item);
      }
    } else {
      remainingUnmatched.push(item);
    }
  }

  db.unmatched_payments = remainingUnmatched;
  writeDB(db);

  const newBalance = await syncAuthoritativeWalletBalance(db, userId);

  return {
    reconciledCount,
    totalAmountReconciled,
    newBalance,
  };
}

/**
 * Background recovery job that runs periodically:
 * 1. Synchronizes virtual accounts between Turso and db.json.
 * 2. Scans all unmatched payments and attempts automated matching.
 */
export async function runBackgroundReconciliationCycle() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  try {
    const db = readDB();

    // 1. Bidirectional Virtual Accounts Sync
    try {
      const tursoAccounts = await VirtualAccountRepository.listAll().catch(() => []);
      if (!Array.isArray(db.virtualAccounts)) db.virtualAccounts = [];

      // A: Turso -> memory
      for (const tAcc of tursoAccounts) {
        const clean = String(tAcc.account_number || "").replace(/\D/g, "");
        if (!clean) continue;

        const exists = db.virtualAccounts.some(
          (va: any) => String(va.accountNumber || va.account_number || "").replace(/\D/g, "") === clean
        );

        if (!exists) {
          db.virtualAccounts.push({
            id: tAcc.id,
            userId: tAcc.user_id,
            accountNumber: tAcc.account_number,
            bankName: tAcc.bank_name,
            bankCode: tAcc.bank_code,
            accountName: tAcc.account_name,
            provider: tAcc.provider || "prov_aspfiy",
            providerName: "Aspfiy Payment Portal",
            reference: tAcc.reference,
            status: "ACTIVE",
            createdAt: tAcc.created_at || new Date().toISOString(),
          });
        }
      }

      // B: memory -> Turso
      for (const mAcc of db.virtualAccounts) {
        const clean = String(mAcc.accountNumber || mAcc.account_number || "").replace(/\D/g, "");
        const rawUserId = String(mAcc.userId || mAcc.user_id || "");

        // Skip invalid object userIds (e.g. "[object Object]")
        if (!clean || !rawUserId || rawUserId === "[object Object]" || rawUserId.startsWith("{")) continue;

        const existsInTurso = tursoAccounts.some(
          t => String(t.account_number || "").replace(/\D/g, "") === clean
        );

        if (!existsInTurso) {
          try {
            await VirtualAccountRepository.create({
              id: mAcc.id || `va_aspfiy_${rawUserId}`,
              user_id: rawUserId,
              account_number: clean,
              bank_name: mAcc.bankName || mAcc.bank_name || "PalmPay",
              bank_code: mAcc.bankCode || mAcc.bank_code || "999991",
              account_name: mAcc.accountName || mAcc.account_name || "Smart Link User",
              provider: mAcc.provider || "prov_aspfiy",
              reference: mAcc.reference || `SL-${rawUserId}`,
              is_active: 1,
            });
          } catch {}
        }
      }
    } catch (vaSyncErr: any) {
      console.warn(`[ReconciliationWorker] Virtual accounts sync note: ${vaSyncErr?.message}`);
    }

    // 2. Scan and Auto-Reconcile Unmatched Payments
    if (Array.isArray(db.unmatched_payments) && db.unmatched_payments.length > 0) {
      const remaining: any[] = [];
      let resolvedCount = 0;

      for (const item of db.unmatched_payments) {
        const rawAcc = String(item.accountNumber || "").replace(/\D/g, "");
        const paddedAcc = rawAcc.length === 9 ? `0${rawAcc}` : rawAcc;
        const ref = String(item.paymentReference || item.providerTransactionId || "");

        let targetUser: any = null;

        // Try lookup by account number in Turso
        if (rawAcc && rawAcc !== "N/A" && rawAcc !== "9999999999") {
          try {
            const tursoVa = (await VirtualAccountRepository.findByAccountNumber(paddedAcc)) ||
                            (await VirtualAccountRepository.findByAccountNumber(rawAcc));
            if (tursoVa?.user_id) {
              targetUser = await usersStore.getUserById(tursoVa.user_id);
            }
          } catch {}
        }

        // Try lookup in db.virtualAccounts
        if (!targetUser && rawAcc && rawAcc !== "N/A") {
          const matchVa = db.virtualAccounts.find((va: any) => {
            const vaAcc = String(va.accountNumber || va.account_number || "").replace(/\D/g, "");
            return vaAcc && (vaAcc === rawAcc || vaAcc === paddedAcc);
          });
          if (matchVa && matchVa.userId && typeof matchVa.userId === "string" && !matchVa.userId.startsWith("{")) {
            targetUser = await usersStore.getUserById(matchVa.userId);
          }
        }

        // Try lookup by reference (e.g. SL-${userId}-...)
        if (!targetUser && ref && ref.startsWith("SL-")) {
          const parts = ref.split("-");
          if (parts.length >= 2) {
            const potentialUid = parts[1];
            if (potentialUid && potentialUid !== "objectObject") {
              targetUser = await usersStore.getUserById(potentialUid);
            }
          }
        }

        // If target user resolved, credit the payment!
        if (targetUser) {
          console.log(`[ReconciliationWorker] Auto-recovering unmatched payment ${item.id} for user ${targetUser.uid || targetUser.id}`);
          const res = await PaymentVerificationReconciliationEngine.verifyAndReconcilePayment(db, {
            payload: item.rawPayload || {
              reference: ref,
              amount: item.amount,
              accountNumber: paddedAcc || rawAcc,
              event: "charge.success",
              status: "SUCCESS",
            },
            providerOverride: "Aspfiy Payment Portal",
          });

          if (res.success || res.isDuplicate) {
            resolvedCount++;
            try {
              await createNotification({
                userId: targetUser.uid || targetUser.id,
                title: "Deposit Auto-Reconciled",
                message: `Your deposit of ${formatNaira(item.amount, true)} via Aspfiy has been verified and credited to your wallet.`,
                type: "WALLET_FUNDING",
                read: false,
              });
            } catch {}
            continue;
          }
        }

        remaining.push(item);
      }

      if (resolvedCount > 0) {
        db.unmatched_payments = remaining;
        writeDB(db);
        console.log(`[ReconciliationWorker] Auto-recovered ${resolvedCount} pending unmatched payments.`);
      }
    }
  } catch (err: any) {
    console.warn(`[ReconciliationWorker] Cycle exception note: ${err?.message}`);
  } finally {
    isWorkerRunning = false;
  }
}

/**
 * Initializes the background reconciliation worker.
 */
export function startReconciliationWorker(intervalMs = 30000) {
  if (workerInterval) return;
  console.log(`[ReconciliationWorker] Background reconciliation engine started (polling every ${intervalMs / 1000}s).`);

  // Initial run after a short warm-up delay
  setTimeout(() => {
    runBackgroundReconciliationCycle().catch(() => {});
  }, 3000);

  workerInterval = setInterval(() => {
    runBackgroundReconciliationCycle().catch(() => {});
  }, intervalMs);
}
