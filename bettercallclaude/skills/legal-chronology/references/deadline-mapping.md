# Deadline Mapping — Event Types → Time Limits

Two distinct families. Keep them separate in output and never blur the distinction.

## A. Procedural Deadlines → `compute_deadlines` (MCP legal-persona)

Scope of the tool: ZPO Art. 142-149 and BGG Art. 46, 100-101. Input: `procedureType`, `notificationDate` (ISO), `canton` (holiday calendar), `language`. Output includes holidays, judicial recess (Gerichtsferien) suspension, weekend adjustment.

| Trigger event (examples) | `procedureType` |
|---|---|
| Service of first-instance judgment, appeal intended | `zpo_berufung_30` |
| Service of decision/order, Beschwerde at cantonal level | `zpo_beschwerde_10` |
| Order to file a statement (Stellungnahme) | `zpo_stellungnahme_20` |
| Service of decision subject to Einsprache | `zpo_einsprache_10` |
| Summary-procedure deadlines | `zpo_summarisch_10` / `zpo_summarisch_20` |
| Service of cantonal final judgment, BGG appeal | `bgg_beschwerde_30` |
| Constitutional complaint (subsidiäre Verfassungsbeschwerde) | `bgg_verfassungsbeschwerde_10` |

Rules:
- The anchoring event MUST be a sourced notification-type event ("notifica della sentenza del …", "Zustellung des Urteils vom …").
- `canton` comes from the case context (`--canton` or party register default); ask if unknown — the holiday calendar depends on it.
- Marker label includes basis: `Berufung (ZPO 321: 30 Tage) — compute_deadlines`.
- The tool's own disclaimer flows into output: auxiliary computation, not legal advice.
- NOT covered by the tool (StPO, VwVG, other acts): mark `procedural (out of tool scope — manual computation needed)`; do not fabricate a computation.

## B. Substantive Limitation (Verjährung / prescription) → Mapping Table (INDICATIVE)

`compute_deadlines` does NOT cover Verjährung. These markers are computed as `event date + period` and MUST be labelled **indicative — verify** (interruptions, waivers, and special rules can move the date).

| Claim / event type | Period | Basis |
|---|---|---|
| General contractual claim | 10 years | Art. 127 OR |
| Periodic payments (rent, interest), certain sales claims | 5 years | Art. 128 OR |
| Tort / extra-contractual damages | 3 years (relative, from knowledge) / 10 years (absolute) | Art. 60 OR |
| Unjust enrichment | 3 years (relative) / 10 years (absolute) | Art. 67 OR |
| Defects liability, sale of goods (notice dependent) | 2 years | Art. 210 OR |
| Warranty, immovable works (Bauwerk) | 5 years (defects noticed) | Art. 371 OR |
| Employment claims (wages etc.) | 5 years (Art. 128 OR) / per contract | Art. 341 OR, Art. 128 Ziff. 1 OR |
| Insurance claims | 5 years / 2 years (certain branches) | VVG |
| Property gains tax assessment (cantonal) | per cantonal law | StG des Kantons |

Rules:
- Always show: anchor event, basis article, computed date, **indicative** flag.
- Verjährung start can depend on knowledge (relative) — record what the anchor represents ("from knowledge of damage").
- If the case file suggests an interruption (acknowledgment of debt, payment, proceedings), note it — do NOT recompute silently.

## Output Marker Shape

```json
{
  "kind": "procedural | verjaehrung",
  "label": "Berufung (ZPO 321: 30 Tage)",
  "due": "2024-04-29",
  "basis": "compute_deadlines | mapping-table (indicative)",
  "anchored_to": "evt-0007"
}
```

No floating markers: every deadline anchors to a sourced event id.
