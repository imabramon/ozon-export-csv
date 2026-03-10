import type { ReactNode } from "react";

interface SearchableTextProps {
  text: string;
  searchText: string;
}

export function SearchableText({ text, searchText }: SearchableTextProps): ReactNode {
  const q = searchText.trim();
  if (!q) {
    return text;
  }

  const re = new RegExp(escapeRegex(q), "gi");
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    parts.push(text.slice(lastIndex, match.index));
    parts.push(<mark key={`h-${key++}`}>{match[0]}</mark>);
    lastIndex = match.index + match[0].length;
  }
  parts.push(text.slice(lastIndex));

  if (parts.length === 1 && lastIndex === 0) {
    return text;
  }

  return parts;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
