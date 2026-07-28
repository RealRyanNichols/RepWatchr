const SAFE_REDIRECT_BASE = "https://repwatchr.invalid";
const UNSAFE_REDIRECT_CHARACTERS = /[\\\u0000-\u001f\u007f]/;

function repeatedlyDecode(value: string) {
  let decoded = value;

  for (let pass = 0; pass < 3; pass += 1) {
    const nextDecoded = decodeURIComponent(decoded);
    if (nextDecoded === decoded) break;
    decoded = nextDecoded;
  }

  return decoded;
}

function isSafeRelativePath(value: string) {
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !UNSAFE_REDIRECT_CHARACTERS.test(value)
  );
}

export function safeNextPath(
  requestedPath: string | null | undefined,
  fallback = "/dashboard",
) {
  if (!requestedPath || requestedPath.trim() !== requestedPath) return fallback;

  try {
    const decodedPath = repeatedlyDecode(requestedPath);
    if (!isSafeRelativePath(requestedPath) || !isSafeRelativePath(decodedPath)) {
      return fallback;
    }

    const parsed = new URL(requestedPath, SAFE_REDIRECT_BASE);
    if (parsed.origin !== SAFE_REDIRECT_BASE) return fallback;

    const normalizedPath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    const decodedNormalizedPath = repeatedlyDecode(normalizedPath);
    if (
      !isSafeRelativePath(normalizedPath) ||
      !isSafeRelativePath(decodedNormalizedPath)
    ) {
      return fallback;
    }

    return normalizedPath;
  } catch {
    return fallback;
  }
}
