---
title: GLM-5.3-Flash on Blackwell
summary: The first public 4-bit quantization of GLM-5.3-Flash, and the CUDA kernel that made a 320B multimodal model actually run on workstation Blackwell GPUs instead of only loading on them.
status: shipped
order: 0
image: /charts/card-glm53-kernel.png
imageAlt: Card summarising the two faults that broke GLM-5.3-Flash under vLLM and the throughput of the two fixed deployments
links:
  - label: Model on Hugging Face
    href: https://huggingface.co/LibertAIDAI/GLM-5.3-Flash-NVFP4
  - label: Kernel and plugins
    href: https://github.com/Libertai/vllm-sparse-mla-blackwell
  - label: Serving recipe
    href: https://github.com/Libertai/glm53-flash-vllm-gb10
  - label: Upstream report
    href: https://github.com/vllm-project/vllm/issues/54189
---

Zhipu released `GLM-5.3-Flash` on 26 August 2026: 321B total parameters, 18B
active, natively multimodal, 1M context, and an attention stack that mixes 34
linear-attention layers with 11 DeepSeek-style sparse ones. The published weights
are 598.5 GiB in BF16 and 305.8 GiB in FP8. No 4-bit build of any kind existed.

We published one the same day, and then spent two days finding out that having
the weights is not the same as being able to run them.

## The quantization

