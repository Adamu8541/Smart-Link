/**
 * SmartLink Live Data Plans Engine
 * Dynamically fetches active wholesale Data Bundles from the designated active provider route (ClubKonnect or Bigisub)
 * Computes exact administrative profit margins:
 * - Bundles < 1GB: ₦15 profit margin
 * - Bundles >= 1GB: ₦30 profit margin
 * Standardizes plan volumes, validities (Daily, Weekly, Monthly), and plan types (SME, Corporate, Gifting, Direct).
 */

import { ProviderExecutor } from "../../src/services/providerExecutor";

export function isDataPlanUnder1GB(str?: string, sizeVal?: number, volumeUnit?: string): boolean {
  if (sizeVal !== undefined && sizeVal !== null && volumeUnit) {
    const unit = String(volumeUnit).toUpperCase().trim();
    const num = Number(sizeVal) || 0;
    if (unit.includes("TB") || unit.includes("GB")) return num < 1.0;
    if (unit.includes("MB")) return num < 1000;
    if (unit.includes("KB")) return true;
  }
  const s = String(str || "");
  const match = s.match(/(\d+(?:\.\d+)?)\s*(TB|GB|MB|KB)/i);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === "TB" || unit === "GB") return val < 1.0;
    if (unit === "MB") return val < 1000;
    if (unit === "KB") return true;
  }
  return false;
}

export function extractDataPlanValidity(name?: string, rawValidity?: string): string {
  if (rawValidity && rawValidity.trim()) {
    const clean = rawValidity.trim();
    if (/^\d+\s*day/i.test(clean) || /^\d+\s*month/i.test(clean) || /^\d+\s*week/i.test(clean)) {
      return clean;
    }
  }
  const lower = String(name || "").toLowerCase();
  const dayMatch = lower.match(/(\d+)\s*(?:days?|day)/);
  if (dayMatch) return `${dayMatch[1]} Day${dayMatch[1] === "1" ? "" : "s"}`;
  const monthMatch = lower.match(/(\d+)\s*(?:months?|month)/);
  if (monthMatch) return `${parseInt(monthMatch[1]) * 30} Days`;
  if (lower.includes("daily") || lower.includes("24hr") || lower.includes("24 hr")) return "1 Day";
  if (lower.includes("weekly") || lower.includes("7 days") || lower.includes("7-day")) return "7 Days";
  if (lower.includes("monthly") || lower.includes("30 days") || lower.includes("30-day")) return "30 Days";
  if (lower.includes("2-day") || lower.includes("2 day")) return "2 Days";
  if (lower.includes("3-day") || lower.includes("3 day")) return "3 Days";
  if (lower.includes("14-day") || lower.includes("14 day") || lower.includes("2 week")) return "14 Days";
  return "30 Days";
}

export function extractDataPlanVolume(name?: string, sizeVal?: number, volumeUnit?: string): string {
  if (sizeVal !== undefined && sizeVal !== null && volumeUnit) {
    return `${sizeVal}${volumeUnit}`;
  }
  const s = String(name || "");
  const match = s.match(/(\d+(?:\.\d+)?)\s*(TB|GB|MB|KB)/i);
  if (match) return `${match[1]}${match[2].toUpperCase()}`;
  return "";
}

let cachedClubkonnectDataPlans: any[] = [];
let lastClubkonnectDataPlansFetchTime = 0;

let cachedBigisubDataPlans: any[] = [];
let lastBigisubDataPlansFetchTime = 0;

export async function fetchLiveClubkonnectDataPlans(db?: any): Promise<any[]> {
  const now = Date.now();
  if (cachedClubkonnectDataPlans.length > 0 && (now - lastClubkonnectDataPlansFetchTime) < 300000) {
    return cachedClubkonnectDataPlans;
  }

  try {
    const provs = (db?.api_providers || db?.apiProviders || []);
    const prov = provs.find(
      (p: any) => p && (p.id === "prov_clubkonnect" || (p.name || "").toLowerCase().includes("clubkonnect"))
    );
    const baseUrl = (prov?.baseUrl || process.env.CLUBKONNECT_BASE_URL || "https://nellobytesystems.com").replace(/\/+$/, "");

    const fetchRes = await fetch(`${baseUrl}/APIDatabundlePlansV1.asp`);
    if (fetchRes.ok) {
      const json = await fetchRes.json();
      const mobileNetwork = json?.MOBILE_NETWORK;
      if (mobileNetwork && typeof mobileNetwork === "object") {
        const netMap: Record<string, string> = {
          MTN: "MTN",
          Glo: "GLO",
          GLO: "GLO",
          m_9mobile: "9MOBILE",
          "9mobile": "9MOBILE",
          Airtel: "AIRTEL",
          AIRTEL: "AIRTEL",
        };

        const allPlans: any[] = [];
        for (const [netKey, netVal] of Object.entries(mobileNetwork)) {
          const providerCode = netMap[netKey] || String(netKey).toUpperCase().trim();
          const outer = Array.isArray(netVal) ? netVal : [netVal];
          for (const item of outer) {
            const products: any[] = Array.isArray(item?.PRODUCT)
              ? item.PRODUCT
              : (item && item.PRODUCT_NAME ? [item] : []);

            for (const p of products) {
              const baseCost = Number(p.PRODUCT_AMOUNT) || 0;
              const isUnder1GB = isDataPlanUnder1GB(p.PRODUCT_NAME);
              // Profit margin: 15 naira for < 1GB, 30 naira for >= 1GB
              const profitMargin = isUnder1GB ? 15.0 : 30.0;
              const retailPrice = Math.round((baseCost + profitMargin) * 100) / 100;

              let dType = String(p.DATA_TYPE || "DIRECT").toUpperCase().trim();
              if (dType.includes("SME")) dType = "SME";
              else if (dType.includes("CG") || dType.includes("CORP")) dType = "CORPORATE";
              else if (dType.includes("GIFT")) dType = "GIFTING";
              else dType = "DIRECT";

              const validityStr = extractDataPlanValidity(p.PRODUCT_NAME);
              const dataVolume = extractDataPlanVolume(p.PRODUCT_NAME);

              allPlans.push({
                id: `ck_${providerCode}_${p.PRODUCT_ID}`,
                planCode: String(p.PRODUCT_ID),
                providerPlanId: String(p.PRODUCT_ID),
                providerCode,
                planName: `${providerCode} ${p.PRODUCT_NAME}`,
                dataType: dType,
                dataVolume: dataVolume || "1GB",
                validity: validityStr,
                amount: retailPrice,
                baseCost,
                profitMargin,
                activeProvider: "prov_clubkonnect",
                category: "DATA",
              });
            }
          }
        }

        if (allPlans.length > 0) {
          cachedClubkonnectDataPlans = allPlans;
          lastClubkonnectDataPlansFetchTime = now;
          return allPlans;
        }
      }
    }
  } catch (err: any) {
    console.error("[ClubKonnect Plans Engine] Error fetching live plans:", err?.message || err);
  }

  return cachedClubkonnectDataPlans;
}

