"use client";

import PredictiveSearchBox from "@/components/shared/PredictiveSearchBox";

type FarettaSearchBoxProps = {
  compact?: boolean;
  defaultQuery?: string;
  placeholder?: string;
};

export default function FarettaSearchBox({
  compact = false,
  defaultQuery = "",
  placeholder = "Search an official, board, county, agency, story, issue, vote, funder, campaign, or record...",
}: FarettaSearchBoxProps) {
  return (
    <PredictiveSearchBox
      compact={compact}
      defaultQuery={defaultQuery}
      placeholder={placeholder}
      showVoice
      sourceSurface="faretta_search_box"
    />
  );
}
