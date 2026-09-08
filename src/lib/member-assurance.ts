/** Trusted only when read from the server-managed member_assurance table. */
export type MemberAssurance = {
  account_fee_status?: "unpaid" | "paid" | "waived" | "refunded" | null;
  person_status?: string | null;
  person_verified_at?: string | null;
  person_expires_at?: string | null;
  residence_status?: string | null;
  residence_verified_at?: string | null;
  residence_expires_at?: string | null;
  county?: string | null;
  district?: string | null;
};

function currentCheck(status: string | null | undefined, verifiedAt: string | null | undefined, expiresAt: string | null | undefined, now: number) {
  const verified = Date.parse(verifiedAt ?? "");
  const expires = Date.parse(expiresAt ?? "");
  return status === "verified" && Number.isFinite(verified) && Number.isFinite(expires) && verified <= now && expires > now;
}

export function getMemberAssurance(record: MemberAssurance | null, now = Date.now()) {
  const personVerified = currentCheck(record?.person_status, record?.person_verified_at, record?.person_expires_at, now);
  const residenceVerified = personVerified && currentCheck(record?.residence_status, record?.residence_verified_at, record?.residence_expires_at, now);
  return {
    paidAccount: record?.account_fee_status === "paid",
    personVerified,
    residenceVerified,
    // Never treat payment, a legacy boolean, or self-reported geography as proof.
    verified: residenceVerified,
    county: residenceVerified ? record?.county ?? null : null,
    district: residenceVerified ? record?.district ?? null : null,
  };
}
