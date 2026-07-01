export type NextActionType =
  | "search_related"
  | "watch_entity"
  | "submit_source"
  | "build_packet"
  | "request_correction"
  | "compare_officials"
  | "view_votes"
  | "view_funding"
  | "view_timeline"
  | "open_related_story"
  | "open_related_race"
  | "create_account"
  | "join_digest"
  | "package_interest"
  | "admin_review";

export type NextActionContext = {
  routeType?: string;
  route?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  loggedIn?: boolean;
  watched?: boolean;
  sourceCount?: number;
  profileCompleteness?: number;
  pageDepth?: number;
  referrer?: string;
  recentActions?: string[];
  missingData?: string[];
  packageInterestSignals?: string[];
  isAdmin?: boolean;
};

export type NextAction = {
  type: NextActionType;
  label: string;
  detail: string;
  href: string;
  priority: number;
  tone: "red" | "blue" | "gold" | "dark" | "green";
};

function inferRouteType(route = "/") {
  if (route === "/") return "homepage";
  if (route.startsWith("/search")) return "search";
  if (route.startsWith("/officials/")) return "profile";
  if (route.startsWith("/news/") || route.startsWith("/blog")) return "story";
  if (route.startsWith("/sources")) return "source";
  if (route.startsWith("/elections")) return "race";
  if (route.startsWith("/dashboard")) return "dashboard";
  if (route.startsWith("/admin")) return "admin";
  if (route.startsWith("/votes")) return "votes";
  if (route.startsWith("/funding")) return "funding";
  if (route.startsWith("/school-boards")) return "school_board";
  if (route.startsWith("/services") || route.startsWith("/beta-access")) return "package";
  return "general";
}

function withParams(path: string, params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function dedupe(actions: NextAction[]) {
  const seen = new Set<string>();
  return actions
    .sort((a, b) => b.priority - a.priority)
    .filter((action) => {
      const key = `${action.type}:${action.href}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

export function getNextActions(context: NextActionContext = {}): NextAction[] {
  const route = context.route ?? "/";
  const routeType = context.routeType ?? inferRouteType(route);
  const entityType = context.entityType ?? (routeType === "profile" ? "official" : undefined);
  const entityId = context.entityId;
  const entityName = context.entityName;
  const targetParams = {
    targetType: entityType,
    targetId: entityId,
    targetName: entityName,
  };

  const watchHref = withParams("/dashboard/watchlists", {
    entityType,
    entityId,
    label: entityName,
  });
  const sourceHref = withParams("/sources/submit", targetParams);
  const packetHref = withParams("/services/free-source-packet", targetParams);
  const correctionHref = withParams("/sources/submit", {
    form: "correction_request",
    ...targetParams,
  });

  if (routeType === "homepage") {
    return dedupe([
      { type: "search_related", label: "Search", detail: "Find an official, race, school board, vote, or source.", href: "/search", priority: 100, tone: "red" },
      { type: "submit_source", label: "Submit source", detail: "Send one public URL into the review queue.", href: "/submit-source", priority: 90, tone: "gold" },
      { type: "build_packet", label: "Build packet", detail: "Turn one public record into a copyable packet.", href: "/free-packet", priority: 80, tone: "blue" },
      { type: "watch_entity", label: "Watch Texas", detail: "Start a state watchlist for public records and races.", href: "/dashboard/watchlists?entityType=state&entityId=TX&label=Texas", priority: 70, tone: "dark" },
    ]);
  }

  if (routeType === "search") {
    return dedupe([
      { type: "search_related", label: "Filter results", detail: "Narrow by office, state, county, source gap, or data type.", href: "/search", priority: 100, tone: "blue" },
      { type: "watch_entity", label: "Save search", detail: "Turn this search into a return path.", href: "/dashboard/watchlists?entityType=search_query&label=Saved%20search", priority: 90, tone: "red" },
      { type: "submit_source", label: "Submit missing official", detail: "Tell RepWatchr what result is missing.", href: "/submit-source?sourceType=missing_official", priority: 80, tone: "gold" },
    ]);
  }

  if (routeType === "profile") {
    return dedupe([
      { type: "watch_entity", label: context.watched ? "Open watchlist" : "Watch official", detail: "Save this profile for source, vote, funding, and correction updates.", href: watchHref, priority: 120, tone: "red" },
      { type: "submit_source", label: "Submit source", detail: "Add the missing public record or correction link.", href: sourceHref, priority: (context.sourceCount ?? 0) < 3 ? 115 : 95, tone: "gold" },
      { type: "view_timeline", label: "View timeline", detail: "Open the dated record trail attached to this profile.", href: `${route}#timeline`, priority: 90, tone: "blue" },
      { type: "request_correction", label: "Request correction", detail: "Flag incorrect info with a source-backed correction.", href: correctionHref, priority: 80, tone: "dark" },
      { type: "build_packet", label: "Build packet", detail: "Package one source before sharing.", href: packetHref, priority: 75, tone: "green" },
    ]);
  }

  if (routeType === "story") {
    return dedupe([
      { type: "open_related_story", label: "Continue reading", detail: "Open the next source-linked story.", href: "/news", priority: 100, tone: "blue" },
      { type: "search_related", label: "Open related official", detail: "Search the official, agency, board, or race named in the story.", href: "/search", priority: 90, tone: "red" },
      { type: "submit_source", label: "Submit better source", detail: "Send a stronger public record or correction link.", href: "/submit-source", priority: 80, tone: "gold" },
    ]);
  }

  if (routeType === "race") {
    return dedupe([
      { type: "watch_entity", label: "Follow this race", detail: "Watch candidate, filing, finance, and election-source updates.", href: watchHref || "/dashboard/watchlists", priority: 100, tone: "red" },
      { type: "open_related_race", label: "Compare races", detail: "Open the Texas election hub and keep moving through the ballot.", href: "/elections/texas", priority: 90, tone: "blue" },
      { type: "submit_source", label: "Submit race source", detail: "Send a filing, finance link, candidate page, or ballot source.", href: "/elections/texas/contribute", priority: 85, tone: "gold" },
    ]);
  }

  if (routeType === "dashboard") {
    return dedupe([
      { type: "watch_entity", label: "Complete watchlist", detail: "Add the officials, races, boards, and issues you want tracked.", href: "/dashboard/watchlists", priority: 100, tone: "red" },
      { type: "submit_source", label: "Submit first source", detail: "Move one public record into the queue.", href: "/submit-source", priority: 90, tone: "gold" },
      { type: "build_packet", label: "Build packet", detail: "Create a clean source packet from one link.", href: "/free-packet", priority: 80, tone: "blue" },
    ]);
  }

  if (routeType === "admin" || context.isAdmin) {
    return dedupe([
      { type: "admin_review", label: "Review next source", detail: "Open the source review queue.", href: "/admin/sources", priority: 100, tone: "red" },
      { type: "admin_review", label: "Resolve broken link", detail: "Check data health and broken source links.", href: "/admin/control-center", priority: 90, tone: "gold" },
      { type: "admin_review", label: "Check analytics", detail: "Find where users are dropping or returning.", href: "/admin/analytics", priority: 80, tone: "blue" },
    ]);
  }

  return dedupe([
    { type: "search_related", label: "Search related", detail: "Find the next official, race, board, source, or issue.", href: "/search", priority: 90, tone: "red" },
    { type: "submit_source", label: "Submit source", detail: "Send the missing public record.", href: "/submit-source", priority: 80, tone: "gold" },
    { type: "watch_entity", label: "Watch record", detail: "Save a record so you have a reason to return.", href: "/dashboard/watchlists", priority: 70, tone: "blue" },
  ]);
}
