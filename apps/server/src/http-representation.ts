import { MIMEType } from "node:util";

// RFC 9110 §§12.4.2/12.5.1. Preserve the existing JSON default on equal preference;
// browser document Accept selects HTML without changing fetch/API authentication.
export function prefersHtmlToJson(accept: string | null): boolean {
  if (accept === null) return false;
  const members: string[] = [];
  let start = 0;
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < accept.length; index += 1) {
    const character = accept[index];
    if (escaped) { escaped = false; continue; }
    if (quoted && character === "\\") { escaped = true; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === "," && !quoted) { members.push(accept.slice(start, index)); start = index + 1; }
  }
  members.push(accept.slice(start));
  const ranges = members.flatMap((member) => {
    try {
      const mime = new MIMEType(member.trim());
      if (mime.type === "*" && mime.subtype !== "*") return [];
      const weight = mime.params.get("q") ?? "1";
      if (!/^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/u.test(weight)) return [];
      const parameters = [...mime.params].filter(([name]) => name !== "q");
      return [{ mime, quality: Number(weight), parameters }];
    } catch { return []; }
  });
  const preference = (type: string, subtype: string) => {
    let specificity = -1;
    let quality = 0;
    for (const range of ranges) {
      if (range.mime.type !== type && range.mime.type !== "*") continue;
      if (range.mime.subtype !== subtype && range.mime.subtype !== "*") continue;
      if (range.parameters.some(([name, value]) => name !== "charset" || value.toLowerCase() !== "utf-8")) continue;
      const rank = (range.mime.type === "*" ? 0 : range.mime.subtype === "*" ? 1 : 2) * 100 + range.parameters.length;
      if (rank > specificity) { specificity = rank; quality = range.quality; }
      else if (rank === specificity) quality = Math.max(quality, range.quality);
    }
    return { quality, specificity };
  };
  const html = preference("text", "html");
  const json = preference("application", "json");
  return html.quality > 0 && (html.quality > json.quality || (html.quality === json.quality && html.specificity > json.specificity));
}
