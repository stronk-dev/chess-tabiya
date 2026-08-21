import { voiceCheck, type EvidencePacket, type RenderedEvidenceView } from "@chess-tabiya/runtime";

import type { VoiceProvider } from "./guidance.js";

declare const packet: EvidencePacket;
declare const rendered: RenderedEvidenceView;
declare const provider: VoiceProvider;

voiceCheck(rendered, "checked");
// @ts-expect-error A raw packet is not a rendered evidence authority.
voiceCheck(packet, "unchecked");
// @ts-expect-error A structural literal cannot forge the runtime-sealed rendered view.
provider.render({ scope: "reading", rendered: { consumer: { id: "guidance.voice", version: 1 }, items: [] } }, "plain", "", "reading");
