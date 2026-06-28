# Loop Profiles — Goal Templates

These are the five pre-wired profiles that `/legal-goal` can instantiate by name. Each profile is a ready-made Goal Record template with pre-configured worker, evaluator, success conditions, and MCP checks.

---

## Profile: `citations-clean`

**Anti-hallucination gate (flagship)**

```yaml
profile: citations-clean
title: "Citation Integrity — Zero Unverified References"
worker: <the drafting agent or whoever produced the document>
evaluator: citation-specialist
success_condition: |
  Every citation in the artifact validates via validate_citation / review_citations;
  every citation string traces to a retrieval tool result (R1 — no self-constructed citations);
  every quotation traces verbatim to a source field (R2 — no fabricated quotes);
  zero unresolved or malformed references.
mcp_checks:
  - validate_citation
  - review_citations
  - extract_citations
  - standardize_document_citations
max_iterations: 5
pass_threshold: 100
scoring: "(valid citations / total citations) * 100"
notes: |
  Clearest worker≠judge case. The drafter writes; the citation-specialist verifies.
  Strongest legal-quality win — a wrong citation in a Swiss court filing is malpractice.
  On fail: each bad citation, its location, and the failed check are returned to the worker.
```

---

## Profile: `draft-passes-gate`

**Drafting quality gate**

```yaml
profile: draft-passes-gate
title: "Draft Quality Gate — Structure, Citations, and Claims"
worker: swiss-legal-drafter (or via /draft command)
evaluator: swiss-judicial-analyst
success_condition: |
  1. All citations valid (reuse citations-clean logic);
  2. Required Gutachten/Erwägung structure present;
  3. All playbook-mandated clauses present;
  4. No factual claim unsupported per check_claim_support.
mcp_checks:
  - validate_citation
  - review_citations
  - check_claim_support
  - attest_response
max_iterations: 5
pass_threshold: 100
scoring: "Weighted average: citations (40%) + structure (30%) + claims (30%)"
notes: |
  Combines citation integrity with structural and factual completeness.
  The judicial-analyst evaluates holistically — not just citations but also
  whether the document meets Swiss legal document standards.
```

---

## Profile: `adversarial-converge`

**Stress-test to convergence**

```yaml
profile: adversarial-converge
title: "Adversarial Convergence — Position Robustness"
worker: swiss-legal-advocate (strengthens the position)
evaluator: swiss-legal-adversary + swiss-judicial-analyst
success_condition: |
  No unaddressed weakness above severity threshold remains,
  OR the judicial robustness score stabilises across two consecutive
  iterations (delta below 5 points).
mcp_checks:
  - search_decisions (counter-precedent verification)
  - search_bge (BGE line verification)
  - validate_citation (cited authorities)
max_iterations: 5
pass_threshold: 85
scoring: |
  Robustness score from judicial analyst synthesis (0-100).
  Convergence: if |score[n] - score[n-1]| < 5 for two consecutive iterations,
  consider the position stabilised and pass.
notes: |
  Turns the single-pass advocate→adversary→judge pipeline into an iterative
  stress-test. The advocate strengthens; the adversary + judge evaluate.
  Convergence means the position is as robust as it can be made.
  The worker (advocate) never sees the adversary's full reasoning —
  only the unaddressed weaknesses (findings).
```

---

## Profile: `nda-batch-clean`

**Triage completeness gate**

```yaml
profile: nda-batch-clean
title: "NDA Batch Triage — Complete Classification"
worker: nda-triage (over a folder)
evaluator: swiss-judicial-analyst (triage-completeness check)
success_condition: |
  Every document in the batch is classified GREEN/YELLOW/RED;
  every deviation from playbook thresholds is mapped and flagged;
  zero unclassified documents;
  zero unflagged off-threshold clauses.
mcp_checks:
  - validate_citation (for any cited legal basis)
  - Document verification against playbook thresholds
max_iterations: 3
pass_threshold: 100
scoring: "(classified + fully flagged items / total items) * 100"
notes: |
  Lower max_iterations because batch triage is relatively deterministic —
  if a document fails classification, the issue is usually clear.
  The evaluator checks completeness, not the triage decision quality
  (which is the worker's domain expertise).
```

---

## Profile: `reg-watch`

**Scheduled regulatory monitoring**

```yaml
profile: reg-watch
title: "Regulatory Watch — Topic Coverage Check"
worker: Query step against Fedlex (fedlex-sparql) / swiss-caselaw for changes
evaluator: swiss-judicial-analyst (relevance judge)
success_condition: |
  All watched topics have been checked against current sources;
  a relevance decision (material / not material) is recorded for each change found;
  only material changes are surfaced in the final report.
mcp_checks:
  - search_legislation (fedlex-sparql)
  - search_decisions (swiss-caselaw / entscheidsuche)
  - get_article (for changed provisions)
max_iterations: 1
pass_threshold: 100
scoring: "(topics checked with relevance decision / total watched topics) * 100"
notes: |
  Designed for scheduled (cron-style) invocation — e.g., each morning.
  max_iterations=1 means: one work pass (check all topics) + one verdict pass
  (verify completeness). If incomplete, it reports NOT MET rather than looping,
  because the likely cause is a data source issue, not a fixable artifact defect.
  
  Scheduling integration:
  - Use Claude scheduled tasks or a cron-equivalent to invoke:
    /legal-goal reg-watch --target="<watched-topics-file>"
    /legal-loop <goal-id>
  - The watched topics file lists legal areas/provisions to monitor.
  - Results persist in bcc-output/loops/ for the user's morning review.
```

---

## Custom Goals (Free-Text)

When `/legal-goal` receives free-text instead of a profile name, it should:

1. Identify the checkable predicates in the objective
2. Map them to available MCP tools
3. Select an appropriate evaluator (different from the implied worker)
4. Set reasonable defaults (max_iterations=5, privacy from config)
5. Present the assembled Goal Record for confirmation

The Goal Record format is identical; only `profile: custom` distinguishes it from the pre-wired profiles.
