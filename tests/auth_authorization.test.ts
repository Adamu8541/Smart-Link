import { 
  verifySessionToken, 
  verifyUserOrAdminSession, 
  extractAuthToken, 
  requireAuth, 
  requireAdmin, 
  requireSuperAdmin, 
  requireRole, 
  requirePermission 
} from "../server/middleware/auth";
import { readDB } from "../server/db";

function mockResponse() {
  const res: any = {};
  res.statusCode = 200;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.body = data;
    return res;
  };
  return res;
}

async function runTests() {
  console.log("=== PHASE 4: BACKEND AUTHORIZATION & IDOR TEST SUITE ===\n");
  const db = readDB();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}${detail ? ` - ${detail}` : ""}`);
      failed++;
    }
  }

  // 1. Missing / Empty Token Test
  const nullTokenSession = await verifySessionToken("");
  assert(nullTokenSession === null, "Empty token returns null session");

  const unauthReq: any = { headers: {}, query: {}, body: {} };
  const extracted = extractAuthToken(unauthReq);
  assert(extracted === null, "Extract auth token from empty request returns null");

  const unauthOwnership = await verifyUserOrAdminSession(unauthReq, "user_alice", db);
  assert(unauthOwnership.authorized === false, "Unauthenticated request to user resource is rejected");
  assert(unauthOwnership.isAdmin === false, "Unauthenticated request has isAdmin = false");

  // 2. Tampered / Invalid JWT Token Test
  const invalidSession = await verifySessionToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature");
  assert(invalidSession === null, "Invalid/tampered JWT token fails verification and returns null");

  // 3. IDOR Protection: Spoofed request body with manipulated role & permissions
  const spoofedRoleReq: any = {
    headers: {},
    query: {},
    body: {
      userId: "user_victim",
      role: "SUPER_ADMIN",
      isAdmin: true,
      permissions: ["*"],
      authenticated: true
    }
  };
  const spoofedCheck = await verifyUserOrAdminSession(spoofedRoleReq, "user_victim", db);
  assert(spoofedCheck.authorized === false, "Client cannot elevate privilege or bypass auth by injecting role/isAdmin in body");
  assert(spoofedCheck.isAdmin === false, "Spoofed admin flag is completely ignored");

  // 4. IDOR Protection: Wrong target resource
  const spoofedOtherUserReq: any = {
    headers: {},
    query: {},
    body: {
      userId: "user_attacker"
    }
  };
  const idorCheck = await verifyUserOrAdminSession(spoofedOtherUserReq, "user_victim_secret_id", db);
  assert(idorCheck.authorized === false, "Unauthenticated cross-user resource request is strictly blocked");

  // 5. Header extraction tests
  const bearerReq: any = {
    headers: { authorization: "Bearer test_supabase_token_val" }
  };
  assert(extractAuthToken(bearerReq) === "test_supabase_token_val", "Bearer authorization header parsed correctly");

  const adminHeaderReq: any = {
    headers: { "x-admin-token": "test_admin_token_val" }
  };
  assert(extractAuthToken(adminHeaderReq) === "test_admin_token_val", "x-admin-token header parsed correctly");

  // 6. Middleware: requireAuth on unauthenticated request
  const res1 = mockResponse();
  let nextCalled1 = false;
  await requireAuth(unauthReq, res1, () => { nextCalled1 = true; });
  assert(res1.statusCode === 401 && !nextCalled1, "requireAuth blocks unauthenticated request with 401");

  // 7. Middleware: requireAdmin on unauthenticated request
  const res2 = mockResponse();
  let nextCalled2 = false;
  await requireAdmin(unauthReq, res2, () => { nextCalled2 = true; });
  assert(res2.statusCode === 401 && !nextCalled2, "requireAdmin blocks unauthenticated request with 401");

  // 8. Middleware: requireSuperAdmin on unauthenticated request
  const res3 = mockResponse();
  let nextCalled3 = false;
  await requireSuperAdmin(unauthReq, res3, () => { nextCalled3 = true; });
  assert(res3.statusCode === 401 && !nextCalled3, "requireSuperAdmin blocks unauthenticated request with 401");

  // 9. Middleware: requireRole on unauthenticated request
  const res4 = mockResponse();
  let nextCalled4 = false;
  const roleMw = requireRole(["FINANCE_MANAGER"]);
  await roleMw(unauthReq, res4, () => { nextCalled4 = true; });
  assert(res4.statusCode === 401 && !nextCalled4, "requireRole blocks unauthenticated request with 401");

  // 10. Middleware: requirePermission on unauthenticated request
  const res5 = mockResponse();
  let nextCalled5 = false;
  const permMw = requirePermission("MANAGE_SETTINGS");
  await permMw(unauthReq, res5, () => { nextCalled5 = true; });
  assert(res5.statusCode === 401 && !nextCalled5, "requirePermission blocks unauthenticated request with 401");

  console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
