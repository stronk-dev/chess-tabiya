// rfc/evidence-presentation.md §6a names four admissible kinds of learner-visible text; an authored
// registry key is none of them. It is admitted here, by name, for exactly one accepted contract:
// rfc/concept-registry.md §Pack Studio — "Pack Studio uses an accessible searchable picker over
// active entries, displays labels with IDs" (criterion 9). The Pack Studio picker is an author-only
// surface where the key is the value the author is choosing and the pack document will carry.
//
// This is a declared exemption, not a label: it must never be used on a learner route, and every
// call site is greppable by this function's name. The conflict between the two RFCs is reported for
// an owner ruling rather than resolved silently by deleting the key or allowlisting a line.

/** An authored registry key shown beside its label on an author-only picker (concept-registry criterion 9). */
export function authoredRegistryKey(key: string): string {
  return key;
}
