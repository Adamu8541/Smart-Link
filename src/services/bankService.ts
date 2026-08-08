export interface Bank {
  id: string;
  name: string;
  code: string;
  slug: string;
  category: "COMMERCIAL" | "MICROFINANCE" | "PAYMENT_SERVICE";
  status: "ACTIVE" | "MAINTENANCE";
}

// Pre-cached default list of supported Nigerian Banks
export const DEFAULT_NIGERIAN_BANKS: Bank[] = [
  { id: "bank_011", name: "First Bank of Nigeria", code: "011", slug: "first-bank", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_033", name: "United Bank for Africa (UBA)", code: "033", slug: "uba", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_058", name: "Guaranty Trust Bank (GTBank)", code: "058", slug: "gtbank", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_057", name: "Zenith Bank", code: "057", slug: "zenith-bank", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_044", name: "Access Bank", code: "044", slug: "access-bank", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_214", name: "First City Monument Bank (FCMB)", code: "214", slug: "fcmb", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_070", name: "Fidelity Bank", code: "070", slug: "fidelity-bank", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_035", name: "Wema Bank (ALAT)", code: "035", slug: "wema-bank", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_221", name: "Stanbic IBTC Bank", code: "221", slug: "stanbic-ibtc", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_232", name: "Sterling Bank", code: "232", slug: "sterling-bank", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_032", name: "Union Bank of Nigeria", code: "032", slug: "union-bank", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_050", name: "Ecobank Nigeria", code: "050", slug: "ecobank", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_101", name: "Providus Bank", code: "101", slug: "providus-bank", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_076", name: "Polaris Bank", code: "076", slug: "polaris-bank", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_082", name: "Keystone Bank", code: "082", slug: "keystone-bank", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_215", name: "Unity Bank", code: "215", slug: "unity-bank", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_000006", name: "Jaiz Bank", code: "000006", slug: "jaiz-bank", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_000026", name: "Taj Bank", code: "000026", slug: "taj-bank", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_000029", name: "Lotus Bank", code: "000029", slug: "lotus-bank", category: "COMMERCIAL", status: "ACTIVE" },
  { id: "bank_50211", name: "Kuda Microfinance Bank", code: "50211", slug: "kuda-bank", category: "MICROFINANCE", status: "ACTIVE" },
  { id: "bank_999992", name: "OPay Digital Services", code: "999992", slug: "opay", category: "PAYMENT_SERVICE", status: "ACTIVE" },
  { id: "bank_999991", name: "PalmPay Nigeria", code: "999991", slug: "palmpay", category: "PAYMENT_SERVICE", status: "ACTIVE" },
  { id: "bank_50515", name: "Moniepoint Microfinance Bank", code: "50515", slug: "moniepoint", category: "MICROFINANCE", status: "ACTIVE" },
  { id: "bank_566", name: "VFD Microfinance Bank", code: "566", slug: "vfd-bank", category: "MICROFINANCE", status: "ACTIVE" },
  { id: "bank_51318", name: "FairMoney Microfinance Bank", code: "51318", slug: "fairmoney", category: "MICROFINANCE", status: "ACTIVE" },
  { id: "bank_565", name: "Carbon Microfinance Bank", code: "565", slug: "carbon", category: "MICROFINANCE", status: "ACTIVE" },
  { id: "bank_125", name: "Rubies Bank", code: "125", slug: "rubies-bank", category: "MICROFINANCE", status: "ACTIVE" },
];

let bankCacheMemory: Bank[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes cache

export class BankService {
  /**
   * Fetch all supported Nigerian banks, prioritizing live backend endpoint
   * with fallback to memory and localStorage cache.
   */
  static async getSupportedBanks(forceRefresh = false): Promise<Bank[]> {
    const now = Date.now();

    // 1. Check in-memory cache
    if (!forceRefresh && bankCacheMemory && now - lastCacheTime < CACHE_DURATION_MS) {
      return bankCacheMemory;
    }

    // 2. Check LocalStorage cache
    if (!forceRefresh) {
      try {
        const stored = localStorage.getItem("smartlink_banks_cache");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.banks && Array.isArray(parsed.banks) && parsed.timestamp && now - parsed.timestamp < CACHE_DURATION_MS) {
            bankCacheMemory = parsed.banks;
            lastCacheTime = parsed.timestamp;
            return parsed.banks;
          }
        }
      } catch (err) {
        console.warn("Failed to read bank cache from localStorage:", err);
      }
    }

    // 3. Fetch from Backend API
    try {
      const response = await fetch("/api/services/banks");
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.banks) && data.banks.length > 0) {
          bankCacheMemory = data.banks;
          lastCacheTime = now;
          try {
            localStorage.setItem(
              "smartlink_banks_cache",
              JSON.stringify({ banks: data.banks, timestamp: now })
            );
          } catch (e) {
            // localStorage write error ignored
          }
          return data.banks;
        }
      }
    } catch (err) {
      console.warn("API call for banks failed, falling back to default banks list:", err);
    }

    // 4. Fallback to default pre-cached list
    bankCacheMemory = DEFAULT_NIGERIAN_BANKS;
    lastCacheTime = now;
    return DEFAULT_NIGERIAN_BANKS;
  }

  /**
   * Get a single bank object by code
   */
  static async getBankByCode(code: string): Promise<Bank | undefined> {
    const banks = await this.getSupportedBanks();
    return banks.find((b) => b.code === code);
  }

  /**
   * Search banks by name or code or slug
   */
  static searchBanks(banks: Bank[], query: string): Bank[] {
    if (!query || !query.trim()) return banks;
    const clean = query.toLowerCase().trim();
    return banks.filter(
      (b) =>
        b.name.toLowerCase().includes(clean) ||
        b.code.includes(clean) ||
        b.slug.toLowerCase().includes(clean)
    );
  }
}