export async function fetchLiveBigisubDataPlans(db?: any): Promise<any[]> {
  const now = Date.now();
  if (cachedBigisubDataPlans.length > 0 && (now - lastBigisubDataPlansFetchTime) < 300000) {
    return cachedBigisubDataPlans;
  }

  try {
    const provs = (db?.api_providers || db?.apiProviders || []);
    const prov = provs.find(
      (p: any) => p && (p.id === "prov_bigisub" || (p.name || "").toLowerCase().includes("bigisub"))
    );
    const apiToken = (process.env.BIGISUB_API_TOKEN || prov?.apiToken || prov?.apiKey || prov?.secretKey || "").trim();
    const baseUrl = (prov?.baseUrl || "https://bigisub.ng/api/v2").replace(/\/+$/, "");

    const fetchRes = await fetch(`${baseUrl}/vtu/data/plans/`, {
      headers: { "Authorization": `Token ${apiToken}` },
    });

    if (fetchRes.ok) {
      const json = await fetchRes.json();
      const rawList = Array.isArray(json) ? json : (json.data || json.results || json.plans || []);
      if (Array.isArray(rawList) && rawList.length > 0) {
        const formatted = rawList.map((p: any) => {
          const netUpper = String(p.network_name || "MTN").toUpperCase().trim();
          const baseCost = Number(p.amount || p.plan_amount || 0);
          const isUnder1GB = isDataPlanUnder1GB(undefined, p.size, p.plan_volume);
          // Profit margin: 15 naira for < 1GB, 30 naira for >= 1GB
          const profitMargin = isUnder1GB ? 15.0 : 30.0;
          const retailPrice = Math.round((baseCost + profitMargin) * 100) / 100;

          let dType = String(p.plantype || "DIRECT").toUpperCase().trim();
          if (dType.includes("CG") || dType.includes("CORPORATE")) dType = "CORPORATE";
          else if (dType.includes("SME")) dType = "SME";
          else if (dType.includes("GIFT")) dType = "GIFTING";
          else dType = "DIRECT";

          const sizeStr = `${p.size}${p.plan_volume || "MB"}`;
          const validityStr = extractDataPlanValidity(undefined, p.validity);

          return {
            id: String(p.id),
            providerCode: netUpper,
            planCode: String(p.id),
            providerPlanId: String(p.id),
            planName: `${netUpper} ${sizeStr} ${p.plantype || ""} (${validityStr})`,
            dataType: dType,
            dataVolume: sizeStr,
            validity: validityStr,
            amount: retailPrice,
            baseCost,
            profitMargin,
            activeProvider: "prov_bigisub",
            category: "DATA",
          };
        });

        cachedBigisubDataPlans = formatted;
        lastBigisubDataPlansFetchTime = now;
        return formatted;
      }
    }
  } catch (err: any) {
    console.error("[Bigisub Plans Engine] Error fetching live plans:", err?.message || err);
  }

  return cachedBigisubDataPlans;
}

export async function fetchLiveDataPlans(db: any): Promise<any[]> {
  const activeProv = ProviderExecutor.getActiveProviderForCategory(db, "DATA");
  const isClubkonnect = activeProv && (activeProv.id === "prov_clubkonnect" || (activeProv.name || "").toLowerCase().includes("clubkonnect"));

  if (isClubkonnect) {
    const ckPlans = await fetchLiveClubkonnectDataPlans(db);
    if (ckPlans && ckPlans.length > 0) return ckPlans;
  }
  return await fetchLiveBigisubDataPlans(db);
}

export async function getLiveDataPlanById(db: any, planIdOrCode: string): Promise<any | null> {
  const allPlans = await fetchLiveDataPlans(db);
  const clean = String(planIdOrCode || "").trim().toLowerCase();
  const cleanStripped = clean.replace(/^ck_[a-z0-9]+_/i, "");

  const matched = allPlans.find((p: any) => {
    if (!p) return false;
    const pId = String(p.id || "").toLowerCase();
    const pCode = String(p.planCode || "").toLowerCase();
    const pProvId = String(p.providerPlanId || "").toLowerCase();
    return pId === clean || pCode === clean || pProvId === clean || pCode === cleanStripped || pProvId === cleanStripped;
  });

  return matched || null;
}

export function clearDataPlansCache(): void {
  cachedClubkonnectDataPlans = [];
  lastClubkonnectDataPlansFetchTime = 0;
  cachedBigisubDataPlans = [];
  lastBigisubDataPlansFetchTime = 0;
}
