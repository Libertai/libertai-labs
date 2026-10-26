---
title: DeepSeek-V4.1-Flash-1017 NVFP4
summary: "A 400 GiB NVFP4 transcode of 1017 in NVIDIA's ModelOpt layout. The expert weights are bit-exact; the Engram tables are lossy at cosine 0.9934. Not yet served by us."
status: preview
order: 3
date: 2026-10-17
baseModel: deepseek-ai/DeepSeek-V4.1-Flash-1017
weights: https://huggingface.co/LibertAIDAI/DeepSeek-V4.1-Flash-1017-NVFP4
license: MIT
metrics:
  - label: Repo size
    value: 399.5 GiB
    note: from 475.2 GiB, -15.9%
  - label: Expert scales
    value: Bit-exact
    note: 33,973,862,400 of 33,973,862,400 in window
  - label: Engram cosine
    value: "0.9934"
    note: lossy, no end-to-end eval
  - label: Tensor layout
    value: "188,245"
    note: 0 differences vs NVIDIA
  - label: Activation scales
    value: "46,080"
    note: lifted from NVIDIA V4.1 calibration
links:
  - label: EXL3 2.9bpw, served on two Sparks
    href: /models/dsv41-flash-1017-exl3-29bpw
  - label: Upstream 1017 weights
    href: https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017
---

DeepSeek-V4.1-Flash-1017 already ships in a 4-bit format. Its routed experts are E2M1 nibbles with E8M0 block scales, its Engram tables are FP8 with the same block layout, and only attention, the shared experts and the embeddings stay wider. The usual BF16 to NVFP4 recipe has nothing to compress here. NVFP4 on this model is a transcode and a compatibility shim for engines whose Blackwell MoE kernels want the NVIDIA layout.

The first pass proved that a transcode can be lossless. NVFP4's 16-element blocks are a strict refinement of the source's 32-element blocks, so both half-blocks can inherit one source scale. Emitting the nibbles unchanged and forcing `weight_scale * weight_scale_2` to equal the source scale reproduces every value exactly. The cost is size: experts grow 5.9% because each 32-element scale becomes two E4M3 scales. That half is bit-exact and buys no space.

The size comes from the Engram tables. Each is a single 94.42 GiB tensor of roughly 384M rows by 256 columns. Storing them as E2M1 with the source block layout halves each table to 48.64 GiB and halves the SSD traffic per token, because Engram is a hashed n-gram gather. It is also the one lossy step: cosine is 0.993415 on layer 1 and 0.993446 on layer 14 over 1.5M sampled rows per table, and no engine could run the architecture when the first build was made. That accuracy claim has no end-to-end evaluation behind it.

The published revision matches `nvidia/DeepSeek-V4.1-Flash-NVFP4`'s layout, so the same loader flags apply. `config.json` and `hf_quant_config.json` are byte-identical to NVIDIA's. Experts are W4A4 with 46,080 per-projection activation scales lifted from NVIDIA's V4.1 calibration, since no vendor calibration exists for 1017. NVIDIA left 18 fallback scales at the model-wide maximum; for the 12 gate and up projections we take the maximum of the other experts in the same layer instead, and keep NVIDIA's value for the six down projections, where an overestimate never clips. MTP experts stay in MXFP4. All 3,921 pass-through tensors are byte-identical to the source.

We have not served this checkpoint. The documented path is vLLM with MXFP4 Engram support (PR #61530), on a Blackwell configuration NVIDIA sizes at 4× GB300. The open item is a calibration pass on 1017 activations to replace the lifted V4.1 scales. Until that lands, the repo makes no throughput, quality or serving claim.
