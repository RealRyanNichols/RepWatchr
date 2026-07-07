# RepWatchr Data Export Policy

Exports are future monetization infrastructure. They must be useful without becoming a private-data product.

Public exports can include:

- Approved public profile data.
- Approved public source URLs.
- Public jurisdictions.
- Public races.
- Published stories.
- Approved public questions.
- Aggregate trend data only when not identifying a person.

Private user exports can include only the requesting user's own:

- Watchlists.
- Source submissions.
- Source packets.
- Public-record drafts.
- Records-response metadata.
- Preferences.

Never export:

- Private home addresses.
- Minor children.
- Medical, bank, or Social Security data.
- Admin notes or reviewer comments.
- Raw analytics tied to individual users or visitors.
- Other users' private data.
- Under-review claims labeled as verified.
- Private uploaded records responses.
- Payment events.
- Secret API keys or key hashes.

Export controls:

- Every export creates a `data_exports` row.
- Exports require a user, API key, or admin action.
- Export files must expire.
- Export filters must be logged.
- Sensitive export types require admin review before delivery.
- Public exports should be generated from approved public views or adapters, not raw private tables.

Default state:

- Export infrastructure exists.
- Export creation remains disabled until data adapters, expiry, and fulfillment flows are reviewed.
