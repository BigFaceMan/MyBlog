export interface MarkdownHeading {
  id: string;
  level: number;
  text: string;
}

export type HeadingIdCounts = Map<string, number>;

export const normalizeHeadingText = (value: string) =>
  value
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const createHeadingId = (text: string, counts: HeadingIdCounts = new Map()) => {
  const base =
    normalizeHeadingText(text)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "heading";
  const currentCount = counts.get(base) ?? 0;

  counts.set(base, currentCount + 1);

  return currentCount ? `${base}-${currentCount + 1}` : base;
};

export const extractMarkdownHeadings = (content: string): MarkdownHeading[] => {
  const counts: HeadingIdCounts = new Map();

  return content
    .split(/\r?\n/)
    .map((line) => line.match(/^(#{1,4})\s+(.+?)(?:\s+#+)?$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => {
      const text = normalizeHeadingText(match[2] ?? "");

      return {
        id: createHeadingId(text, counts),
        level: match[1]?.length ?? 1,
        text
      };
    })
    .filter((heading) => heading.text);
};
