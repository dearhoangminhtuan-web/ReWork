import type { ThemeKey } from "@/config/prefectures";
import { KochiPoster, StampCastle, StampChinkabashi, StampHarimaya, StampNaruko } from "./kochi";
import { StampKaminarimon, StampScramble, StampTower, StampYamanote, TokyoPoster } from "./tokyo";

export type StampFeature = "tedori" | "assistant" | "community" | "swap";

type StampC = (p: { label?: string }) => React.ReactElement;

export const ART: Record<ThemeKey, { Poster: (p: { className?: string }) => React.ReactElement; stamps: Record<StampFeature, StampC> }> = {
  kochi: {
    Poster: KochiPoster,
    stamps: { tedori: StampHarimaya, assistant: StampCastle, community: StampNaruko, swap: StampChinkabashi },
  },
  tokyo: {
    Poster: TokyoPoster,
    stamps: { tedori: StampTower, assistant: StampKaminarimon, community: StampScramble, swap: StampYamanote },
  },
};

/** Defs shared by every page: a rough-ink filter that makes stamps look pressed. */
export function InkDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <filter id="rough-ink" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" result="d" />
        <feComponentTransfer in="noise" result="holes">
          <feFuncA type="discrete" tableValues="1 1 1 1 0.15 1 1 1" />
        </feComponentTransfer>
        <feComposite in="d" in2="holes" operator="in" />
      </filter>
    </svg>
  );
}
