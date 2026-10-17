/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Web Model Context Protocol (WebMCP) Implementation
 * W3C Web Machine Learning Community Group Standard (Google & Microsoft)
 * Chrome Canary 146+ / Lighthouse Agentic Browsing Specification
 * 
 * Exposes website tools and capabilities directly to AI agents, assistive
 * technology, and agentic browsers (OpenAI Operator, Claude Computer Use,
 * Google Gemini Agent, Perplexity, etc.)
 */

export interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  handler?: (params: any) => Promise<any> | any;
}

export interface WebMCPContext {
  siteName: string;
  version: string;
  canonicalUrl: string;
  description: string;
  knowledgeBase: string;
  tools: WebMCPTool[];
}

export class WebMCPService {
  private static instance: WebMCPService | null = null;
  private tools: Map<string, WebMCPTool> = new Map();
  private isInitialized = false;

  private constructor() {
    this.registerDefaultTools();
  }

  public static getInstance(): WebMCPService {
    if (!WebMCPService.instance) {
      WebMCPService.instance = new WebMCPService();
    }
    return WebMCPService.instance;
  }

  private registerDefaultTools() {
    this.registerTool({
      name: "explore_services",
      description: "List all 25+ digital identity verification, business registration, and utility services with current fees and SLAs.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["all", "verification", "bills", "corporate", "api"],
            description: "Optional category filter"
          }
        }
      },
      handler: async (params?: { category?: string }) => {
        return {
          success: true,
          platform: "SmartLink NG",
          category: params?.category || "all",
          services: [
            { id: "nin-slip", name: "NIN Verification & Slip Printing", fee: "₦350", turnaround: "Instant (< 5s)" },
            { id: "bvn-verify", name: "BVN Verification & Plastic Card", fee: "₦250", turnaround: "Instant (< 3s)" },
            { id: "cac-business", name: "CAC Business Name Registration", fee: "₦18,500", turnaround: "48-72 Hours" },
            { id: "electricity-disco", name: "Electricity Prepaid Meter Token", fee: "₦0 Extra Fee", turnaround: "Instant STS Token" },
            { id: "sme-data", name: "SME Mobile Data Bundles (MTN, Glo, Airtel, 9mobile)", fee: "From ₦240/GB", turnaround: "Instant" },
            { id: "vtu-airtime", name: "VTU Airtime Recharge", fee: "Up to 4% Discount", turnaround: "Instant" },
            { id: "waec-pin", name: "WAEC Result Checker PIN", fee: "₦3,800", turnaround: "Instant" },
            { id: "neco-token", name: "NECO Result Token", fee: "₦1,200", turnaround: "Instant" }
          ]
        };
      }
    });

    this.registerTool({
      name: "verify_identity",
      description: "Perform identity verification for Nigerian NIN (11 digits), vNIN (16 chars), or BVN (11 digits).",
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["nin", "bvn", "vnin"],
            description: "Type of identity record"
          },
          identifier: {
            type: "string",
            description: "Target number"
          }
        },
        required: ["type", "identifier"]
      },
      handler: async (params: { type: string; identifier: string }) => {
        return {
          success: true,
          action: "verification_routed",
          type: params.type,
          status: "ready_for_auth_or_execution",
          redirectUrl: `https://smartlinkng.com.ng/verification?type=${encodeURIComponent(params.type)}`,
          message: `To complete ${params.type.toUpperCase()} lookup securely, provide wallet balance or API authentication.`
        };
      }
    });

    this.registerTool({
      name: "verify_electricity_meter",
      description: "Verify customer name and address for a Nigerian electricity prepaid or postpaid meter number before payment.",
      inputSchema: {
        type: "object",
        properties: {
          disco: {
            type: "string",
            enum: ["ikeja-electric", "eko-electric", "abuja-electric", "ibadan-electric", "enugu-electric", "kano-electric", "port-harcourt-electric", "jos-electric", "kaduna-electric", "benin-electric", "yola-electric", "aba-electric"],
            description: "Distribution company code"
          },
          meterNumber: {
            type: "string",
            description: "10 to 13-digit meter number"
          },
          meterType: {
            type: "string",
            enum: ["prepaid", "postpaid"],
            description: "Type of meter"
          }
        },
        required: ["disco", "meterNumber", "meterType"]
      },
      handler: async (params: { disco: string; meterNumber: string; meterType: string }) => {
        return {
          success: true,
          disco: params.disco,
          meterNumber: params.meterNumber,
          meterType: params.meterType,
          verifyUrl: "https://smartlinkng.com.ng/bills?tab=electricity"
        };
      }
    });

    this.registerTool({
      name: "purchase_data_bundle",
      description: "Purchase cheap SME data bundle on MTN, Airtel, Glo, or 9mobile in Nigeria.",
      inputSchema: {
        type: "object",
        properties: {
          network: {
            type: "string",
            enum: ["mtn", "airtel", "glo", "9mobile"],
            description: "Network provider"
          },
          planId: {
            type: "string",
            description: "Plan identifier or bundle size"
          },
          phone: {
            type: "string",
            description: "11-digit Nigerian recipient mobile number"
          }
        },
        required: ["network", "planId", "phone"]
      },
      handler: async (params: { network: string; planId: string; phone: string }) => {
        return {
          success: true,
          network: params.network,
          planId: params.planId,
          phone: params.phone,
          portalUrl: "https://smartlinkng.com.ng/bills?tab=data"
        };
      }
    });

    this.registerTool({
      name: "get_platform_info",
      description: "Retrieve official legal identity, NDPA compliance, SLA uptime, and contact information for SmartLink NG.",
      inputSchema: {
        type: "object",
        properties: {}
      },
      handler: async () => {
        return {
          platformName: "Smart Link NG",
          entity: "Smart Link Computer Business Solutions Ltd (RC: 1849204)",
          compliance: "NDPA 2023 Compliant, CAC Accredited Filing Agent",
          sla: "99.98% High Availability Uptime",
          supportEmail: "support@smartlinkng.com.ng",
          supportPhone: "+234 808 549 0982",
          whatsapp: "+234 904 773 8212",
          apiDocumentation: "https://smartlinkng.com.ng/api-docs",
          llmKnowledgeBase: "https://smartlinkng.com.ng/llms.txt"
        };
      }
    });
  }

  public registerTool(tool: WebMCPTool) {
    this.tools.set(tool.name, tool);
  }

  public getTools(): WebMCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Initializes both Imperative WebMCP API and Declarative DOM hooks
   */
  public initialize() {
    if (this.isInitialized || typeof window === "undefined") return;
    this.isInitialized = true;

    const toolsList = this.getTools().map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }));

    const contextObject: WebMCPContext = {
      siteName: "SmartLink NG",
      version: "1.0.0",
      canonicalUrl: "https://smartlinkng.com.ng",
      description: "Nigeria's all-in-one digital portal for identity verification, CAC registration, and automated utility vending.",
      knowledgeBase: "https://smartlinkng.com.ng/llms.txt",
      tools: this.getTools()
    };

    // 1. Browser Native / Polyfill API: document.modelContext
    const provideContext = (options?: any) => {
      return {
        ...contextObject,
        ...options,
        executeTool: async (toolName: string, params: any) => {
          const tool = this.tools.get(toolName);
          if (!tool) {
            throw new Error(`WebMCP Tool "${toolName}" not found on SmartLink NG.`);
          }
          if (tool.handler) {
            return await tool.handler(params);
          }
          return { success: true, tool: toolName, params };
        }
      };
    };

    // Attach to document.modelContext
    try {
      if (!(document as any).modelContext) {
        (document as any).modelContext = {
          provideContext,
          getTools: () => toolsList,
          executeTool: (toolName: string, params: any) => provideContext().executeTool(toolName, params)
        };
      }
    } catch {
      // Ignored in strict DOM read-only modes
    }

    // Attach to navigator.modelContext
    try {
      if (!(navigator as any).modelContext) {
        (navigator as any).modelContext = (document as any).modelContext;
      }
    } catch {
      // Ignored
    }

    // Attach to window.modelContext / window.__WEBMCP__
    (window as any).modelContext = (document as any).modelContext;
    (window as any).__WEBMCP__ = {
      version: "1.0.0",
      specification: "W3C Web Machine Learning CG - WebMCP",
      tools: toolsList,
      provideContext
    };

    // 2. Event Listener for Agentic Browsers via Window PostMessage / CustomEvents
    window.addEventListener("webmcp:query", async (event: any) => {
      const { toolName, params, requestId } = event.detail || {};
      try {
        const result = await (document as any).modelContext.executeTool(toolName, params);
        window.dispatchEvent(new CustomEvent("webmcp:response", {
          detail: { requestId, success: true, result }
        }));
      } catch (err: any) {
        window.dispatchEvent(new CustomEvent("webmcp:response", {
          detail: { requestId, success: false, error: err?.message || String(err) }
        }));
      }
    });

    // 3. Mark the document root with Agent-Ready attribute
    document.documentElement.setAttribute("data-webmcp-ready", "true");
    document.documentElement.setAttribute("data-agentic-browsing", "v1");
  }
}

// Auto-initialize singleton when loaded in browser
if (typeof window !== "undefined") {
  WebMCPService.getInstance().initialize();
}
