"use client";

import { useEffect } from "react";
import { trackRepWatchrEvent } from "@/lib/client-analytics";

export default function MoneyTrailAnalytics({
  entityId,
  entityType,
  recordCount,
  sourceCount,
}: {
  entityId: string;
  entityType: string;
  recordCount: number;
  sourceCount: number;
}) {
  useEffect(() => {
    trackRepWatchrEvent("finance_section_open", {
      entityId,
      entityType,
      recordCount,
      sourceCount,
    });
  }, [entityId, entityType, recordCount, sourceCount]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const source = target.closest("[data-finance-source]");
      if (source instanceof HTMLElement) {
        trackRepWatchrEvent("finance_source_clicked", {
          entityId,
          entityType,
          label: source.dataset.financeSource || "",
        });
      }
      const record = target.closest("[data-finance-record]");
      if (record instanceof HTMLElement) {
        trackRepWatchrEvent("finance_record_clicked", {
          entityId,
          entityType,
          recordType: record.dataset.financeRecord || "",
        });
      }
      const gap = target.closest("[data-finance-gap]");
      if (gap instanceof HTMLElement) {
        trackRepWatchrEvent("finance_gap_submit_clicked", {
          entityId,
          entityType,
          gap: gap.dataset.financeGap || "",
        });
      }
      const filter = target.closest("[data-finance-filter]");
      if (filter instanceof HTMLElement) {
        trackRepWatchrEvent("finance_filter_used", {
          entityId,
          entityType,
          filter: filter.dataset.financeFilter || "",
        });
      }
      const packageLink = target.closest("[data-money-package]");
      if (packageLink instanceof HTMLElement) {
        trackRepWatchrEvent("money_package_interest_clicked", {
          entityId,
          entityType,
          package: packageLink.dataset.moneyPackage || "",
        });
      }
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [entityId, entityType]);

  return null;
}
