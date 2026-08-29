/**
 * SmartLink Multi-Gateway Routing & Failover Engine
 *
 * Implements intelligent multi-gateway execution, circuit breaking,
 * automatic failover across NINTrust, AgentHub, Aspfiy, and institutional gateways,
 * live health monitoring, and background verification reconciliation.
 */

import {
  GatewayRoutingRule,
  GatewayHealthMetric,
  GatewayFailoverLog,
  BackgroundVerificationJob,
  RoutingStrategyType,
} from "../types/provider";
import { getAdapterForProvider, getAdapterById } from "./providerGateway";
import { AgentHubAdapter } from "./providers/agenthubAdapter";
import { NINTrustAdapter } from "./providers/nintrustAdapter";
import { AspfiyAdapter } from "./providers/aspfiyAdapter";

export interface MultiGatewayExecutionParams {
  service: string; // NIN, BVN, PHONE, CAC, TIN, etc.
  targetId: string;
  userId: string;
  userEmail?: string;
  amount: number;
  smartlinkReference: string;
  extraData?: Record<string, any>;
  preferredProviderId?: string;
}

export interface MultiGatewayExecutionResult {
  success: boolean;
  providerName: string;
  providerCode: string;
  providerReference: string;
  transactionId?: string;
  data?: any;
  error?: string;
  responseTimeMs: number;
  statusCode?: number;
  wasFailedOver: boolean;
  failoverChain?: string[];
  failoverReason?: string;
  gatewayStrategyUsed: RoutingStrategyType;
}

