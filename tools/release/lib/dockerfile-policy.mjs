// rfc/verifiable-runtime-distribution.md §2/§4/§7/§8 — release Dockerfile policy.
//
// Every FROM/syntax reference is the reviewed index digest recorded in release/materials.v1.json;
// every fetched input is `ADD --checksum`; apt runs only in build stages, only against the frozen
// snapshot and only with exact versions; pip installs only exact hashed locks; the final stage never
// copies the authoring tree, prose roots or any post-image artifact.

function logicalLines(text) {
  const lines = [];
  let current = "";
  let start = 0;
  text.split(/\r?\n/u).forEach((line, index) => {
    if (current === "") start = index + 1;
    if (/^\s*#/u.test(line) && current === "") {
      lines.push({ line: start, text: line.trim() });
      return;
    }
    if (line.trimEnd().endsWith("\\")) {
      current += `${line.trimEnd().slice(0, -1)} `;
      return;
    }
    current += line;
    if (current.trim() !== "") lines.push({ line: start, text: current.trim() });
    current = "";
  });
  return lines;
}

export function dockerfileFindings(text, materials, file = "Dockerfile") {
  const findings = [];
  const images = new Map(materials.baseImages.map((image) => [image.repository, image]));
  const lines = logicalLines(text);
  const stages = [];
  const syntax = lines.find((entry) => /^#\s*syntax=/u.test(entry.text));
  const frontend = materials.baseImages.find((image) => image.id === "dockerfile-frontend");
  if (syntax === undefined || !syntax.text.includes(`${frontend.repository.replace(/^docker\.io\//u, "")}:${frontend.tag}@${frontend.index}`)) {
    findings.push(`${file}: the syntax frontend must be pinned to ${frontend.repository}:${frontend.tag}@${frontend.index}`);
  }
  for (const entry of lines) {
    const from = /^FROM\s+(?:--platform=\S+\s+)?(?<reference>\S+)(?:\s+AS\s+(?<name>\S+))?$/iu.exec(entry.text);
    if (from !== null) {
      const { reference, name } = from.groups;
      stages.push({ name, line: entry.line, instructions: [], external: !stages.some((stage) => stage.name === reference) });
      if (!stages.at(-1).external) continue;
      const match = /^(?<repository>[^:@]+):(?<tag>[^@]+)@(?<digest>sha256:[0-9a-f]{64})$/u.exec(reference);
      if (match === null) {
        findings.push(`${file}:${entry.line}: FROM ${reference} is not a readable tag plus reviewed index digest`);
        continue;
      }
      const image = images.get(match.groups.repository);
      if (image === undefined) findings.push(`${file}:${entry.line}: ${match.groups.repository} is not a reviewed base image`);
      else if (image.index !== match.groups.digest || image.tag !== match.groups.tag) findings.push(`${file}:${entry.line}: ${reference} does not match the reviewed ${image.repository}:${image.tag}@${image.index}`);
      continue;
    }
    if (entry.text.startsWith("#")) continue;
    if (stages.length === 0) continue;
    stages.at(-1).instructions.push(entry);
  }
  const final = stages.at(-1);
  for (const stage of stages) {
    const isFinal = stage === final;
    for (const entry of stage.instructions) {
      const at = `${file}:${entry.line}`;
      const instruction = entry.text.split(/\s+/u, 1)[0].toUpperCase();
      if (instruction === "ADD" && /https?:\/\//u.test(entry.text) && !/--checksum=sha256:[0-9a-f]{64}/u.test(entry.text)) findings.push(`${at}: remote ADD without --checksum=sha256`);
      if (instruction === "RUN") {
        if (/\b(?:curl|wget)\s/u.test(entry.text)) findings.push(`${at}: RUN fetches with curl/wget; fetch with ADD --checksum instead`);
        if (/\bgit\s+clone\b/u.test(entry.text)) findings.push(`${at}: git clone is a live, unpinned input`);
        if (/\bapt-get\b/u.test(entry.text)) {
          if (isFinal) findings.push(`${at}: the final stage runs apt-get`);
          if (!/snapshot\.debian\.org\/archive\/debian\/\d{8}T\d{6}Z/u.test(entry.text)) findings.push(`${at}: apt-get runs without the frozen Debian snapshot`);
          const install = /apt-get\s+install\s+(?<args>[^&;|]+)/u.exec(entry.text);
          for (const argument of install?.groups.args.trim().split(/\s+/u) ?? []) {
            if (argument.startsWith("-")) continue;
            if (!/^[a-z0-9.+-]+=[A-Za-z0-9.:+~-]+$/u.test(argument)) findings.push(`${at}: apt package ${argument} is not an exact version`);
          }
        }
        for (const install of entry.text.matchAll(/pip\s+install\s+(?<args>[^&;|]+)/gu)) {
          const args = install.groups.args;
          if (/--no-index/u.test(args) && /--no-deps/u.test(args)) continue;
          if (!/--require-hashes/u.test(args) || !/--no-deps/u.test(args)) findings.push(`${at}: pip install must use --require-hashes --no-deps`);
        }
        if (/netcat|\bnc\b/u.test(entry.text)) findings.push(`${at}: netcat is not a runtime component`);
      }
      if (instruction === "COPY" || instruction === "ADD") {
        if (/release-manifest\.json|SHA256SUMS/u.test(entry.text)) findings.push(`${at}: an image never embeds the post-image release index or checksum file`);
        if (isFinal && !/--from=/u.test(entry.text)) {
          const sources = entry.text.replace(/^(?:COPY|ADD)\s+(?:--\S+\s+)*/iu, "").split(/\s+/u).slice(0, -1);
          for (const source of sources) {
            if (/^(?:content|planning|docs|rfc|tools|vendor|tests|archive|design)(?:\/|$)/u.test(source)) findings.push(`${at}: the final stage copies authoring tree ${source}`);
          }
        }
        if (isFinal && /--from=\S+\s+\S*\/content\s/u.test(entry.text)) findings.push(`${at}: the final stage copies the whole content tree`);
      }
    }
  }
  return findings;
}
