import type { ReactNode } from "react";

type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: { text: string; nested: boolean }[] }
  | { type: "numbered"; items: string[] };

const HEADING = /^#{1,6}\s+(.+)$/;
const BOLD_HEADING = /^\*\*([^*]+?)\*\*:?$/;
const BULLET = /^(\s*)[-*•]\s+(.+)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.+)$/;

function parse(markdown: string): Block[] {
  const blocks: Block[] = [];
  const last = () => blocks[blocks.length - 1];

  for (const raw of markdown.replace(/\r/g, "").split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      blocks.push({ type: "paragraph", text: "" });
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.trim().match(HEADING)) || (m = line.trim().match(BOLD_HEADING))) {
      blocks.push({ type: "heading", text: m[1].replace(/\*\*/g, "").replace(/:$/, "").trim() });
    } else if ((m = line.match(BULLET))) {
      const item = { text: m[2], nested: m[1].length >= 2 };
      const prev = last();
      if (prev?.type === "bullets") prev.items.push(item);
      else blocks.push({ type: "bullets", items: [item] });
    } else if ((m = line.match(NUMBERED))) {
      const prev = last();
      if (prev?.type === "numbered") prev.items.push(m[1]);
      else blocks.push({ type: "numbered", items: [m[1]] });
    } else {
      const prev = last();
      if (prev?.type === "paragraph" && prev.text) prev.text += ` ${line.trim()}`;
      else blocks.push({ type: "paragraph", text: line.trim() });
    }
  }
  return blocks.filter((b) => b.type !== "paragraph" || b.text);
}

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-semibold text-slate-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

export function AnswerContent({ markdown }: { markdown: string }) {
  const blocks = parse(markdown);

  return (
    <div className="space-y-3.5">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "heading":
            return (
              <h4 key={i} className={`text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600 ${i > 0 ? "pt-3" : ""}`}>
                {b.text}
              </h4>
            );
          case "paragraph":
            return (
              <p key={i} className="text-[14px] leading-[1.7] text-slate-700">
                {inline(b.text)}
              </p>
            );
          case "bullets":
            return (
              <ul key={i} className="space-y-2">
                {b.items.map((item, j) => (
                  <li key={j} className={`flex gap-2.5 text-[13.5px] leading-relaxed text-slate-700 ${item.nested ? "pl-6" : ""}`}>
                    <span className={`mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full ${item.nested ? "bg-slate-300" : "bg-indigo-400"}`} />
                    <span>{inline(item.text)}</span>
                  </li>
                ))}
              </ul>
            );
          case "numbered":
            return (
              <ol key={i} className="space-y-2.5">
                {b.items.map((item, j) => (
                  <li key={j} className="flex gap-3 text-[13.5px] leading-relaxed text-slate-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-[11px] font-semibold text-indigo-600">{j + 1}</span>
                    <span>{inline(item)}</span>
                  </li>
                ))}
              </ol>
            );
        }
      })}
    </div>
  );
}