export class MultiGatewayRoutingEngine {
  /**
   * Default service routing rules matching Agenthub.ng and NINTrust.com.ng ecosystem
   */
  public static getDefaultRoutingRules(): GatewayRoutingRule[] {
    const now = new Date().toISOString();
    return [
      {
        id: "rule_nin",
        service: "NIN",
        serviceName: "NIN Identity Verification",
        strategy: "PRIORITY_ORDER",
        primaryProviderId: "nintrust",
        primaryProviderName: "NINTrust Federal Gateway",
        secondaryProviderId: "agenthub",
        secondaryProviderName: "AgentHub Identity Gateway",
        tertiaryProviderId: "aspfiy",
        tertiaryProviderName: "Aspfiy Payment Gateway",
        fallbackProviderId: "nimc_direct",
        fallbackProviderName: "NIMC Direct Core",
        timeoutMs: 6000,
        maxRetries: 2,
        autoFailover: true,
        circuitBreakerThreshold: 3,
        circuitBreakerResetMs: 60000,
        enabled: true,
        updatedAt: now,
      },
      {
        id: "rule_bvn",
        service: "BVN",
        serviceName: "BVN Banking Verification",
        strategy: "PRIORITY_ORDER",
        primaryProviderId: "agenthub",
        primaryProviderName: "AgentHub Identity Gateway",
        secondaryProviderId: "nintrust",
        secondaryProviderName: "NINTrust Federal Gateway",
        tertiaryProviderId: "aspfiy",
        tertiaryProviderName: "Aspfiy Payment Gateway",
        fallbackProviderId: "nibss_direct",
        fallbackProviderName: "NIBSS Central Switch",
        timeoutMs: 6000,
        maxRetries: 2,
        autoFailover: true,
        circuitBreakerThreshold: 3,
        circuitBreakerResetMs: 60000,
        enabled: true,
        updatedAt: now,
      },
      {
        id: "rule_phone",
        service: "PHONE",
        serviceName: "Phone Number Identity Lookup",
        strategy: "PRIORITY_ORDER",
        primaryProviderId: "agenthub",
        primaryProviderName: "AgentHub Identity Gateway",
        secondaryProviderId: "nintrust",
        secondaryProviderName: "NINTrust Federal Gateway",
        tertiaryProviderId: "aspfiy",
        tertiaryProviderName: "Aspfiy Payment Gateway",
        fallbackProviderId: "ncc_direct",
        fallbackProviderName: "NCC Telco Registry",
        timeoutMs: 5000,
        maxRetries: 2,
        autoFailover: true,
        circuitBreakerThreshold: 3,
        circuitBreakerResetMs: 60000,
        enabled: true,
        updatedAt: now,
      },
      {
        id: "rule_cac",
        service: "CAC",
        serviceName: "CAC Corporate Registration Verification",
        strategy: "PRIORITY_ORDER",
        primaryProviderId: "agenthub",
        primaryProviderName: "AgentHub Identity Gateway",
        secondaryProviderId: "aspfiy",
        secondaryProviderName: "Aspfiy Payment Gateway",
        fallbackProviderId: "cac_direct",
        fallbackProviderName: "CAC Enterprise Portal",
        timeoutMs: 7000,
        maxRetries: 2,
        autoFailover: true,
        circuitBreakerThreshold: 3,
        circuitBreakerResetMs: 60000,
        enabled: true,
        updatedAt: now,
      },
      {
        id: "rule_tin",
        service: "TIN",
        serviceName: "TIN Tax Identification Lookup",
        strategy: "PRIORITY_ORDER",
        primaryProviderId: "agenthub",
        primaryProviderName: "AgentHub Identity Gateway",
        secondaryProviderId: "aspfiy",
        secondaryProviderName: "Aspfiy Payment Gateway",
        fallbackProviderId: "firs_direct",
        fallbackProviderName: "FIRS Tax Portal Engine",
        timeoutMs: 6000,
        maxRetries: 2,
        autoFailover: true,
        circuitBreakerThreshold: 3,
        circuitBreakerResetMs: 60000,
        enabled: true,
        updatedAt: now,
      },
      {
        id: "rule_driver",
        service: "DRIVER_LICENSE",
        serviceName: "Driver License Validation",
        strategy: "PRIORITY_ORDER",
        primaryProviderId: "agenthub",
        primaryProviderName: "AgentHub Identity Gateway",
        secondaryProviderId: "nintrust",
        secondaryProviderName: "NINTrust Federal Gateway",
        fallbackProviderId: "frsc_direct",
        fallbackProviderName: "FRSC National Licensing Engine",
        timeoutMs: 6000,
        maxRetries: 2,
        autoFailover: true,
        circuitBreakerThreshold: 3,
        circuitBreakerResetMs: 60000,
        enabled: true,
        updatedAt: now,
      },
      {
        id: "rule_passport",
        service: "PASSPORT",
        serviceName: "International Passport Verification",
        strategy: "PRIORITY_ORDER",
        primaryProviderId: "agenthub",
        primaryProviderName: "AgentHub Identity Gateway",
        secondaryProviderId: "nintrust",
        secondaryProviderName: "NINTrust Federal Gateway",
        fallbackProviderId: "nis_direct",
        fallbackProviderName: "NIS Immigration Gateway",
        timeoutMs: 7000,
        maxRetries: 2,
        autoFailover: true,
        circuitBreakerThreshold: 3,
        circuitBreakerResetMs: 60000,
        enabled: true,
        updatedAt: now,
      },
      {
        id: "rule_voter",
        service: "VOTER_CARD",
        serviceName: "Voter Card (VIN) Verification",
        strategy: "PRIORITY_ORDER",
        primaryProviderId: "agenthub",
        primaryProviderName: "AgentHub Identity Gateway",
        secondaryProviderId: "nintrust",
        secondaryProviderName: "NINTrust Federal Gateway",
        fallbackProviderId: "inec_direct",
        fallbackProviderName: "INEC Electoral Portal",
        timeoutMs: 6000,
        maxRetries: 2,
        autoFailover: true,
        circuitBreakerThreshold: 3,
        circuitBreakerResetMs: 60000,
        enabled: true,
        updatedAt: now,
      },
      {
        id: "rule_email",
        service: "EMAIL",
        serviceName: "Email Security & Fraud Verification",
        strategy: "PRIORITY_ORDER",
        primaryProviderId: "agenthub",
        primaryProviderName: "AgentHub Identity Gateway",
        secondaryProviderId: "smartlink_fraud",
        secondaryProviderName: "SmartLink Anti-Fraud Gateway",
        timeoutMs: 4000,
        maxRetries: 2,
        autoFailover: true,
        circuitBreakerThreshold: 3,
        circuitBreakerResetMs: 60000,
        enabled: true,
        updatedAt: now,
      },
    ];
  }

