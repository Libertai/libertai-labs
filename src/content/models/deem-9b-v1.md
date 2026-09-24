---
title: Deem 9B
summary: "The strongest open decision model we know of. Typed, calibrated decisions on long state, from a letter-slot readout, in one prefill pass."
status: shipped
order: 0
date: 2026-09-24
baseModel: Qwen/Qwen3.5-9B-Base
weights: https://huggingface.co/LibertAIDAI/deem-9b-v1
metrics:
  - label: JevBench hard (composite)
    value: "65.8"
    note: single-pass 54.1, extended 68.9
  - label: JevBench easy / original
    value: "100.0 / 91.7"
  - label: Judge-tier verification
    value: "16/17"
  - label: Long-state P50
    value: 788ms
    note: 3,222-token state, edge GPU
  - label: Short-form P50
    value: 103ms
links:
  - label: Model card
    href: https://huggingface.co/LibertAIDAI/deem-9b-v1
  - label: Code and serving stack
    href: https://github.com/Libertai/deem
  - label: Paper
    href: /papers/deem-open-machine-reflexes
---

Deem 9B reads your state (a policy, contract, ticket, or question) and returns a typed, calibrated decision: Choice over 2 to 255 options, Score on 2 to 10 ordered levels, or Noul (yes/no) with abstention. One forward pass, prefill-only, no decode phase.

The shipped configuration is confidence-gated: a direct pass always runs, and a chain-of-thought pass triggers when the direct readout's entropy exceeds a threshold. 58% of items resolve in a single pass; the rest pay for extended reasoning. The composite JevBench numbers on the model card use tier routing (direct on easy, extended elsewhere); every mode is stated with its number, and the single-pass figure is 54.1 hard, published next to the composite.

Every training domain is ground-truth verified: generator-built states with labels by construction, including GenRM-style verification traces that took a judge yes-bias from 9/17 to 16/17 in one training cycle. Measured on JevBench public (231 items), never trained on. Apache-2.0 recipe, start to finish.
