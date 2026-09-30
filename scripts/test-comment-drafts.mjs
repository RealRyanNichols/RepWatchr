import assert from "node:assert/strict";
import { readCommentDraft, saveCommentDraft } from "../src/lib/comment-drafts.ts";

const values = new Map();
const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
saveCommentDraft(storage, "race:a", null, "A question about the records", 100);
assert.equal(readCommentDraft(storage, "race:b", null, 200), "", "A different page must not inherit the draft");
assert.equal(readCommentDraft(storage, "race:a", "member-a", 200), "A question about the records", "Signing in restores the guest draft");
assert.equal(readCommentDraft(storage, "race:a", null, 300), "", "Claimed guest draft is removed");
assert.equal(readCommentDraft(storage, "race:a", "member-b", 300), "", "Another account cannot restore the first member's draft");
saveCommentDraft(storage, "race:a", "member-a", "", 400);
assert.equal(readCommentDraft(storage, "race:a", "member-a", 500), "", "Discard and successful posting clear the stored draft");
saveCommentDraft(storage, "race:a", null, "Old draft", 100);
assert.equal(readCommentDraft(storage, "race:a", null, 7_200_101), "", "Expired drafts are removed");
saveCommentDraft(storage, "race:a", null, "x".repeat(2100), 100);
assert.equal(readCommentDraft(storage, "race:a", null, 101).length, 2000);
console.log("Comment drafts: topic/account isolation, sign-in handoff, discard, expiration and length passed.");
