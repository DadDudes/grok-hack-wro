import 'server-only';

import type { AgentKey } from '@/lib/flow/types';

export type XaiAgent = AgentKey | 'voice';

export type XaiUsage = {
  agent: XaiAgent;
  endpoint: string;
  model: string;
  latencyMs: number;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  costUsd: number | null;
};

const USD_TICKS_PER_DOLLAR = 10_000_000_000;
const COST_DECIMALS = 6;

export function costFromTicks(ticks: number | null | undefined): number | null {
  if (ticks === null || ticks === undefined) {
    return null;
  }

  return ticks / USD_TICKS_PER_DOLLAR;
}

export function logUsage(usage: XaiUsage): void {
  const line = JSON.stringify(usage);
  console.info(`[xai] ${line}`);
}

function sumCost(calls: XaiUsage[]): number | null {
  let total = 0;

  for (const call of calls) {
    if (call.costUsd === null) {
      return null;
    }
    total += call.costUsd;
  }

  return total;
}

export function formatUsageHeader(calls: XaiUsage[]): string {
  const models = new Set(calls.map((call) => call.model));
  const latencyMs = calls.reduce((total, call) => total + call.latencyMs, 0);
  const inputTokens = calls.reduce((total, call) => total + call.inputTokens, 0);
  const outputTokens = calls.reduce((total, call) => total + call.outputTokens, 0);
  const reasoningTokens = calls.reduce((total, call) => total + call.reasoningTokens, 0);
  const cost = sumCost(calls);
  const costText = cost === null ? 'unknown' : cost.toFixed(COST_DECIMALS);

  const parts = [
    `calls=${calls.length}`,
    `model=${[...models].join(',')}`,
    `latency_ms=${latencyMs}`,
    `input_tokens=${inputTokens}`,
    `output_tokens=${outputTokens}`,
    `reasoning_tokens=${reasoningTokens}`,
    `cost_usd=${costText}`,
  ];

  return parts.join('; ');
}