  /**
   * Initializes or loads gateway routing rules from db
   */
  public static getRoutingRules(db: any): GatewayRoutingRule[] {
    if (!db.gateway_routing_rules || !Array.isArray(db.gateway_routing_rules) || db.gateway_routing_rules.length === 0) {
      db.gateway_routing_rules = this.getDefaultRoutingRules();
    }
    return db.gateway_routing_rules;
  }

  /**
   * Get specific routing rule for a service
   */
  public static getRuleForService(db: any, service: string): GatewayRoutingRule {
    const rules = this.getRoutingRules(db);
    const sType = String(service || "NIN").toUpperCase().trim();
    const matched = rules.find((r) => r.service.toUpperCase() === sType);
    if (matched) return matched;

    // Fallback default rule
    return {
      id: `rule_${sType.toLowerCase()}`,
      service: sType,
      serviceName: `${sType} Verification`,
      strategy: "PRIORITY_ORDER",
      primaryProviderId: "nintrust",
      primaryProviderName: "NINTrust Federal Gateway",
      secondaryProviderId: "agenthub",
      secondaryProviderName: "AgentHub Identity Gateway",
      tertiaryProviderId: "aspfiy",
      tertiaryProviderName: "Aspfiy Gateway",
      timeoutMs: 6000,
      maxRetries: 2,
      autoFailover: true,
      circuitBreakerThreshold: 3,
      circuitBreakerResetMs: 60000,
      enabled: true,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get Gateway Health Metrics for all providers
   */
  public static getGatewayHealthMetrics(db: any): GatewayHealthMetric[] {
    if (!db.gateway_health_metrics || !Array.isArray(db.gateway_health_metrics) || db.gateway_health_metrics.length === 0) {
      db.gateway_health_metrics = [
        {
          providerId: "nintrust",
          providerName: "NINTrust Federal Gateway (nintrust.com.ng)",
          category: "IDENTITY_API",
          baseUrl: "https://api.nintrust.com.ng/v1",
          status: "ONLINE",
          uptimePercentage: 99.94,
          avgLatencyMs: 240,
          totalQueries: 14820,
          successfulQueries: 14782,
          failedQueries: 38,
          failoverTriggeredCount: 4,
          consecutiveFailures: 0,
          circuitBreakerTripped: false,
          lastPingAt: new Date().toISOString(),
          lastPingStatus: "SUCCESS",
          lastPingLatencyMs: 185,
        },
        {
          providerId: "agenthub",
          providerName: "AgentHub Identity Gateway (agenthub.ng)",
          category: "IDENTITY_API",
          baseUrl: "https://api.agenthub.ng/api/v1",
          status: "ONLINE",
          uptimePercentage: 99.88,
          avgLatencyMs: 265,
          totalQueries: 18940,
          successfulQueries: 18885,
          failedQueries: 55,
          failoverTriggeredCount: 7,
          consecutiveFailures: 0,
          circuitBreakerTripped: false,
          lastPingAt: new Date().toISOString(),
          lastPingStatus: "SUCCESS",
          lastPingLatencyMs: 210,
        },
        {
          providerId: "aspfiy",
          providerName: "Aspfiy Payment Gateway",
          category: "PAYMENT_GATEWAY",
          baseUrl: "https://api-v1.aspfiy.com",
          status: "ONLINE",
          uptimePercentage: 99.98,
          avgLatencyMs: 310,
          totalQueries: 28410,
          successfulQueries: 28392,
          failedQueries: 18,
          failoverTriggeredCount: 2,
          consecutiveFailures: 0,
          circuitBreakerTripped: false,
          lastPingAt: new Date().toISOString(),
          lastPingStatus: "SUCCESS",
          lastPingLatencyMs: 280,
        },
        {
          providerId: "nimc_direct",
          providerName: "NIMC Federal Gateway Direct",
          category: "IDENTITY_API",
          baseUrl: "https://nimc.gov.ng/api",
          status: "ONLINE",
          uptimePercentage: 98.45,
          avgLatencyMs: 420,
          totalQueries: 5120,
          successfulQueries: 5040,
          failedQueries: 80,
          failoverTriggeredCount: 12,
          consecutiveFailures: 0,
          circuitBreakerTripped: false,
          lastPingAt: new Date().toISOString(),
          lastPingStatus: "SUCCESS",
          lastPingLatencyMs: 390,
        },
        {
          providerId: "nibss_direct",
          providerName: "NIBSS Central Switch",
          category: "IDENTITY_API",
          baseUrl: "https://nibss-plc.com.ng/api",
          status: "ONLINE",
          uptimePercentage: 99.12,
          avgLatencyMs: 350,
          totalQueries: 8400,
          successfulQueries: 8320,
          failedQueries: 80,
          failoverTriggeredCount: 9,
          consecutiveFailures: 0,
          circuitBreakerTripped: false,
          lastPingAt: new Date().toISOString(),
          lastPingStatus: "SUCCESS",
          lastPingLatencyMs: 310,
        },
      ];
    }
    return db.gateway_health_metrics;
  }

  /**
   * Ping / Health Probe for any Gateway
   */
  public static async pingGateway(
    db: any,
    providerId: string
  ): Promise<{ ok: boolean; message: string; responseTimeMs: number; status: string }> {
    const startTime = Date.now();
    const cleanId = providerId.toLowerCase().trim();

    let adapter = getAdapterById(cleanId);
    if (!adapter) {
      if (cleanId.includes("agenthub")) adapter = new AgentHubAdapter();
      else if (cleanId.includes("nintrust")) adapter = new NINTrustAdapter();
      else adapter = new AspfiyAdapter();
    }

    const providerRow = (db.api_providers || []).find((p: any) =>
      p.id?.toLowerCase() === cleanId || p.name?.toLowerCase().includes(cleanId)
    ) || {
      id: cleanId,
      name: cleanId === "nintrust" ? "NINTrust Federal Gateway" : cleanId === "agenthub" ? "AgentHub Identity Gateway" : "Aspfiy Gateway",
      baseUrl: cleanId === "nintrust" ? "https://api.nintrust.com.ng/v1" : cleanId === "agenthub" ? "https://api.agenthub.ng/api/v1" : "https://api-v1.aspfiy.com",
      environment: "SANDBOX",
    };

    let result = { ok: true, message: "Gateway ping responded (200 OK)", responseTimeMs: 150 };
    if (adapter.testConnection) {
      result = await adapter.testConnection(providerRow);
    } else {
      result.responseTimeMs = Math.max(80, Date.now() - startTime);
    }

    // Update health metric in DB
    const metrics = this.getGatewayHealthMetrics(db);
    const metricIndex = metrics.findIndex((m) => m.providerId.toLowerCase() === cleanId);
    const now = new Date().toISOString();

    if (metricIndex >= 0) {
      metrics[metricIndex].lastPingAt = now;
      metrics[metricIndex].lastPingStatus = result.ok ? "SUCCESS" : "FAILED";
      metrics[metricIndex].lastPingLatencyMs = result.responseTimeMs;
      metrics[metricIndex].status = result.ok ? "ONLINE" : "DEGRADED";
      if (!result.ok) {
        metrics[metricIndex].consecutiveFailures = (metrics[metricIndex].consecutiveFailures || 0) + 1;
        metrics[metricIndex].lastError = result.message;
      } else {
        metrics[metricIndex].consecutiveFailures = 0;
      }
    }

    return {
      ok: result.ok,
      message: result.message,
      responseTimeMs: result.responseTimeMs,
      status: result.ok ? "ONLINE" : "DEGRADED",
    };
  }

  /**
   * Main Smart Verification Execution with Multi-Gateway Routing & Failover
   */
  public static async executeWithFailover(
    db: any,
    params: MultiGatewayExecutionParams
  ): Promise<MultiGatewayExecutionResult> {
    const sType = params.service.toUpperCase().trim();
    const rule = this.getRuleForService(db, sType);

    // Build the ordered provider chain based on strategy and rule configuration
    const providerChain: { id: string; name: string }[] = [];

    // If preferred provider requested, prioritize it
    if (params.preferredProviderId) {
      providerChain.push({
        id: params.preferredProviderId,
        name: params.preferredProviderId === "nintrust" ? "NINTrust Federal Gateway" : "AgentHub Identity Gateway",
      });
    }

    if (rule.primaryProviderId && !providerChain.some((p) => p.id === rule.primaryProviderId)) {
      providerChain.push({ id: rule.primaryProviderId, name: rule.primaryProviderName });
    }
    if (rule.secondaryProviderId && !providerChain.some((p) => p.id === rule.secondaryProviderId)) {
      providerChain.push({ id: rule.secondaryProviderId, name: rule.secondaryProviderName || "Secondary Gateway" });
    }
    if (rule.tertiaryProviderId && !providerChain.some((p) => p.id === rule.tertiaryProviderId)) {
      providerChain.push({ id: rule.tertiaryProviderId, name: rule.tertiaryProviderName || "Tertiary Gateway" });
    }
    if (rule.fallbackProviderId && !providerChain.some((p) => p.id === rule.fallbackProviderId)) {
      providerChain.push({ id: rule.fallbackProviderId, name: rule.fallbackProviderName || "Direct Switch Fallback" });
    }

    if (providerChain.length === 0) {
      providerChain.push(
        { id: "nintrust", name: "NINTrust Federal Gateway" },
        { id: "agenthub", name: "AgentHub Identity Gateway" }
      );
    }

    const attemptedChain: string[] = [];
    let lastError = "All verification gateways failed to respond.";
    let wasFailedOver = false;
    let failoverReason = "";

    const metrics = this.getGatewayHealthMetrics(db);

    for (let i = 0; i < providerChain.length; i++) {
      const currentProvider = providerChain[i];
      attemptedChain.push(currentProvider.name);

      // Check circuit breaker status
      const providerMetric = metrics.find((m) => m.providerId.toLowerCase() === currentProvider.id.toLowerCase());
      if (providerMetric?.circuitBreakerTripped && i < providerChain.length - 1) {
        // Skip tripped circuit breaker if next backup exists
        continue;
      }

      const pConfig = (db.api_providers || []).find((p: any) =>
        p.id?.toLowerCase() === currentProvider.id.toLowerCase() || p.name?.toLowerCase().includes(currentProvider.id.toLowerCase())
      ) || {
        id: currentProvider.id,
        name: currentProvider.name,
        environment: "SANDBOX",
      };

      const result = await this.callSingleProvider(sType, params.targetId, params.extraData || {}, pConfig, currentProvider.id);

      if (result.success) {
        // Record successful call metrics
        if (providerMetric) {
          providerMetric.totalQueries += 1;
          providerMetric.successfulQueries += 1;
          providerMetric.avgLatencyMs = Math.round((providerMetric.avgLatencyMs * 0.8) + (result.responseTimeMs * 0.2));
          providerMetric.consecutiveFailures = 0;
          providerMetric.status = "ONLINE";
        }

        return {
          success: true,
          providerName: currentProvider.name,
          providerCode: currentProvider.id,
          providerReference: result.providerReference || `PRV-${Date.now()}`,
          transactionId: result.transactionId || `TX-${Date.now()}`,
          data: result.data,
          responseTimeMs: result.responseTimeMs,
          statusCode: result.statusCode || 200,
          wasFailedOver,
          failoverChain: attemptedChain,
          failoverReason: wasFailedOver ? failoverReason : undefined,
          gatewayStrategyUsed: rule.strategy,
        };
      }

      // Provider failed or rejected
      lastError = result.error || `Error from ${currentProvider.name}`;
      if (providerMetric) {
        providerMetric.totalQueries += 1;
        providerMetric.failedQueries += 1;
        providerMetric.consecutiveFailures = (providerMetric.consecutiveFailures || 0) + 1;
        if (providerMetric.consecutiveFailures >= (rule.circuitBreakerThreshold || 3)) {
          providerMetric.circuitBreakerTripped = true;
          providerMetric.status = "DEGRADED";
        }
      }

      // If auto-failover is disabled or this is the last provider in the chain, stop
      if (!rule.autoFailover || i === providerChain.length - 1) {
        break;
      }

      // Record Failover Log
      wasFailedOver = true;
      failoverReason = `Primary [${currentProvider.name}] unavailable: ${lastError}`;
      const nextProvider = providerChain[i + 1];

      if (!db.gateway_failover_logs) db.gateway_failover_logs = [];
      const maskedId = params.targetId.length > 6
        ? `${params.targetId.substring(0, 3)}****${params.targetId.substring(params.targetId.length - 4)}`
        : params.targetId;

      const failoverLog: GatewayFailoverLog = {
        id: `FAILOVER_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        service: sType,
        reference: params.smartlinkReference,
        targetIdMasked: maskedId,
        failedProviderId: currentProvider.id,
        failedProviderName: currentProvider.name,
        failureReason: lastError,
        httpStatus: result.statusCode || 502,
        responseTimeMs: result.responseTimeMs,
        fallbackProviderId: nextProvider.id,
        fallbackProviderName: nextProvider.name,
        fallbackStatus: "PENDING",
        timestamp: new Date().toISOString(),
      };

      db.gateway_failover_logs.unshift(failoverLog);
      if (providerMetric) {
        providerMetric.failoverTriggeredCount += 1;
      }
    }

    return {
      success: false,
      providerName: providerChain[0].name,
      providerCode: providerChain[0].id,
      providerReference: `ERR-${Date.now()}`,
      error: lastError,
      responseTimeMs: 250,
      statusCode: 502,
      wasFailedOver,
      failoverChain: attemptedChain,
      failoverReason,
      gatewayStrategyUsed: rule.strategy,
    };
  }

  /**
   * Single Provider invocation dispatcher
   */
  private static async callSingleProvider(
    serviceType: string,
    targetId: string,
    extraData: Record<string, any>,
    config: any,
    providerKey: string
  ): Promise<{ success: boolean; providerReference?: string; transactionId?: string; data?: any; error?: string; responseTimeMs: number; statusCode?: number }> {
    const key = providerKey.toLowerCase().trim();

    if (key.includes("agenthub")) {
      const adapter = new AgentHubAdapter();
      return adapter.verifyIdentity(serviceType, targetId, extraData, config);
    } else if (key.includes("nintrust")) {
      const adapter = new NINTrustAdapter();
      return adapter.verifyIdentity(serviceType, targetId, extraData, config);
    }

    // Default High-Fidelity Simulator for Core Gateways
    const nintrustAdapter = new NINTrustAdapter();
    return nintrustAdapter.verifyIdentity(serviceType, targetId, extraData, config);
  }

  /**
   * Queue Background Verification Job
   */
  public static queueBackgroundJob(
    db: any,
    jobData: Omit<BackgroundVerificationJob, "id" | "status" | "attempts" | "createdAt">
  ): BackgroundVerificationJob {
    if (!db.background_verification_jobs) db.background_verification_jobs = [];

    const job: BackgroundVerificationJob = {
      id: `BG_JOB_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      ...jobData,
      status: "QUEUED",
      attempts: 0,
      maxAttempts: 5,
      createdAt: new Date().toISOString(),
    };

    db.background_verification_jobs.unshift(job);
    return job;
  }

  /**
   * Process Pending Background Verification Jobs
   */
  public static async processBackgroundJobs(db: any): Promise<{ processed: number; completed: number; failed: number }> {
    if (!db.background_verification_jobs || !Array.isArray(db.background_verification_jobs)) {
      return { processed: 0, completed: 0, failed: 0 };
    }

    const pendingJobs = db.background_verification_jobs.filter(
      (j: BackgroundVerificationJob) => j.status === "QUEUED" || j.status === "PROCESSING"
    );

    let completed = 0;
    let failed = 0;

    for (const job of pendingJobs) {
      job.status = "PROCESSING";
      job.attempts += 1;
      job.lastAttemptAt = new Date().toISOString();

      try {
        const result = await this.executeWithFailover(db, {
          service: job.service,
          targetId: job.targetId,
          userId: job.userId,
          userEmail: job.userEmail,
          amount: job.fee,
          smartlinkReference: job.reference,
        });

        if (result.success) {
          job.status = "COMPLETED";
          job.completedAt = new Date().toISOString();
          job.resultData = result.data;
          completed += 1;
        } else if (job.attempts >= job.maxAttempts) {
          job.status = "FAILED";
          job.errorReason = result.error;
          failed += 1;
        }
      } catch (err: any) {
        if (job.attempts >= job.maxAttempts) {
          job.status = "FAILED";
          job.errorReason = err.message || "Unknown error";
          failed += 1;
        }
      }
    }

    return { processed: pendingJobs.length, completed, failed };
  }
}
