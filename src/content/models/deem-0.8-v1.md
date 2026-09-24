---
title: Deem 0.8B
summary: "The full Deem decision stack on CPU. Typed, calibrated choices, scores, and yes/no decisions served by our own Rust runtime. No GPU required."
status: shipped
order: 1
date: 2026-09-24
baseModel: Qwen/Qwen3.5-0.8B
weights: https://huggingface.co/LibertAIDAI/deem-0.8-v1
metrics:
  - label: Long-policy hold-out
    value: 96.3%
    note: trap/adversarial items 91.8%
  - label: Short-form latency
    value: 362ms
    note: contended desktop CPU
  - label: Resident memory
    value: 0.9GB
    note: int8 path, 1.6GB bf16-exact
  - label: Exact-law zero-count
    value: "1.000"
    note: counting 0.976, grid 0.984
links:
  - label: Model card
    href: https://huggingface.co/LibertAIDAI/deem-0.8-v1
  - label: Code and Rust runtime
    href: https://github.com/Libertai/deem
  - label: Paper
    href: /papers/deem-open-machine-reflexes
---

Decisions, anywhere. Deem 0.8B is the CPU-native sibling of Deem 9B: the same typed, calibrated decision stack on a Qwen3.5-0.8B full fine-tune over the ground-truth-verified mixture, served by a single static Rust binary. No Python, no C++ dependencies at runtime.

The runtime carries hand-written AVX-512 kernels, bf16 (`vdpbf16ps`) and int8 (`vpdpbusd`) GEMM lanes, and is parity-gated against PyTorch to the bf16 noise floor (max letter-logit diff 0.085). The wire format is `/v1/systemone`, drop-in compatible with the TypeSafe SDK. It runs where GPUs do not: CI runners, edge boxes, laptops, serverless micro-VMs.

Its external hard-split number is 33.3, stated plainly; its strength is the long-policy domain, where 96.3% hold-out accuracy and 91.8% on trap items make it the deployable one. All benchmarks are reproducible from the release artifacts.
