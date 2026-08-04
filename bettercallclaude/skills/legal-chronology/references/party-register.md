# Party Register — Normalisation Rules

The party register maps every name variant found in the documents to one normalised party. All events reference normalised names only.

## Register Shape

```json
{
  "parties": [
    {
      "name": "Muster AG",
      "aliases": ["Muster AG, Zürich", "la Muster AG", "die Beklagte", "Muster S.A.", "Muster"],
      "role": "Beklagte / défenderesse",
      "kind": "legal-entity"
    },
    {
      "name": "Meier",
      "aliases": ["Herr Peter Meier", "M. Meier", "der Kläger", "il sig. Meier"],
      "role": "Kläger / demandeur",
      "kind": "natural-person"
    }
  ]
}
```

## Normalisation Rules

1. **Seed first**: `--parties=A,B,...` seeds the register before extraction; aliases accumulate as documents are read.
2. **Legal entities**: keep the legal form suffix and pick ONE canonical form — `Muster AG` (DE) / `Muster SA` (FR) / `Muster SA` (IT) normalise to the registered seat's form (commercial register form if known: usually the DE form for ZH-seat entities). Note the chosen form; do not mix forms in events.
3. **Natural persons**: `Family name` only in normalised form ("Meier"); full names ("Peter Meier") stay aliases. If two persons share a surname, normalise to "Meier P." / "Meier M." and flag the collision in the report.
4. **Procedural labels**: "Kläger/Beklagte", "demandeur/défenderesse", "attore/convenuto", "ricorrente" are aliases of the party they designate in that filing — resolve them to the normalised name and keep the label as alias.
5. **Third parties**: courts, experts, authorities, witnesses are NOT parties — record them under a separate `third_parties` list; they may appear in event text but not in `parties`.
6. **Unknown party**: if a document introduces a name that matches nothing, add a provisional entry flagged `provisional: true` and report it for user confirmation.
7. **Language variants**: normalise across languages ("die Muster AG", "la Muster SA", "la ditta Muster") to the one canonical name.

## Usage in Events

- `parties` field: normalised names involved in the event.
- `attribution` strings: normalised names ("Muster AG alleges …; Meier disputes …").
- Event text: normalised names; original wording stays in the source document, not in the event.
