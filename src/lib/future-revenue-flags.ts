import {
  FUTURE_REVENUE_MASTER_FLAG,
  getFutureRevenuePackages,
  type FutureRevenuePackage,
} from "@/data/future-revenue";

function envFlagName(flagKey: string) {
  return `REPWATCHR_${flagKey.toUpperCase()}_ENABLED`;
}

function isTruthy(value: string | undefined) {
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function isFutureRevenueMasterEnabled() {
  return isTruthy(process.env.REPWATCHR_FUTURE_REVENUE_ENABLED);
}

export function isFutureRevenuePackageEnabled(packageItem: FutureRevenuePackage) {
  if (!isFutureRevenueMasterEnabled()) return false;
  return isTruthy(process.env[envFlagName(packageItem.flagKey)]);
}

export function getFutureRevenueRegistry() {
  return getFutureRevenuePackages().map((packageItem) => ({
    ...packageItem,
    enabled: isFutureRevenuePackageEnabled(packageItem),
    masterEnabled: isFutureRevenueMasterEnabled(),
    envFlag: envFlagName(packageItem.flagKey),
  }));
}

export function getFutureRevenueFlagStatus() {
  const registry = getFutureRevenueRegistry();
  return {
    masterFlag: FUTURE_REVENUE_MASTER_FLAG,
    masterEnv: "REPWATCHR_FUTURE_REVENUE_ENABLED",
    masterEnabled: isFutureRevenueMasterEnabled(),
    totalPackages: registry.length,
    enabledPackages: registry.filter((item) => item.enabled).length,
    hiddenPackages: registry.filter((item) => !item.enabled).length,
    registry,
  };
}
