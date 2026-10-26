---
title: "What reasoning effort buys on DeepSeek-V4.1-Flash-1017"
date: 2026-10-19
summary: "We ran 3,738 graded jobs across six suites at low, high and max effort. Max does not buy measurable quality over high on most work, and in agent loops the extra reasoning is re-read on every turn."
---

DeepSeek-V4.1-Flash-1017 accepts a `reasoning_effort` field with three named levels: `low` (50), `high` (75) and `max` (100). The model's chat template defaults to `high`. Our gateway was sending `max` on the `-thinking` variant, so we ran the comparison on the production backend to decide whether that default was buying anything.

The run covered 3,738 graded jobs across agentic coding, agentic competitive programming, agentic tool use, single-turn coding, math and short chat tasks. There were no API errors and no harness errors. All three efforts ran shuffled together against the same server, so each saw the same background load.

## The short version

| suite | low | high | max | cost low / max | cost high / max |
|---|---|---|---|---|---|
| Agentic coding, Exercism (136) | 100% | 100% | 100% | 0.53 | 0.79 |
| Agentic competitive programming, LCB-hard (80) | 93.8% | 91.2% | 93.8% | 0.58 | 1.08 |
| Agentic tool use, tau-bench retail (230) | 80.4% | 82.6% | 77.0% | 0.94 | 0.97 |
| Single-turn coding, LiveCodeBench v6 (240) | 90.4% | 90.4% | 90.8% | 0.62 | 0.79 |
| Math, AIME 2025 and 2026 (240) | 98.8% | 99.2% | 99.6% | 0.48 | 0.66 |
| Short chat, IFEval and TriviaQA (320) | 93.8% | 94.1% | 93.4% | 0.40 | 0.55 |

Cost ratios are billed dollars relative to `max` on the same tasks and seeds, from paired 95% cluster-bootstrap intervals. The two suites with headroom tell a mixed story. On tau-bench, `high` beats `max` by 5.7 points with an interval that excludes zero. On the hard subset of single-turn LiveCodeBench, `max` beats `high` by 6 points with an interval that excludes zero. Across six suites and fourteen paired contrasts, one or two borderline results are what noise alone produces, so we read both as no reliable difference.

The practical result: `max` is never clearly better than `high` outside that one hard coding subset, and it costs more everywhere. Summed over the 1,246 jobs per effort, the bill was $22.24 at `low`, $32.97 at `high` and $35.96 at `max`.

## Agent loops pay twice

The gap is largest where the agent uses tools. When any message in the conversation carries a tool definition, the V4.1 encoder keeps every earlier turn's reasoning in the prompt instead of dropping it. The model re-reads its own past deliberation on every turn, and a higher effort adds output once and then charges for that output again on each later turn.

On Exercism, `max` ran 6.0 turns against 4.8 at `low`, and read 28.0K prompt tokens per episode against 16.9K. Re-read reasoning was 23% of the prompt at `max` and 8% at `low`, and input made up 57 to 65% of the bill. `low` solved every task at 0.53 times the cost of `max`.

Agentic LiveCodeBench is the extreme case. Re-read reasoning was 74 to 78% of all prompt tokens at every effort, with a single episode reading between 0.33M tokens at `low` and 0.63M at `high`. `low` cost 0.58 times `max` at the same solve rate. `high` and `max` cost about the same because `high` ran as many turns and hit the 40-turn cap on a few very long episodes.

Our server has no cached-token discount, so every re-read token is billed at full input price. With prefix caching, most of that compounding cost would disappear and output tokens would drive the comparison.

## Latency

| | low | high | max |
|---|---|---|---|
| Chat, median / mean / p99 seconds | 2.1 / 4.0 / 26 | 2.6 / 5.4 / 31 | 4.1 / 9.7 / 114 |
| Single-turn coding, median / mean seconds | 9.0 / 35.0 | 13.1 / 44.3 | 17.6 / 56.4 |
| AIME, median / mean seconds | 11.8 / 24.6 | 15.6 / 33.0 | 32.5 / 51.3 |
| Agentic Exercism, model time per episode, median / p90 seconds | 3.1 / 9.4 | 5.1 / 14.0 | 8.4 / 22.1 |

These were measured on production with 12 of our own streams against light live traffic. They compare efforts within this run, not an absolute service-level target.

## The failure mode is the tail

The mean chat cost at `max` came from a small number of very long generations, not from uniform extra work. Median chat output was 39, 44 and 58 tokens at low, high and max, while the mean was 61, 357 and 688. One trivia question the model could not place ran to roughly 32,000 tokens in both `max` seeds, and one hit the cap and failed. `low` answered it correctly in 136 to 160 tokens. An IFEval prompt asking for a JSON dump of facts about Messi hit 32,000 tokens and failed in both `max` seeds, while `low` and `high` finished it in 10,600 to 14,000 tokens and passed.

There were no literal repetition loops. Every max_tokens hit compressed above 0.15 with zlib over the last 20K reasoning characters, and the lowest value in the whole run was 0.19.

## What we changed

The gateway now sends `high` for the `-thinking` variant. DeepSeek's own template default is `high`, so clients that send nothing were already there. `thinking.py` uses `setdefault`, so an explicit `reasoning_effort: max` from a client still wins. `low` has as much evidence behind it as `high` and is cheaper still, but the `-thinking` variant is what people choose when they want headroom, so we did not make it the default.

## Caveats

Exercism and AIME are at ceiling for this model, which makes them useful for showing that lower effort costs no quality and useless for detecting small losses. AIME 2025 and 2026 and the LiveCodeBench problems predate the 1017 checkpoint, which affects absolute scores more than the comparison between efforts. The tau-bench customer is simulated by the same model with thinking off, and retail tau-bench has known label noise. The coding agent is a minimal four-tool Python harness, so real clients with larger system prompts and tool schemas will dilute the effort effect on cost. Only the named levels 50, 75 and 100 were tested; intermediate values are accepted by the encoder but untested here. Latency was not measured as a service-level number.

The harness itself is not hardened for untrusted code. It ran our own model once on a disposable rental, and the published copy adds `O_EXCL`, `O_NOFOLLOW` and `fchown` on test files. Do not reuse it on arbitrary models or a shared host without per-episode isolation.
