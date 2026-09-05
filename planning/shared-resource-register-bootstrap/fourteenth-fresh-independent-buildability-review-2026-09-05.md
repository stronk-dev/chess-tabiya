# Shared-resource register bootstrap — fourteenth fresh independent buildability review

- **Date:** 2026-09-05
- **Reviewed:** thirteenth author repair for [[D2843]]–[[D2845]]
- **Gate:** `make shared-resource-bootstrap-fourteenth-fresh-review`
- **Verdict:** **RETURNED on [[D2854]], [[D2855]] and [[D2856]]**

## Findings

1. **The adopted assistance descriptor does not fit the proposed engine ([[D2854]]).** Executing
   its literal catalogue candidate against committed HEAD gives four failures among eight declared
   roots: `validV4` and `migrate` fail `resolution:any-member`, `loadAssistance` fails
   `resolution:broad-index`, and `saveAssistance` fails `resolution:overloads`. The separate
   workflow-preference descriptor fails two of ten roots on the latter two classes. D1 requires
   cross-RFC profile fit; synthetic graph controls do not discharge it.
2. **A closed finite-key lookup is conflated with a broad runtime index ([[D2855]]).** The shipped
   `PROFILE_DEFAULTS[kind]` receiver is a closed `Readonly<Record<AssistanceProfile,
   AssistanceConfig>>`, and `kind` is the finite `AssistanceProfile` union. The projector rejects
   every non-literal element access before asking the checker whether its key set and target set are
   exact. This makes a normal adopted consumer unrepresentable rather than failing only genuinely
   broad or `any` lookup.
3. **Optional interface calls lose exact overload authority ([[D2856]]).** TypeScript resolves
   `storage?.setItem(...)` to the exact interface method signature, but the graph asks the nullable
   callable expression type for call signatures, obtains an empty set and refuses
   `resolution:overloads`. Both adopted save roots use that form. Optionality belongs to the call
   site syntax; it must not erase the compiler-selected method's declared overload set.

The two `Record<string, unknown>` reads are intentionally difficult: an index signature has no
exact named property declaration. The repair must not weaken the graph into accepting an
unresolved member. It must instead make the adopted parser boundary exact and representable—or
change the cross-RFC descriptor and source contract honestly under their own accepted process.

## Executed evidence

Three minimal committed TypeScript programs reproduce the three mechanisms against the thirteenth
author model. The target retains every predecessor review and author repair. A separate literal
projection audit over `planning/assistance-config-register/catalogue-additions.v1.json` measured the
4/8 and 2/10 root failures above; it changed no source or product byte.

## Required repair

Execute the real assistance and workflow descriptor candidates as permanent positive controls.
Preserve fail-closed treatment of genuinely open index signatures, while giving finite compiler-
enumerable keys an exact target set or rewriting the adopted parser surface to an exact declared
shape. Obtain optional-call overloads from the exact selected non-null method authority. Then run
another genuinely fresh review. No catalogue, checker, register or product implementation is
authorized.
