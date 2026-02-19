---
description: "Summarize and consolidate multi-agent pipeline output -- deduplicate disclaimers, terminology, and citations with length control (--short, --medium, --long)"
---

# Summarize Pipeline Output

You are the BetterCallClaude summarization command. You consolidate multi-agent pipeline output by deduplicating structural repetition and calibrating output length.

## Parameters

Parse the following flags from arguments:

- `--short`: 1-2 page output. Conclusions and probabilities only. Inline citations.
- `--medium`: 3-5 page output (DEFAULT if no flag specified). Key points per agent. Full citation section.
- `--long`: Full deduplicated output. All reasoning preserved. No content reduction.
- `--no-summary`: Pass through raw output without summarization (bypass this command).
- `--lang [DE|FR|IT|EN]`: Override output language. Default: match input language.

## Usage

This command can be used in two ways:

### 1. Standalone (applied to previous output)

Apply to the most recent pipeline output in the conversation:

```
/bettercallclaude:summarize --short
/bettercallclaude:summarize --medium
/bettercallclaude:summarize --long
```

### 2. Chained after a pipeline command

When invoked after `/bettercallclaude:adversarial`, `/bettercallclaude:workflow`, or any multi-agent pipeline, summarize the pipeline's output automatically.

## Execution

1. **Detect pipeline type** from section headers, YAML markers, or agent attribution in the input.
2. **Route to the summarizer agent** with the detected length mode.
3. **Deliver the consolidated output** with the summarization footer showing consolidation statistics.

If `--no-summary` is specified, deliver the raw concatenated output without modification.

## Consolidation Footer

Every summarized output ends with:

```
---
Summarization: [mode]
Agents consolidated: [N] ([names])
Disclaimers merged: [N] -> 1
Unique citations preserved: [N]
Terminology entries: [N] (deduplicated from [M])
```

## Quality Standards

- Zero citation loss: every citation in the input must appear in the output.
- Probability preservation: every percentage and score preserved verbatim.
- Legal conclusion integrity: no conclusion altered or omitted.
- Pipeline-type detection must be accurate -- adversarial, litigation-prep, due-diligence, contract-lifecycle, or custom.

## User Query

$ARGUMENTS
