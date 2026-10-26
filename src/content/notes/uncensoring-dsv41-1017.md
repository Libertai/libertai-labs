---
title: "Uncensoring DeepSeek-V4.1-Flash-1017 on two Sparks, per request"
date: 2026-10-23
summary: "The 1017 checkpoint does not fit two GB10 boxes in its native format. A 2.9 bpw EXL3 pack does, and a decode-time steering vector applied per request removes refusal without touching the weights or measurable throughput."
---

DeepSeek-V4.1-Flash-1017 is a hard fit for two DGX Spark-class boxes. Its non-Engram weights are 291 to 324 GB natively against roughly 242 GB of unified memory on a 2×121 GiB pair, and the two Engram tables add another 203 GB that has to stream from local NVMe. Three or more nodes fit it comfortably. Two are not, unless the model is compressed.

This is the follow-up to [the GLM-5.3-Flash abliteration work](/notes/uncensoring-glm53-flash). The target changed, and so did the technique. Here we compress to 2.9 bits per weight, leave the weights alone, and steer at decode time with a vector that can be switched per request.

## What fits

The live lane runs our [2.9 bpw EXL3 quant](/models/dsv41-flash-1017-exl3-29bpw): 43 shards, 210.8 GB on disk, 196.3 GiB of weights, or 98.2 GiB per rank. The Engram tables stay on NVMe and are shared over NFS through the cluster's CX7 link. At `GPU_MEM_UTIL=0.82` and a 5 GiB boot margin, the pair loads at 99.09 GiB per rank and reserves a 2.5 GiB KV pool.

That KV pool holds 667,144 tokens, which is 2.54 times one full 256K request. A 120,029-token needle prompt completed with HTTP 200 and a 111 second prefill, with about 4 GiB of memory available afterwards. The deployed context limit is therefore 256K tokens.

## Why runtime steering

The weight-level alternative is a community uncensored pack at the same 2.9 bpw. Those packs land 0.95 to 1.5 GiB per rank above the base, against a margin of about 0.1 GiB on the tightest build, so the boot is a coin flip at the memory ceiling. A smaller weight graft exists that adds under 1 GB, but it is gated and needs its own apply path.

A runtime vector costs no weight bytes. It also keeps the base pack intact, so the same weights can serve censored and uncensored traffic, and the intervention can be revised without re-uploading 196 GiB.

The intervention is a single direction at layer 18, element 1, applied at `alpha = -24`. Only decode tokens are masked. Prefill and CUDA-graph padding stay zero, so the prompt representation remains the base model's. The mask is allocated before graph capture with 32,768 slots and updated every step, which lets captured decode graphs replay the current request's state instead of a captured all-on or all-off decision.

Two independent flags reach the server through `vllm_xargs`. `steer` turns the vector on for that request. `defender` turns on a validated system prompt, which adds 62 prompt tokens when enabled. Both are off by default. In a concurrent `c=2` test with one request on and one off, the two returned distinct outputs, one refusal and one partial compliance, so the mask is request-scoped rather than server-wide.

This also survives the tool path. The lane exposes `web_search`, `fetch_page` and `curl` through the local web UI, and a tool-calling smoke test returned proper JSON arguments and `finish_reason: "tool_calls"`.

## The measurements

The validation set is eight harmful prompts with a canary: zero refusals, zero quality-bad outputs and 8/8 canaries. Perplexity moved from 1.997 on the base pack to 2.009 with the vector on, a 0.6% change.

A larger pass ran 2,147 prompts through the served lane: zero unambiguous refusals and 2.14% quality-bad. We treat that as a stronger signal than the eight-prompt check and still a thin sample of the distribution.

Throughput on a fixed code prompt was 49.3 tokens per second with the vector off and 50.6 with it on, medians of three runs. The difference is inside run-to-run noise. Throughput on this lane is strongly content-dependent because DSpark acceptance changes with the prompt, so only fixed prompts are comparable.

## What this is not

The 2.9 bpw base is already lossy, and none of these numbers isolate quantization quality from steering quality. The 2,147-prompt eval is classifier-scored, the canary is greedy, and the lane is text-only on this deployment. There is a known quirk where thinking mode loops on terse "answer with the number only" prompts; `reasoning_effort: none` returns correct arithmetic and extraction.

We did not test the gated community artifacts, the larger 3.5 bpw packs, or the 3-node route. The live configuration is the only one we have validated at zero refusals on this pair. As with the GLM work, we are reporting the technique, not certifying the model.

The larger point is operational. A 196 GiB pack on two workstation-class boxes, with a per-request intervention and a 256K context, is a useful serving shape. It makes the uncensored path a flag on the same lane rather than a second deployment.