[`LibertAIDAI/GLM-5.3-Flash-NVFP4`](https://huggingface.co/LibertAIDAI/GLM-5.3-Flash-NVFP4)
is **181.3 GiB, down 70% from the BF16 source**, and was the first public NVFP4,
AWQ, GPTQ or MXFP4 build of this model on Hugging Face.

It is weight-only NVFP4 with a deliberate partition. The 37,152 routed-expert
tensors go to 4-bit, which is 97% of the parameters. Everything else stays BF16:
both attention flavours, the sparse indexer, the shared experts, the routers, the
hyper-connection tensors, the embeddings, `lm_head`, and the **entire vision
tower**. The vision tower is about 1% of the parameters and it is the model's
differentiating capability, so we were not going to trade it for two gigabytes.
Multimodal behaviour is bit-identical to the source.

Round-trip cosine against the BF16 source is **0.99665**, and the shard integrity
check is 120 of 120 with zero missing or extra tensors.

Two details cost us time and are worth passing on. vLLM matches a checkpoint's
quantization exclusion list against **fused** module names, and GLM-5.3's are
unguessable — `in_proj_qkvbfg_a` is a six-way fusion of the linear-attention
projections. Get it wrong and the loader quantizes a layer whose tensors are BF16
and dies on a packed-shape assertion. And this model's multimodal processor
config is named `processor_config.json`, not `preprocessor_config.json`, so a
copy list inherited from an earlier model silently skipped it, and the vision
path will not load without it.

## The model loaded, served an API, and produced garbage

On every Blackwell part we own, vLLM would load all 120 shards, allocate KV,
report itself ready, and then answer every prompt with `"locklocklocklock..."`.
SGLang could serve the same checkpoint correctly on the same hardware, which
established that the weights were fine and the problem was in the engine.

It took a long time to find because there were **two independent faults**, and
either one alone is enough to wreck the output. Every attention experiment we ran
came back byte-identical, which reads as "attention is exonerated" when in fact
attention was broken and the mixture-of-experts was separately being multiplied
by zero.

**Fault one: no attention path.** GLM-5.3-Flash is NoPE, meaning it carries no
rotary positional component, so its head dimensions are `(256, 0, 256)`. Every
MLA prefill backend in vLLM rejects that shape at compute capability 12.x, and
the one sparse decode backend that exists requires the `fp8_ds_mla` cache layout,
whose kernel asserts `pe_dim == 64` — a condition a NoPE model can never satisfy.
Closed loop, nothing configurable in between.

**Fault two: an uninitialised number.** vLLM's NVFP4 mixture-of-experts layer
registers an activation scale as an empty tensor and expects the checkpoint to
fill it. A weight-only checkpoint ships no activation scales at all, so nothing
ever does. The observed value was **0.0**, which propagates into the
dequantisation alphas, so every expert output was multiplied by zero. The model
was running on attention and the single shared expert alone.

That second fault is not about our hardware, and it is not about our checkpoint
being unusual. The community workaround circulating for it — switch the MoE
backend to marlin — works only because marlin dequantises to bf16 and never
consumes an activation scale in the first place. vLLM's NVFP4 *linear* layers
refuse a weight-only checkpoint loudly and have a dedicated weight-only class;
the MoE path has no equivalent and computes with uninitialised memory instead.
That inconsistency is what we
[reported upstream](https://github.com/vllm-project/vllm/issues/54189).

We also killed two of our own hypotheses along the way, both with a standalone
harness that drives the MoE kernel directly with an fp32 reference and never
touches a running service. The flashinfer cutlass kernel is not broken on this
architecture, and vLLM's weight-reordering convention is not wrong. An inverted
activation scale holds cosine at 0.996 while the magnitude is 25x off, which is
what silent garbage looks like from the outside — so a harness that checks
magnitude, not just correlation, is the tool that ends this class of bug.

## The kernel

The fix for fault one is a hand-written sparse-MLA CUDA kernel plus a vLLM
attention backend that takes `head_size = 512` natively, with no fabricated
zero-padded rotary block. It ships as two `vllm.general_plugins` entry points, so
**no vLLM source file is patched** — the plugins register themselves and the
stock engine is otherwise untouched.

It supports sm_120 and sm_121, 8, 16 or 32 heads per rank (tensor parallel 8, 4
or 2 on a 64-head model), bfloat16 and fp8 KV, and prefill and decode in a single
launch with CUDA graph capture. Verified on GB10, RTX PRO 6000 Blackwell and RTX
5090: six of six cases against an fp32 reference, worst relative error 4.1e-3,
cosine at or above 0.999998.

Two design points did most of the work. Causality is left entirely to the
Lightning Indexer — the only mask in the kernel is an `index >= 0` sentinel,
which makes the index axis layout-agnostic, lets vLLM's paged slot ids pass
straight through, and is the reason prefill and decode can share one code path.
And it is sized for the 101,376 bytes of shared memory these parts actually have,
rather than the roughly 227 KB that datacenter Blackwell offers, with no tcgen05,
TMA or wgmma available. It also fixes two defects in the TileLang kernel it
replaces: an out-of-bounds read on the sentinel, and an all-NaN result for a
fully masked token.

## Two deployments, and the lever that reverses between them

The model now serves correctly on both boxes we targeted, from the same
checkpoint, kernel and plugins.

On **two GB10 nodes** — DGX Spark class, 121.69 GiB of unified memory per node —
it runs at tensor parallel 2, 65,536 context, 88,790 KV tokens, and **24.2 tokens
per second** at a single stream. Without speculative decoding it sits at 14.5,
which matches SGLang exactly and is the memory-bandwidth wall for an 18B-active
model on this hardware. The attention kernel is not the limiter there;
multi-token prediction is what buys the rest. This lane is public on
`gb10-0-1.libertai.io`.

On **four RTX PRO 6000 Blackwell cards** it runs at tensor parallel 4, 262,144
context, and between 5.3 and 6.3 million KV tokens, at **129.8 tokens per second**
single-stream and a peak of **1,691 aggregate at 128 concurrent requests**.

![Throughput against concurrency on 4x RTX PRO 6000 Blackwell](/charts/chart-glm53-scaling.png)

Against our four-B200 lane running GLM-5.2, this box wins single-stream (130
versus about 100), matches context, and holds far more KV — but its aggregate
peak is roughly 2.5x lower. Interactive traffic favours the workstation cards;
batch-heavy traffic still favours the B200. We would rather say that than quote
the number that flatters us.

The most transferable thing we learned is a warning about copying configs.
**CUDA graphs are worth about 1% on GB10 and about 500% on the four-card box**,
20 tokens per second to 120. GB10 is bandwidth-bound, so kernel launch overhead
hides behind memory traffic and graphs buy nothing; tensor parallel 4 across PCIe
is latency-bound over 45 layers of collectives, which is exactly what graphs
collapse. The same asymmetry runs through the rest of the two configurations,
in opposite directions. A lever that is decisive on one box can be noise on
another, and the only way to know which is to measure it again.

Also worth stating plainly: **fp8 KV is slower than bf16 here**, by 4 to 12%,
because the per-element dequantise costs more than the halved gather traffic
saves. We deploy it anyway on both boxes, because on GB10 the doubled capacity
buys eight times the context, and on the four-card box it is what puts KV in the
multi-million token range. That is a trade we made with the numbers in front of
us, not a speed claim.

The full recipe, including the traps, the provisioning script for the four-card
lane, and the things we tried and rejected, is in the
[serving recipe repository](https://github.com/Libertai/glm53-flash-vllm-gb10).
