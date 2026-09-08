export function missingGraduationRulingCopies(roots, dockerfile) {
  return Object.freeze(roots.filter((root) => !dockerfile.includes(`COPY ${root} ${root}`)));
}
