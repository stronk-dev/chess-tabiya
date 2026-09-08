<script lang="ts">
  import {
    STRUCTURAL_FEATURE_KINDS,
    type FileTemplateFeature,
    type StructuralExpression,
    type StructuralFeature,
    type StructuralFeatureKind,
    type SquareTemplateFeature,
  } from "@chess-tabiya/schema/drill-pack";
  import StructuralExpressionNode from "./StructuralExpressionNode.svelte";
  import { defaultStructuralExpression, defaultStructuralFeature, structuralExpressionKind, type StructuralExpressionKind } from "./structural-expression-builder.js";

  interface Props {
    expression: StructuralExpression;
    onExpression: (expression: StructuralExpression) => void;
    depth?: number;
  }

  let { expression, onExpression, depth = 0 }: Props = $props();
  const WHITE_SIDE = "white" as const;
  const BLACK_SIDE = "black" as const;
  const sides = [WHITE_SIDE, BLACK_SIDE] as const;
  const roles = ["pawn", "knight", "bishop", "rook", "queen", "king"] as const;
  const pieces = ["knight", "bishop", "rook", "queen"] as const;
  const comparisons = ["atLeast", "atMost", "equal"] as const;
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
  const expressionKind = $derived(structuralExpressionKind(expression));
  type FileQuantifiedExpression = Extract<StructuralExpression, { readonly kind: "quantified" }> & { readonly over: { readonly files: { readonly from: typeof files[number]; readonly to: typeof files[number] } }; readonly feature: FileTemplateFeature };
  type SquareQuantifiedExpression = Extract<StructuralExpression, { readonly kind: "quantified" }> & { readonly over: { readonly squares: { readonly files: { readonly from: typeof files[number]; readonly to: typeof files[number] }; readonly ranks: { readonly from: number; readonly to: number } } }; readonly feature: SquareTemplateFeature };
  let fileExpression = $derived(expression.kind === "quantified" && "files" in expression.over ? expression as FileQuantifiedExpression : undefined);
  let squareExpression = $derived(expression.kind === "quantified" && "squares" in expression.over ? expression as SquareQuantifiedExpression : undefined);

  function replaceKind(kind: string): void {
    onExpression(defaultStructuralExpression(kind as StructuralExpressionKind));
  }

  function updateFeature(patch: Record<string, unknown>): void {
    if (expression.kind !== "feature") return;
    onExpression({ kind: "feature", feature: { ...expression.feature, ...patch } as StructuralFeature });
  }

  function replaceFeature(kind: string): void {
    if (expression.kind !== "feature") return;
    onExpression({ kind: "feature", feature: defaultStructuralFeature(kind as StructuralFeatureKind) });
  }

  function updateChild(index: number, child: StructuralExpression): void {
    if (expression.kind !== "all" && expression.kind !== "any") return;
    const of = [...expression.of];
    of[index] = child;
    onExpression({ kind: expression.kind, of: of as [StructuralExpression, ...StructuralExpression[]] });
  }

  function removeChild(index: number): void {
    if (expression.kind !== "all" && expression.kind !== "any" || expression.of.length <= 1) return;
    const of = expression.of.filter((_, candidate) => candidate !== index) as [StructuralExpression, ...StructuralExpression[]];
    onExpression({ kind: expression.kind, of });
  }

  function addChild(): void {
    if (expression.kind !== "all" && expression.kind !== "any") return;
    onExpression({ kind: expression.kind, of: [...expression.of, defaultStructuralExpression()] });
  }

  function updateFileTemplate(patch: Record<string, unknown>): void {
    if (fileExpression === undefined) return;
    onExpression({ ...fileExpression, feature: { ...fileExpression.feature, ...patch } as FileTemplateFeature });
  }

  function updateSquareTemplate(patch: Record<string, unknown>): void {
    if (squareExpression === undefined) return;
    onExpression({ ...squareExpression, feature: { ...squareExpression.feature, ...patch } as SquareTemplateFeature });
  }

  function updateFileRange(boundary: "from" | "to", value: string): void {
    if (fileExpression === undefined) return;
    onExpression({ ...fileExpression, over: { files: { ...fileExpression.over.files, [boundary]: value as typeof files[number] } } });
  }

  function updateSquareRegion(axis: "files" | "ranks", value: string): void {
    if (squareExpression === undefined) return;
    const [fromText, toText] = value.split("-");
    if (fromText === undefined || toText === undefined) return;
    const range = axis === "files"
      ? { from: fromText as typeof files[number], to: toText as typeof files[number] }
      : { from: Number(fromText), to: Number(toText) };
    onExpression({ ...squareExpression, over: { squares: { ...squareExpression.over.squares, [axis]: range } } } as SquareQuantifiedExpression);
  }

  function updateSquarePieceColor(color: string): void {
    if (squareExpression?.feature.kind !== "piece" || squareExpression.feature.piece === null) return;
    updateSquareTemplate({ piece: { ...squareExpression.feature.piece, color } });
  }
