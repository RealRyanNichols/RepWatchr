const DEFAULT_MAX_WORDS = 9;
const DEFAULT_MAX_CHARACTERS = 64;

export function toEditorialThumbnailMessage(
  value: string,
  {
    maxWords = DEFAULT_MAX_WORDS,
    maxCharacters = DEFAULT_MAX_CHARACTERS,
  }: {
    maxWords?: number;
    maxCharacters?: number;
  } = {},
) {
  const cleanValue = value.replace(/\s+/g, " ").trim();
  if (!cleanValue) return "Open the public record";

  const words = cleanValue.split(" ");
  const selectedWords: string[] = [];

  for (const word of words) {
    const candidate = [...selectedWords, word].join(" ");
    if (selectedWords.length >= maxWords || candidate.length > maxCharacters) break;
    selectedWords.push(word);
  }

  if (!selectedWords.length) {
    return `${cleanValue.slice(0, Math.max(1, maxCharacters - 1)).trimEnd()}…`;
  }

  const message = selectedWords.join(" ");
  return message === cleanValue ? message : `${message.replace(/[,:;.!?]+$/, "")}…`;
}

export function articleThumbnailMessage(article: {
  title: string;
  thumbnailMessage?: string;
}) {
  return toEditorialThumbnailMessage(article.thumbnailMessage || article.title);
}
