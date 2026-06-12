---
title: "Multi-token prediction on NVFP4 quants: a win, and a break-even"
date: 2026-05-26
summary: We added MTP draft-head variants of the Qwen3.6 NVFP4 builds. The dense 27B gains 22% generation throughput, the MoE gains nothing yet, and both model cards say so.
---

Shortly after our NVFP4 launch, llama.cpp shipped multi-token prediction support for Qwen3.6 ([PR #22673](https://github.com/ggml-org/llama.cpp/pull/22673)) along with NVFP4 scale-tensor support for the MTP block ([PR #23563](https://github.com/ggml-org/llama.cpp/pull/23563)). MTP lets the model draft several tokens per step and verify them in one pass, which is the same bet as speculative decoding but with a draft head the model was trained with.

We published split builds for both Qwen3.6 models: the NVFP4 trunk in one file and the MTP draft head in another. The head is small (about 5 GB for the dense 27B, 3.5 GB for the MoE) and stays in BF16, because draft-accept rate is the whole game and the head is cheap to keep precise.

One toolchain note that cost us time: native Blackwell NVFP4 MMA for the MTP path needs CUDA 13.0, since sm_120 is absent from the 12.x toolkits. Our original launch build had compiled for sm_86 and ran NVFP4 through PTX JIT, which worked but left performance on the table.

## Results

Benchmarked in our production server configuration (256k context, flash attention, quantized KV cache):

| Model | Baseline | MTP default | MTP tuned | Verdict |
| --- | --- | --- | --- | --- |
| Qwen3.6-27B (dense) | 74.4 tok/s | 90.8 tok/s (+22%) | not needed | Clean win |
| Qwen3.6-35B-A3B (MoE) | 252.9 tok/s | 184.8 tok/s (-27%) | 248.6 tok/s (-2%) | Break-even at best |

Draft accept rates were healthy in both cases, around 70% for the dense model and 66% for the MoE. The asymmetry has the same shape as the NVFP4 results themselves: the MoE base model is already so fast at roughly 250 tokens per second with 3B active parameters that the per-step cost of running and verifying the draft head exceeds what the accepted drafts save. Less aggressive drafting recovers it to break-even, and upstream MoE optimizations should eventually flip it.

Both repos shipped with these numbers stated plainly in the model cards. A speedup table that only contains the dense result would have been more marketable and less true.
