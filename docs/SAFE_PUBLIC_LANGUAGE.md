# RepWatchr Safe Public Language

RepWatchr should be direct, source-first, and careful. It should not water down public records, but it must not publish claims beyond the record.

## Unsafe To Safer

Unsafe:

> Councilman Smith is corrupt.

Safer:

> RepWatchr needs public sources related to Councilman Smith and the specific issue. Submit official records or named public reporting for review.

Unsafe:

> The sheriff committed fraud.

Safer:

> RepWatchr has not verified this claim. Submit an official public source if one exists.

Unsafe:

> This judge is guilty.

Safer:

> This profile includes public records and source-backed questions. It does not make legal conclusions.

## Preferred Framing

Use:

- The public record shows...
- The source linked here says...
- RepWatchr needs a source for...
- This is a public question, not a finding.
- This item is under review.
- The record is incomplete until a public source is attached.

Avoid:

- Criminal conclusions without official source.
- Corruption conclusions without public record support.
- Guilt language.
- Insults.
- Harassment prompts.
- Fake urgency or fake source counts.

## Implementation

- `validatePublicContentSafety(text, metadata)` flags risky content.
- `suggestSafeLanguage(text)` returns safer public wording.
- `RiskyContentWarning` displays safety flags in forms/admin review.
- `SafetyLabel` and `SourceConfidenceLabel` display public confidence labels.
