import { executeTurso } from "../server/turso/client";

async function inspectTursoData() {
  const usersRes = await executeTurso("SELECT uid, email, wallet_balance FROM users;");
  console.log("Turso Users count:", usersRes.rows.length);
  for (const u of usersRes.rows) {
    if (Number(u.wallet_balance) > 0) {
      console.log(`  - User ${u.uid} (${u.email}): balance = ₦${u.wallet_balance}`);
    }
  }

  const walletsRes = await executeTurso("SELECT wallet_id, user_id, balance FROM wallets;");
  console.log("\nTurso Wallets count:", walletsRes.rows.length);
  for (const w of walletsRes.rows) {
    if (Number(w.balance) > 0) {
      console.log(`  - Wallet ${w.wallet_id} (${w.user_id}): balance = ₦${w.balance}`);
    }
  }

  const txRes = await executeTurso("SELECT id, reference, user_id, amount FROM transactions;");
  console.log("\nTurso Transactions count:", txRes.rows.length);
  for (const t of txRes.rows) {
    console.log(`  - Tx ${t.id} (${t.reference}): amount = ₦${t.amount}, user = ${t.user_id}`);
  }
}

inspectTursoData().catch(console.error);
