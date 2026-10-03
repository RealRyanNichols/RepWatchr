export const MARION_FORUM_TOPIC = "marion-county-candidate-forum-2026";

export const marionForumSources = {
  conditions: {
    title: "Carroll's posted September 28 letter",
    url: "https://www.facebook.com/photo?fbid=122127860577391893&set=pcb.122127861363391893",
  },
  response: {
    title: "Posted screenshot attributed to Hugh Lewis II",
    url: "https://www.facebook.com/photo?fbid=122127860709391893&set=pcb.122127861363391893",
  },
  decision: {
    title: "Carroll's posted September 29 letter",
    url: "https://www.facebook.com/photo?fbid=122127860817391893&set=pcb.122127861363391893",
  },
  statement: {
    title: "Carroll's public forum statement and correspondence",
    url: "https://www.facebook.com/writeindina/posts/pfbid02u21Vu9vv3Tp6rNNanKCFGYYe2HVL5hJDky7QMomah4GxKwz6kVryv33vDucozQ9hl",
  },
  commentary: {
    title: "Marion County Exposed commentary linking to that statement",
    url: "https://www.facebook.com/permalink.php?story_fbid=pfbid09KF6UTRz1oEMQwwBkzVkrMiJkwxHUWU58GTDbCcyYLkbaAj2LTGTGH9TTaWtBrNMl&id=61592434371241",
  },
};

export const marionForumFacts = [
  {
    label: "Posted correspondence",
    statement: "Carroll requested an agreed third-party moderator and other conditions for the proposed forum.",
    source: marionForumSources.conditions,
    limit: "The original invitation and delivery record have not been acquired.",
  },
  {
    label: "Attributed response",
    statement: "The screenshot she posted says Hugh would moderate for the Jimplecute, with devices allowed for notes and audience questions selected by the moderator.",
    source: marionForumSources.response,
    limit: "This is a candidate-posted screenshot, not an independently authenticated original. Its calendar date is unverified.",
  },
  {
    label: "Posted decision",
    statement: "Carroll's September 29 letter declines that invitation. Her public statement offers participation under a neutral moderator and stated conditions.",
    source: marionForumSources.statement,
    limit: "Declining this invitation does not establish refusal of every possible forum. No alternative event is confirmed here.",
  },
  {
    label: "Public commentary",
    statement: "Marion County Exposed criticizes her decision and concerns about live coaching.",
    source: marionForumSources.commentary,
    limit: "Who authored or controls that page, and any connection to the Jimplecute, remain unverified. Commentary does not establish that coaching occurred.",
  },
] as const;

export const marionForumUpdates = [
  {
    date: "2026-10-02",
    title: "County declared write-in list reviewed",
    text: "The county-published November 3 list names Dina Carroll for County Judge. This closes the earlier missing-roster check. Her accepted declaration and filing date remain separate records not acquired by this desk. The September 29 sample-ballot review below is retained as a historical entry.",
    source: { title: "County list of declared write-in candidates", url: "https://marioncountytaxoffice.com/wp-content/uploads/2026/09/LIST-OF-DECLARED-WRITE-IN-CANDIDATES.pdf" },
  },
  {
    date: "2026-09-29",
    title: "County sample ballot reviewed",
    text: "The precincts 1 and 2 sample names LaFleur and includes a blank write-in line. It does not name Carroll or establish her write-in qualification. The accepted declaration or qualified roster remains an open record check.",
    source: { title: "County-published sample ballot, page 2", url: "https://marioncountytaxoffice.com/wp-content/uploads/2026/09/SAMPLE-BALLOT-PCT-1-2.pdf" },
  },
  {
    date: "2026-09-29",
    title: "Decision and public statement reviewed",
    text: "The posted letter declines the proposed invitation. The public statement sets conditions for participation. Page authorship and the original correspondence remain open checks.",
    source: marionForumSources.statement,
  },
  {
    date: "2026-09-28",
    title: "Conditions proposed in dated letter",
    text: "The letter requests a third-party moderator, in-person participation, limits on electronic devices, citizen questions, and boundaries for the discussion.",
    source: marionForumSources.conditions,
  },
] as const;
