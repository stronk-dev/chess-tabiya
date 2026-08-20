// DISPOSABLE routing register — D641. D487 still owns the future derived work register.

export interface RouteGroup {
  readonly destination: string;
  readonly ids: readonly string[];
  readonly action: string;
}

export const ROUTE_GROUPS = Object.freeze([
  { destination: "F1 evidence manifest", ids: ["D568", "D584", "D631", "D142", "D228", "D264"], action: "declare projections/consumers and remove parallel free-text registers" },
  { destination: "F2 semantic evidence", ids: ["D565", "D567", "D570", "D571", "D114"], action: "admission, sign/valence, operands and search-bound semantic events" },
  { destination: "F3 pack capability/migration", ids: ["D574", "D575", "D576", "D577", "D578", "D632", "D143"], action: "immutable identities, requirements, dependency-aware migration and pilot overlap" },
  { destination: "F4/F7 knowledge and theory-content", ids: ["D580", "D531", "D275"], action: "versioned reproducible knowledge artifacts, cited principle grounding and verifiable attribution/source contracts" },
  { destination: "R3/F5 assistance modules", ids: ["D583", "D585", "D586", "D587", "D589", "D624", "D261"], action: "bounded module packets, deterministic absence/provenance and validated presets" },
  { destination: "R11/F8 bot policy", ids: ["D590", "D591", "D592", "D593", "D594", "D595", "D596", "D620", "D621"], action: "separate model/sampler/repertoire/style layers and finish blind review" },
  { destination: "R12/R13/F9 player metrics", ids: ["D597", "D598", "D599", "D600", "D601", "D602", "D603", "D625", "D441"], action: "literal metrics, persistent floors, import/privacy and longitudinal coaching" },
  { destination: "R18/F12 release appliance", ids: ["D588", "D604", "D606", "D607", "D608", "D609", "D610", "D611", "D612", "D613", "D614", "D512"], action: "deterministic provider-off release, data/ops/rights/accessibility and live health" },
  { destination: "R14/O10/F10 campaign", ids: ["D356", "D297", "D298", "D299", "D301", "D302", "D303", "D304"], action: "owner pilot and campaign ruling; no implementation before closure" },
  { destination: "R3/R7/R8 capability watch", ids: ["D559", "D623"], action: "Review Map and theory/guidance hands-on studies; uniqueness claims corrected" },
  { destination: "feedback-delivery Stage 2 / F3", ids: ["D520", "D131"], action: "repair unsatisfiable tablebase census and preserve inference ceiling during binding wave" },
  { destination: "F11 professional/social composition", ids: ["D252"], action: "distinguish session kind from board-control mode in contest permissions" },
  { destination: "scoped direct defect/docs queue", ids: ["D511", "D410", "D413"], action: "correct n=1 latency prose, assert broadcast verdict stripping and update chess.com refusal basis" },
] as const satisfies readonly RouteGroup[]);

export const ROUTED_IDS = Object.freeze(ROUTE_GROUPS.flatMap((group) => group.ids).sort());
