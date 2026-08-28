---
title: GLM-5.3-Flash on vLLM, on GB10
summary: A hand-written sparse-MLA CUDA kernel for sm_121 and a fix for vLLM's uninitialised NVFP4 MoE activation scale, which together take GLM-5.3-Flash from degenerate output to correct serving on a two-node DGX-Spark-class cluster.
status: research
order: 7
links:
  - label: Recipe and kernel
    href: https://github.com/Libertai/glm53-flash-vllm-gb10
  - label: Model
    href: https://huggingface.co/LibertAIDAI/GLM-5.3-Flash-NVFP4
---

GLM-5.3-Flash is a 320B mixture of experts with 18B active parameters, a hybrid attention stack of 34 linear-attention layers and 11 DeepSeek-sparse-attention layers, and no rotary embeddings on its MLA path. That last property is what broke it. On GB10, which is compute capability 12.1, every vLLM MLA prefill backend rejects the model's `(256, 0, 256)` head dimensions, and the only sparse decode backend requires a packed KV layout whose cache kernel asserts that the rope dimension is exactly 64. Our checkpoint has none. vLLM would load the model, allocate its KV cache, serve an API, and answer every prompt with a single token repeated until the limit.

We wrote a sparse-MLA kernel for sm_121 to close that gap, and it did close it, but the model still produced the same degenerate output. The second fault turned out to sit in the mixture of experts. vLLM's `ModelOptNvFp4FusedMoE` registers the activation scale as an uninitialised tensor and expects the checkpoint to fill it. A weight-only NVFP4 checkpoint carries no activation scales at all, so the value stayed at zero, and the dequantisation alpha for every expert became `weight_scale_2 * 0`. The entire mixture of experts was multiplied by zero and the model ran on attention and the shared expert alone.

Either fault alone leaves the model degenerate, which is why this took so long to find. Changing attention backends never changed the output, because the experts were zeroed either way, and that reads as evidence that attention is innocent when it is not.

## What the kernel does

It is a single-pass gathered sparse attention over the indexer's top-k selection, written for the shared-memory budget GB10 actually has. Datacenter Blackwell offers about 227 KB of opt-in shared memory per block and GB10 offers 101,376 bytes, so the stock tiles do not fit. The kernel uses `mma.sync` tensor cores with `ldmatrix` for every operand, a register-resident software pipeline over the indexed gather, and it runs prefill and decode through the same code path. Causality belongs to the indexer rather than the kernel, which is what lets paged physical slot identifiers be passed straight through.

It also fixes two defects in the reference kernel it replaces: an out-of-bounds read on the mask sentinel, and an all-NaN result for a token whose entire top-k selection is masked.

## Numbers, including the ones that are not wins

Measured at concurrency 1, medians of five runs.

| Configuration | tok/s |
| --- | --- |
| vLLM, this work, no speculative decoding | 14.46 |
| vLLM, this work, MTP with 3 speculative tokens | 24.04 |
| SGLang, no speculative decoding | 14.95 |
| SGLang with NEXTN MTP, the production lane | about 25 |

The kernel is not the limiter at concurrency 1. At 14.46 tok/s the lane sits on the memory-bandwidth wall for an 18B-active model on this hardware, and it matches the SGLang baseline almost exactly. Speculative decoding is what moves the number, and with it vLLM reaches parity with SGLang rather than beating it. Speculative decoding was itself unavailable before this work, because the workaround it replaces changed the head size that the draft layer depends on.

SGLang remains the production lane on this cluster today.

## Upstream

The mixture-of-experts fault is not specific to GB10, and the community reports that frame it that way are describing a symptom. The trigger is a weight-only NVFP4 checkpoint, and the same code path should misbehave on datacenter Blackwell. vLLM's NVFP4 linear methods already refuse such a checkpoint with a clear error, while the mixture-of-experts method accepts it and computes with uninitialised memory. That inconsistency is the bug, and a draft report is in the repository.
