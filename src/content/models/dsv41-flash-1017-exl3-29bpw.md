---
title: DeepSeek-V4.1-Flash-1017 EXL3 2.9bpw
summary: "Our most downloaded repo this month: a 196.3 GiB EXL3 quant of 1017 that fits two GB10 boxes with 256K context. The Engram tables stay in the base repo, and the quality loss is 1.8% code and 0.4% prose."
status: shipped
order: 2
date: 2026-10-17
baseModel: deepseek-ai/DeepSeek-V4.1-Flash-1017
weights: https://huggingface.co/LibertAIDAI/DeepSeek-V4.1-Flash-1017-EXL3-2.9bpw
license: MIT
metrics:
  - label: Weight size
    value: 196.3 GiB
    note: 43 shards, 2.90 trunk bpw
  - label: Held-out code ppl
    value: "1.9094"
    note: unquantized 1.8749
  - label: Held-out prose ppl
    value: "6.4520"
    note: unquantized 6.4277
  - label: Context
    value: 256K
    note: 2.5 GiB KV, 667,144 tokens
  - label: Engram
    value: Not shipped
    note: read from the base repo
links:
  - label: 3.5bpw sibling
    href: /models/dsv41-flash-1017-exl3-35bpw
  - label: Upstream 1017 weights
    href: https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017
  - label: Uncensored serving note
    href: /notes/uncensoring-dsv41-1017
---

This is the quant that made DeepSeek-V4.1-Flash-1017 fit two DGX Spark-class boxes. The checkpoint is 196.3 GiB across 43 shards, at 2.90 bits per weight on the trunk, and it serves with a 256K context on a 2×121 GiB GB10 pair. It was the first EXL3 build of 1017 on Hugging Face when it was published on release day.

The hard part was the engine. exllamav3 had no V4.1 architecture, only DeepseekV4, so we wrote the module against DeepSeek's own `inference/model.py` and `engram.py`. That covers the previous-sub-layer hyper-connection reuse without `hc_head`, compression ratios 0, 2 and 1 with cross-layer shared KV, indexer and candidates, Engram hashing with tables read from the base shards, and DeepSeek's FP8 and FP4 activation quantization. The forward check on the unquantized source read 1.8749 code and 6.4277 prose, against 1.8686 and 6.3940 for the old V4.1 FP8 build in vLLM, which is close enough to trust the port. The exllamav3 patch was a local branch on the build host and is not published, so the card documents the build rather than shipping a converter.

The quant itself uses the `mul1` codebook because the half-step bitrates exist only for that codebook, with output scales always on. Calibration used the exllamav3 default mix of 250 sequences at 2048 tokens with all experts active. The per-tensor K map is Mia-AiLab's V4.1 map applied tensor for tensor, so the kit's bundled `exl3_k_map.json` applies unchanged. All 192,452 Mia tensor names are present, plus 43 extra `gate.bias_vl` tensors.

Quality on our held-out sets, which are unpublished code and prose with 32 rows of 2048 tokens scored from token 1 to 2047:

| | code ppl | prose ppl |
|---|---:|---:|
| unquantized source | 1.8749 | 6.4277 |
| this 2.9bpw build | 1.9094 | 6.4520 |

That is a 1.8% loss on code and 0.4% on prose. We do not use wikitext-2 or the CPython standard library for quant comparisons because Engram has them memorised and both read at implausible perplexities.

The Engram tables are not in the repo, since they are about 200 GB on their own. Point `HF_ENGRAM_REPO` at `deepseek-ai/DeepSeek-V4.1-Flash-1017` and use a fresh `ENGRAM_DIR`; 1017's tables are not the same as V4.1's. The card carries the shard 47 and 48 SHA-256 hashes.

We serve this build on the two GB10 boxes with TP=2, DSpark k=3 and a text-only API. The [uncensoring note](/notes/uncensoring-dsv41-1017) covers the live lane, the runtime steering vector and its measurements. The 3.5bpw sibling is a better model and needs a third node; it is [here](/models/dsv41-flash-1017-exl3-35bpw).
