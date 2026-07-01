"use client";

import PredictiveSearchBox from "@/components/shared/PredictiveSearchBox";

export default function SearchBar() {
  return (
    <PredictiveSearchBox
      compact
      placeholder="Search officials, boards, counties, agencies, votes, funding, campaigns, and stories..."
      showVoice={false}
      sourceSurface="shared_search_bar"
    />
  );
}