</script>

<fieldset class="expression-node" data-depth={depth}>
  <legend>{depth === 0 ? "Expression" : `Condition ${depth + 1}`}</legend>
  <label>Combine or test
    <select value={expressionKind} onchange={(event) => replaceKind(event.currentTarget.value)}>
      <option value="feature">Position fact</option>
      <option value="all">All of</option>
      <option value="any">Any of</option>
      <option value="not">Not</option>
      <option value="mirrored">Mirrored</option>
      <option value="quantified_files">Across files</option>
      <option value="quantified_squares">Across squares</option>
      <option value="pieceOnSquare">Piece on square</option>
      <option value="plan_signature">Registered plan signature</option>
    </select>
  </label>

  {#if expression.kind === "all" || expression.kind === "any"}
    <p class="honest">{expression.kind === "all" ? "Every condition must hold." : "At least one condition must hold."}</p>
    <div class="children">
      {#each expression.of as child, index}
        <div class="child">
          <StructuralExpressionNode expression={child} onExpression={(next: StructuralExpression) => updateChild(index, next)} depth={depth + 1} />
          <button type="button" disabled={expression.of.length === 1} onclick={() => removeChild(index)}>Remove condition</button>
        </div>
      {/each}
      <button type="button" onclick={addChild}>Add condition</button>
    </div>
  {:else if expression.kind === "not"}
    <StructuralExpressionNode expression={expression.of} onExpression={(of: StructuralExpression) => onExpression({ kind: "not", of })} depth={depth + 1} />
  {:else if expression.kind === "mirrored"}
    <label>Mirror
      <select value={expression.axis} onchange={(event) => onExpression({ ...expression, axis: event.currentTarget.value as "colors" | "files" | "both" })}>
        <option value="colors">Colours and ranks</option><option value="files">Files</option><option value="both">Both</option>
      </select>
    </label>
    <StructuralExpressionNode expression={expression.of} onExpression={(of: StructuralExpression) => onExpression({ ...expression, of })} depth={depth + 1} />
  {:else if expression.kind === "pieceOnSquare"}
    <label>Square<input pattern="[a-h][1-8]" maxlength="2" value={expression.square} oninput={(event) => onExpression({ ...expression, square: event.currentTarget.value as typeof expression.square })} /></label>
    <label>Occupant
      <select value={expression.piece === null ? "empty" : expression.piece.role} onchange={(event) => onExpression({ ...expression, piece: event.currentTarget.value === "empty" ? null : { color: expression.piece?.color ?? WHITE_SIDE, role: event.currentTarget.value as typeof roles[number] } })}>
        <option value="empty">Empty</option>{#each roles as role}<option value={role}>{role}</option>{/each}
      </select>
    </label>
    {#if expression.piece !== null}<label>Colour<select value={expression.piece.color} onchange={(event) => onExpression({ ...expression, piece: { ...expression.piece!, color: event.currentTarget.value as typeof sides[number] } })}>{#each sides as side}<option value={side}>{side}</option>{/each}</select></label>{/if}
  {:else if expression.kind === "plan_signature"}
    <label>Plan class id<input value={expression.planClassId} oninput={(event) => onExpression({ ...expression, planClassId: event.currentTarget.value })} /></label>
  {:else if fileExpression !== undefined}
    <label>Quantity<select value={fileExpression.quantifier} onchange={(event) => onExpression({ ...fileExpression!, quantifier: event.currentTarget.value as "some" | "every" })}><option value="some">Some</option><option value="every">Every</option></select></label>
    <div class="compact-row"><label>From file<select value={fileExpression.over.files.from} onchange={(event) => updateFileRange("from", event.currentTarget.value)}>{#each files as file}<option value={file}>{file}</option>{/each}</select></label><label>To file<select value={fileExpression.over.files.to} onchange={(event) => updateFileRange("to", event.currentTarget.value)}>{#each files as file}<option value={file}>{file}</option>{/each}</select></label></div>
    <label>Fact<select value={fileExpression.feature.kind} onchange={(event) => updateFileTemplate(event.currentTarget.value === "open_file" ? { kind: "open_file" } : { kind: event.currentTarget.value, color: WHITE_SIDE })}><option value="open_file">Open file</option><option value="half_open_file">Half-open file</option><option value="backward_pawn">Backward pawn</option><option value="isolated_pawn">Isolated pawn</option><option value="doubled_pawn">Doubled pawn</option></select></label>
    {#if fileExpression.feature.kind !== "open_file"}<label>Colour<select value={fileExpression.feature.color} onchange={(event) => updateFileTemplate({ color: event.currentTarget.value })}>{#each sides as side}<option value={side}>{side}</option>{/each}</select></label>{/if}
  {:else if squareExpression !== undefined}
    <label>Quantity<select value={squareExpression.quantifier} onchange={(event) => onExpression({ ...squareExpression!, quantifier: event.currentTarget.value as "some" | "every" })}><option value="some">Some</option><option value="every">Every</option></select></label>
    <div class="compact-row"><label>Files<input pattern="[a-h]-[a-h]" value={`${squareExpression.over.squares.files.from}-${squareExpression.over.squares.files.to}`} oninput={(event) => updateSquareRegion("files", event.currentTarget.value)} /></label><label>Ranks<input pattern="[1-8]-[1-8]" value={`${squareExpression.over.squares.ranks.from}-${squareExpression.over.squares.ranks.to}`} oninput={(event) => updateSquareRegion("ranks", event.currentTarget.value)} /></label></div>
    <label>Fact<select value={squareExpression.feature.kind} onchange={(event) => updateSquareTemplate(event.currentTarget.value === "piece" ? { kind: "piece", piece: null } : event.currentTarget.value === "direct_attack_count" ? { kind: "direct_attack_count", color: WHITE_SIDE, comparison: "atLeast", count: 1 } : { kind: event.currentTarget.value, color: WHITE_SIDE })}><option value="pawn_safe_square">Pawn-safe square</option><option value="outpost">Outpost</option><option value="passed_pawn">Passed pawn</option><option value="direct_attack_count">Attack count</option><option value="piece">Piece occupancy</option></select></label>
    {#if squareExpression.feature.kind === "piece"}
      <label>Occupant<select value={squareExpression.feature.piece?.role ?? "empty"} onchange={(event) => updateSquareTemplate({ piece: event.currentTarget.value === "empty" ? null : { color: squareExpression!.feature.kind === "piece" ? squareExpression!.feature.piece?.color ?? WHITE_SIDE : WHITE_SIDE, role: event.currentTarget.value } })}><option value="empty">Empty</option>{#each roles as role}<option value={role}>{role}</option>{/each}</select></label>
      {#if squareExpression.feature.piece}<label>Colour<select value={squareExpression.feature.piece.color} onchange={(event) => updateSquarePieceColor(event.currentTarget.value)}>{#each sides as side}<option value={side}>{side}</option>{/each}</select></label>{/if}
    {:else}
      <label>Colour<select value={squareExpression.feature.color} onchange={(event) => updateSquareTemplate({ color: event.currentTarget.value })}>{#each sides as side}<option value={side}>{side}</option>{/each}</select></label>
      {#if squareExpression.feature.kind === "direct_attack_count"}<div class="compact-row"><label>Compare<select value={squareExpression.feature.comparison} onchange={(event) => updateSquareTemplate({ comparison: event.currentTarget.value })}>{#each comparisons as comparison}<option value={comparison}>{comparison}</option>{/each}</select></label><label>Count<input type="number" value={squareExpression.feature.count} oninput={(event) => updateSquareTemplate({ count: event.currentTarget.valueAsNumber })} /></label></div>{/if}
    {/if}
  {:else if expression.kind === "feature"}
    <label>Position fact
      <select value={expression.feature.kind} onchange={(event) => replaceFeature(event.currentTarget.value)}>
        {#each STRUCTURAL_FEATURE_KINDS as kind}<option value={kind}>{kind.replaceAll("_", " ")}</option>{/each}
      </select>
    </label>
    {@const feature = expression.feature}
    {#if "color" in feature}<label>Colour<select value={feature.color} onchange={(event) => updateFeature({ color: event.currentTarget.value })}>{#each sides as side}<option value={side}>{side}</option>{/each}</select></label>{/if}
    {#if "square" in feature}<label>Square<input pattern="[a-h][1-8]" maxlength="2" value={feature.square} oninput={(event) => updateFeature({ square: event.currentTarget.value })} /></label>{/if}
    {#if "file" in feature}<label>File<select value={feature.file} onchange={(event) => updateFeature({ file: event.currentTarget.value })}>{#each files as file}<option value={file}>{file}</option>{/each}</select></label>{/if}
    {#if feature.kind === "line_blockers"}<div class="compact-row"><label>From<input pattern="[a-h][1-8]" maxlength="2" value={feature.from} oninput={(event) => updateFeature({ from: event.currentTarget.value })} /></label><label>To<input pattern="[a-h][1-8]" maxlength="2" value={feature.to} oninput={(event) => updateFeature({ to: event.currentTarget.value })} /></label></div>{/if}
    {#if "comparison" in feature}<div class="compact-row"><label>Compare<select value={feature.comparison} onchange={(event) => updateFeature({ comparison: event.currentTarget.value })}>{#each comparisons as comparison}<option value={comparison}>{comparison}</option>{/each}</select></label><label>Count<input type="number" value={feature.count} oninput={(event) => updateFeature({ count: event.currentTarget.valueAsNumber })} /></label></div>{/if}
    {#if feature.kind === "piece_reach_count"}<div class="compact-row"><label>Piece<select value={feature.role} onchange={(event) => updateFeature({ role: event.currentTarget.value })}>{#each pieces as role}<option value={role}>{role}</option>{/each}</select></label><label>Scope<select value={feature.scope} onchange={(event) => updateFeature({ scope: event.currentTarget.value })}><option value="any">Any piece</option><option value="every">Every piece</option></select></label></div>{/if}
    {#if feature.kind === "named_structure"}<label>Structure<select value={feature.id} onchange={(event) => updateFeature({ id: event.currentTarget.value })}><option value="carlsbad">Carlsbad</option><option value="iqp-white">White IQP</option><option value="iqp-black">Black IQP</option><option value="maroczy-bind">Maróczy bind</option></select></label>{/if}
    {#if feature.kind === "bishop_on_shade"}<label>Square colour<select value={feature.shade} onchange={(event) => updateFeature({ shade: event.currentTarget.value })}><option value="light">Light</option><option value="dark">Dark</option></select></label>{/if}
    {#if feature.kind === "pawn_count" || feature.kind === "piece_count"}<label>Basis<select value={feature.basis} onchange={(event) => updateFeature({ basis: event.currentTarget.value })}><option value="count">Count</option><option value="difference">Difference</option></select></label>{/if}
    {#if feature.kind === "piece_count"}<label>Piece<select value={feature.role} onchange={(event) => updateFeature({ role: event.currentTarget.value })}>{#each roles as role}<option value={role}>{role}</option>{/each}</select></label>{/if}
    {#if feature.kind === "king_opposition"}<label>Form<select value={feature.form} onchange={(event) => updateFeature({ form: event.currentTarget.value })}><option value="direct">Direct</option><option value="distant">Distant</option></select></label>{/if}
    {#if feature.kind === "king_zone"}<label>Zone<select value={feature.zone} onchange={(event) => updateFeature({ zone: event.currentTarget.value })}><option value="edge">Edge</option><option value="corner">Corner</option></select></label>{/if}
    {#if feature.kind === "piece_distance"}
      <label>Piece<select value={feature.role} onchange={(event) => updateFeature({ role: event.currentTarget.value })}>{#each ["king", ...pieces] as role}<option value={role}>{role}</option>{/each}</select></label>
      <label>Target<select value={feature.target.kind} onchange={(event) => updateFeature({ target: event.currentTarget.value === "square" ? { kind: "square", square: "e4" } : { kind: "piece", color: BLACK_SIDE, role: "king" } })}><option value="square">Square</option><option value="piece">Piece</option></select></label>
      {#if feature.target.kind === "square"}<label>Target square<input pattern="[a-h][1-8]" maxlength="2" value={feature.target.square} oninput={(event) => updateFeature({ target: { ...feature.target, square: event.currentTarget.value } })} /></label>{:else}<div class="compact-row"><label>Target colour<select value={feature.target.color} onchange={(event) => updateFeature({ target: { ...feature.target, color: event.currentTarget.value } })}>{#each sides as side}<option value={side}>{side}</option>{/each}</select></label><label>Target piece<select value={feature.target.role} onchange={(event) => updateFeature({ target: { ...feature.target, role: event.currentTarget.value } })}>{#each roles as role}<option value={role}>{role}</option>{/each}</select></label></div>{/if}
    {/if}
  {/if}
</fieldset>

<style>
  .expression-node { display: grid; gap: .55rem; min-inline-size: 0; padding: .7rem; border: 1px solid var(--line); border-radius: .55rem; background: color-mix(in srgb, var(--panel) 82%, transparent); }
  .expression-node[data-depth="0"] { background: var(--panel); }
  legend { padding-inline: .3rem; font-weight: 700; }
  label { display: grid; gap: .25rem; }
  input, select { width: 100%; min-width: 0; }
  .children, .child { display: grid; gap: .55rem; }
  .child { padding-inline-start: .45rem; border-inline-start: 3px solid var(--line); }
  .compact-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; }
  p { margin: 0; }
  @media (max-width: 34rem) { .compact-row { grid-template-columns: 1fr; } }
</style>
