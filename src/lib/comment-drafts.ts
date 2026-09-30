type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const MAX_AGE = 2 * 60 * 60 * 1000;

function key(topic: string, userId: string | null) {
  return `repwatchr.commentDraft.v1:${encodeURIComponent(topic)}:${userId ?? "guest"}`;
}

export function saveCommentDraft(storage: DraftStorage, topic: string, userId: string | null, content: string, now = Date.now()) {
  if (!content.trim()) storage.removeItem(key(topic, userId));
  else storage.setItem(key(topic, userId), JSON.stringify({ content: content.slice(0, 2000), savedAt: now }));
}

export function readCommentDraft(storage: DraftStorage, topic: string, userId: string | null, now = Date.now()): string {
  const draftKey = key(topic, userId);
  const raw = storage.getItem(draftKey);
  if (raw) {
    try {
      const draft = JSON.parse(raw);
      if (typeof draft.content === "string" && typeof draft.savedAt === "number" && now >= draft.savedAt && now - draft.savedAt < MAX_AGE) return draft.content.slice(0, 2000);
    } catch { /* Invalid local drafts are discarded. */ }
    storage.removeItem(draftKey);
  }
  if (userId) {
    const guestDraft = readCommentDraft(storage, topic, null, now);
    if (guestDraft) {
      saveCommentDraft(storage, topic, userId, guestDraft, now);
      storage.removeItem(key(topic, null));
    }
    return guestDraft;
  }
  return "";
}
