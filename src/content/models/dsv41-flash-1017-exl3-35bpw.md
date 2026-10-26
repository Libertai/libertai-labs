---
title: DeepSeek-V4.1-Flash-1017 EXL3 3.5bpw
summary: "The higher-quality 1017 EXL3 build. 239.9 GiB, better held-out perplexity than 2.9bpw, and too large for a two-node GB10 pair, so it belongs on a three-node ring."
status: preview
order: 4
date: 2026-10-17
baseModel: deepseek-ai/DeepSeek-V4.1-Flash-1017
weights: https://huggingface.co/LibertAIDAI/DeepSeek-V4.1-Flash-1017-EXL3-3.5bpw
license: MIT
metrics:
  - label: Weight size
    value: 239.9 GiB
    note: 44 shards, 3.53 trunk bpw
  - label: Held-out code ppl
    value: "1.8895"
    note: 2.9bpw 1.9094
  - label: Held-out prose ppl
    value: "6.4341"
    note: 2.9bpw 6.4520
  - label: Node budget
    value: "3"
    note: does not fit two 121 GiB boxes
  - label: Engram
    value: Not shipped
    note: read from the base repo
links:
  - label: 2.9bpw sibling
    href: /models/dsv41-flash-1017-exl3-29bpw
  - label: Upstream 1017 weights
    href: https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017
---

This is the same 1017 conversion at a higher bitrate, built on the same day as the [2.9bpw pack](/models/dsv41-flash-1017-exl3-29bpw). It is 239.9 GiB across 44 shards at 3.53 bits per weight on the trunk, and the extra 43.6 GiB buys a measurable perplexity improvement: 1.8895 code and 6.4341 prose against 1.9094 and 6.4520 at 2.9bpw. The unquantized source reads 1.8749 and 6.4277, so this build closes most of the gap on code and a little on prose.

The K map is not the stock Mia-AiLab map. Routed experts run at 4 bits on layers 0 to 9 and 30 to 39, at 3 bits on layers 10 to 29, and everything else at 6 bits, with indexer `wk` at 8 and MTP at 6. The repo ships its own `exl3_k_map.json`, which has to be passed through `KMAP_HOST`. The rest of the recipe matches the 2.9bpw build: `mul1` codebook, output scales, head 6, and the default 250 by 2048 calibration mix with all experts active.

It does not fit two GB10 boxes. At 239.9 GiB it is already larger than the pair's 242 GB of unified memory before engine overhead, KV cache and the Engram tables. The intended target is the three-node HP ZGX ring at roughly 80 GB per node. We have not served this build, so the status is preview and there are no throughput numbers for it.

The Engram tables are not shipped. Use `HF_ENGRAM_REPO=deepseek-ai/DeepSeek-V4.1-Flash-1017` with a fresh `ENGRAM_DIR`, and check the shard hashes on the card. The 3.5 conversion took 4 hours 25 minutes and survived one container restart at 17:15 UTC, resuming from its 17:10 checkpoint. The likely cause was a cgroup OOM at around 650 GB of resident mapped page cache, though we did not confirm it.
