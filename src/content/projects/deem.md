---
title: Deem
summary: "An open-weight System One decision model family: typed, calibrated decisions (Choice, Score, Noul) over long unstructured state, read from a letter slot in one prefill pass. Shipped as deem-9b-v1 and a CPU-native deem-0.8-v1."
status: shipped
order: -1
links:
  - label: Paper
    href: /papers/deem-open-machine-reflexes
  - label: Deem 9B
    href: /models/deem-9b-v1
  - label: Deem 0.8B
    href: /models/deem-08-v1
  - label: GitHub repo
    href: https://github.com/Libertai/deem
  - label: Weights on Hugging Face
    href: https://huggingface.co/LibertAIDAI/deem-9b-v1
---

Deem does not generate text. You send it a state (text, JSON, or images) plus typed
questions, and it returns calibrated probability distributions in a single forward
pass: **Choice** over 2 to 255 options, **Score** on 2 to 10 ordered levels, **Noul**
for yes/no with abstention.

The category is new; TypeSafe's Jev proved the market and a wave of clones proved
the architecture is a commodity. Deem is the open answer:

- **Letter-slot cross-encoder readout.** Decisions are read from an answer slot in
  a single prefill pass, no decode phase, no novel heads, on a fully fine-tuned
  Qwen3.5 backbone. A short-form decision reads at P50 103ms on a low-power edge
  GPU; a 3,222-token policy at 788ms.
- **Ground-truth-first training.** Programmatic generators provide labels by
  construction; teacher distillation is augmentation, never the reference. An
  honest teacher study (pilot passed, scale failed) drove the debiasing machinery
  that the whole distillation pipeline now runs.
- **Measured honestly.** Two failure modes of decision SFT were caught by
  pre-registered consistency gates, not accuracy gates, and fixed with one-line
  data changes. External numbers are on JevBench public, never trained on, with
  single-pass results published next to composites.

The released checkpoints are **deem-9b-v1** (JevBench hard 65.8 composite, 68.9
extended reasoning, 54.1 single-pass, judge-tier 16/17) and **deem-0.8-v1**
(96.3% long-policy hold-out, 362ms on CPU through our AVX-512 Rust runtime). Both
ship Apache-2.0 with the complete Tare benchmark harness and a
`/v1/systemone`-compatible serving stack.
