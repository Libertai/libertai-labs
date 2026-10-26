---
title: MiMo-V2.6-Flash-MOPD NVFP4
summary: "The first W4A4 NVFP4 transcode of Xiaomi's 309B MOPD model. Experts are bit-exact at 169.9 GiB, and the activation scales are inherited from the RL sibling. Not served yet."
status: preview
order: 5
date: 2026-09-28
baseModel: XiaomiMiMo/MiMo-V2.6-Flash-MOPD
weights: https://huggingface.co/LibertAIDAI/MiMo-V2.6-Flash-MOPD-NVFP4
license: MIT
metrics:
  - label: Weight size
    value: 169.9 GiB
    note: 129 shards
  - label: Expert values
    value: Bit-exact
    note: 302,795,194,368 identical codes
  - label: Index entries
    value: "145,273"
    note: 0 missing, 0 inexact scales
  - label: Activation scales
    value: "94"
    note: from the RL calibration
  - label: Serving
    value: Untested
    note: needs a vLLM image and patch
links:
  - label: Upstream MOPD weights
    href: https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Flash-MOPD
---

MiMo-V2.6-Flash-MOPD is Xiaomi's multi-teacher on-policy distillation upgrade of MiMo-V2.6-Flash-RL, with a targeted fix for tool-call repetition that matters for agent traffic. It is a 309B-parameter mixture of experts with 15B active, 48 layers, 256 experts at top-8, three MTP layers, a DFlash drafter, vision and audio encoders, and a 1M-token context.

Like V4.1-Flash, the source is already 4-bit. Experts ship as MXFP4; qkv, dense and MTP layers use FP8 block-128; only the output projection, router, embeddings and multimodal encoders stay BF16. There is no BF16 checkpoint to quantize from, so the ModelOpt streaming recipe used for GLM and Hy3 does not apply. Running it here would round values that are already rounded.

The transcode leaves the E2M1 codes untouched and rewrites the scales. Each source E8M0 scale covers 32 values; NVFP4 needs one E4M3 scale per 16, so the two half-blocks inherit the source exponent through a shared global scale. Gate and up share that global, which keeps the fused w13 exact. The maximum exponent span in this checkpoint is 13 octaves, inside the 17-octave range of exact powers of two in E4M3, and the build found zero inexact blocks.

Verification compared the output against an independent decode: 302,795,194,368 expert values carry identical codes, 889 of 889 non-expert tensors are byte-identical, the activation scale table matches, and all 145,273 index entries are present. A gold test ran the transcoder on the RL sibling and reproduced primitive-ai's published `weight`, `weight_scale` and `weight_scale_2` bytes exactly on 15 sampled tensors, including the generated quantized-layer list.

The weak point is the activation scales. The 94 values, one pair per layer for gate/up and down, are lifted from primitive-ai's RL calibration because they were constant across experts and no MOPD calibration existed. RL and MOPD have byte-identical configs and tensor names, so the recipe transfers, but the activations do not necessarily. Re-deriving them on MOPD is the obvious follow-up.

We have not served this repo. The known path is vLLM's per-model `mimo-v26` image plus a 21-line loader patch that bridges FP8 block scales. primitive-ai measured TP=2 on 2× RTX PRO 6000 96 GB fitting 131K context at a 0.95 memory fraction. The DFlash drafter was trained against RL weights, so its acceptance rate on MOPD is unmeasured. There are no throughput or quality numbers for this build yet.
