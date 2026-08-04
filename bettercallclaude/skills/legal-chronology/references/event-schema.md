# Event Schema — legal-chronology

Canonical JSON schema for timeline events. The renderer (`scripts/timeline-render.mjs validate`) enforces the mandatory parts.

## Schema

```json
{
  "id": "evt-0001",
  "date": "2024-03-03",
  "precision": "day | month | year | unknown",
  "event": "One-sentence neutral factual description.",
  "source": [
    {"doc": "01-vertrag", "locus": "p. 2, Ziff. 4.1"}
  ],
  "status": "undisputed | alleged | contested",
  "attribution": "Party A alleges X; Party B disputes / is silent. (required unless undisputed)",
  "parties": ["Muster AG", "Meier"],
  "conflicts": [
    {"date": "2024-03-03", "source": {"doc": "01-vertrag", "locus": "Ziff. 4.1"}},
    {"date": "2024-03-10", "source": {"doc": "02-brief", "locus": "p. 1, para. 2"}, "note": "delivery dated differently"}
  ],
  "deadline_markers": [
    {"kind": "procedural | verjaehrung", "label": "Berufung (ZPO 30d)", "due": "2024-04-29", "basis": "compute_deadlines | mapping-table (indicative)", "anchored_to": "evt-0007"}
  ],
  "tags": ["contract", "delivery", "notification"]
}
```

## Field Rules

- `id`: stable `evt-NNNN`, assigned at merge time; never reused after deletion.
- `date`: ISO `YYYY-MM-DD`. For `precision: month` use the first of the month in `date` and keep `precision: month` (display renders "March 2024"). For `precision: year`, same with January 1. `precision: unknown` is allowed ONLY for candidates — the renderer excludes unknown-date events from the timeline body and lists them under "Undated sourced facts".
- `event`: one sentence, neutral. No argumentation, no legal qualification ("allegedly" belongs in `attribution`, not in `event`).
- `source`: **mandatory, non-empty**. Every entry: `doc` (document id from the inventory) + `locus` (page/paragraph/section as precise as the document allows). Multiple entries for multilingual/multi-document attestations of the same event.
- `status`:
  - `undisputed` — all sources agree; no party denial on record.
  - `alleged` — one party asserts; the other is silent. `attribution` required.
  - `contested` — asserted and denied. `attribution` required ("A alleges …; B disputes …").
- `conflicts`: present when sources date the same event differently. Contains EVERY dated variant with its source. The `date` field holds the earliest variant for sorting; the conflict flag drives rendering of all variants.
- `deadline_markers.kind`: `procedural` (compute_deadlines-backed) or `verjaehrung` (mapping-table, indicative).
- `tags`: free-form, used for HTML filtering.

## Valid Example

```json
{
  "id": "evt-0003",
  "date": "2024-03-03",
  "precision": "day",
  "event": "Lieferung der Maschine an das Werk des Käufers.",
  "source": [
    {"doc": "01-vertrag", "locus": "Ziff. 4.1"},
    {"doc": "02-brief", "locus": "p. 1, al. 2"}
  ],
  "status": "contested",
  "attribution": "Muster AG alleges delivery on 3.3.2024; Meier disputes proper delivery.",
  "parties": ["Muster AG", "Meier"],
  "conflicts": [
    {"date": "2024-03-03", "source": {"doc": "01-vertrag", "locus": "Ziff. 4.1"}},
    {"date": "2024-03-10", "source": {"doc": "02-brief", "locus": "p. 1, al. 2"}}
  ],
  "tags": ["delivery"]
}
```

## Invalid Example (rejected by validate)

```json
{
  "id": "evt-0009",
  "date": "2024-05-01",
  "precision": "day",
  "event": "The defect was reported by phone.",
  "source": [],
  "status": "alleged",
  "parties": ["Meier"]
}
```

Rejected: empty `source`. No event without provenance — ever. If a fact cannot be tied to a document locus, it does not enter the timeline.
