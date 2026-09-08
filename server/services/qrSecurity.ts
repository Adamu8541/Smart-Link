import crypto from "crypto";

const QR_SIGNING_SECRET = process.env.QR_SIGNING_SECRET || "smartlink_secure_qr_signing_key_2026_internal_fallback";

export interface QRPayload {
  nin: string;
  firstName: string;
  surname: string;
  middleName?: string;
  dob: string;
}

export function signQRPayload(data: QRPayload): string {
  const payload = {
    nin: data.nin,
    fn: data.firstName,
    sn: data.surname,
    mn: data.middleName || "",
    dob: data.dob,
  };

  // Canonical string for signing
  const rawString = `${payload.nin}|${payload.fn}|${payload.sn}|${payload.mn}|${payload.dob}`;
  
  const hmac = crypto.createHmac("sha256", QR_SIGNING_SECRET);
  hmac.update(rawString);
  const signature = hmac.digest("hex").substring(0, 32); // Take first 32 chars for brevity

  return JSON.stringify({
    ...payload,
    sig: signature
  });
}

export function verifyQRPayload(jsonStr: string): { valid: boolean; data?: QRPayload } {
  try {
    const payload = JSON.parse(jsonStr);
    const { nin, fn, sn, mn, dob, sig } = payload;
    
    if (!nin || !fn || !sn || !dob || !sig) return { valid: false };

    const rawString = `${nin}|${fn}|${sn}|${mn || ""}|${dob}`;
    const hmac = crypto.createHmac("sha256", QR_SIGNING_SECRET);
    hmac.update(rawString);
    const expectedSig = hmac.digest("hex").substring(0, 32);

    if (sig === expectedSig) {
      return {
        valid: true,
        data: {
          nin,
          firstName: fn,
          surname: sn,
          middleName: mn,
          dob
        }
      };
    }
    return { valid: false };
  } catch (e) {
    return { valid: false };
  }
}
