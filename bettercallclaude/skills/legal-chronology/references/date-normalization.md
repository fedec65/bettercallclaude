# Date Normalization — DE / FR / IT / EN → ISO

Rules for normalising dates found in case documents to ISO `YYYY-MM-DD` with a precision level. Normalisation is deterministic: never guess missing components.

## Precision Levels

| Input example | `date` | `precision` | Display (DE) |
|---|---|---|---|
| "3. März 2024" | `2024-03-03` | `day` | 3.3.2024 |
| "März 2024" | `2024-03-01` | `month` | März 2024 |
| "im Jahr 2024" | `2024-01-01` | `year` | 2024 |
| undated fact | — | `unknown` | undatiert |

The first-of-period date exists only for sorting; rendering MUST respect `precision` and never show a fake day ("1.3.2024" for a March-only source).

## Month Names

| # | DE | FR | IT | EN |
|---|---|---|---|---|
| 01 | Januar, Jan. | janvier | gennaio | January |
| 02 | Februar, Feb. | février | febbraio | February |
| 03 | März | mars | marzo | March |
| 04 | April | avril | aprile | April |
| 05 | Mai | mai | maggio | May |
| 06 | Juni | juin | giugno | June |
| 07 | Juli | juillet | luglio | July |
| 08 | August | août | agosto | August |
| 09 | September | septembre | settembre | September |
| 10 | Oktober | octobre | ottobre | October |
| 11 | November | novembre | novembre | November |
| 12 | Dezember | décembre | dicembre | December |

## Patterns

- **DE**: `3. März 2024`, `3.3.2024`, `03.03.24` → day precision. Swiss numeric format is ALWAYS `day.month.year` — `3.4.2024` is 3 April, never 4 March.
- **FR**: `le 3 mars 2024`, `3 mars 2024`, `03.03.2024`, `3/3/2024` → day precision (drop articles "le/du").
- **IT**: `3 marzo 2024`, `il 3 marzo 2024`, `3.3.2024` → day precision.
- **EN**: `3 March 2024`, `March 3, 2024`, `3 March 2024 (sic)` → day precision. English numeric `03/04/2024` is ambiguous: default to Swiss convention (day first) and note the ambiguity in the event's `note`.
- **Two-digit years**: `24` → 2024 when the document context is post-2000; if the case spans 1900s/2000s, resolve from context and flag low confidence.
- **Relative dates** ("10 days after delivery", "innert 10 Tagen"): do NOT compute silently. Record the anchor event id in `note`; compute only if the anchor date is known, and mark `precision` of the anchor.
- **Document date vs fact date**: a letter dated 5.4.2024 describing a delivery on 3.3.2024 yields TWO events (delivery 3.3; letter 5.4), each with its own source.
- **Ranges** ("between March and April 2024"): store earliest as `date` with `precision: month` and record the range in `note`.

## Display Formats (render layer)

| Language | Format |
|---|---|
| DE | `3.3.2024` |
| FR | `3.3.2024` (or `3 mars 2024` in prose headers) |
| IT | `3.3.2024` |
| EN | `2024-03-03` |

Data layer is always ISO; display conversion happens only at render.
