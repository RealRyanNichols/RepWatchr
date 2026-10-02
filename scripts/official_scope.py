"""The elected-official profile roster is limited to Texas.

Keep this restriction independent of directory-focus UI flags: changing a
command-line option or running an older nationally named importer must not
restore out-of-state profiles.
"""

import re
from typing import Any

PROFILE_STATE = "TX"


def is_profile_state(value: Any) -> bool:
    return isinstance(value, str) and value.strip().upper() in {PROFILE_STATE, "TEXAS"}


def require_profile_state(payload: dict[str, Any]) -> None:
    if not is_profile_state(payload.get("state")):
        raise ValueError(f"Refusing elected-official profile outside Texas: {payload.get('id', 'unknown')}")


def is_texas_official(payload: dict[str, Any]) -> bool:
    """Support old Texas local records without loosening new-import validation."""
    state = payload.get("state")
    if isinstance(state, str) and state.strip():
        return is_profile_state(state)
    contact = payload.get("contactInfo") or {}
    office = contact.get("office", "") if isinstance(contact, dict) else ""
    postal_state = re.search(r"\b([A-Z]{2})\s+\d{5}(?:-\d{4})?\b", str(office))
    if postal_state:
        return is_profile_state(postal_state.group(1))
    jurisdiction = str(payload.get("jurisdiction") or "")
    counties = payload.get("county") or []
    if not isinstance(counties, list):
        counties = [counties]
    return bool(re.search(r"\b(?:texas|tx)\b", " ".join([jurisdiction, *map(str, counties)]), re.I))
