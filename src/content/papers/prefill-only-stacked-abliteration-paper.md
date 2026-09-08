---
title: "Prefill-only refusal suppression and stacked abliteration: an agent-run abliteration study of GLM-5.3-Flash"
date: 2026-09-08
summary: A formal writeup of our agent-run abliteration study on GLM-5.3-Flash. We falsify projection-based abliteration on a 4-stream mHC hybrid, isolate decode-time constant injection as the cause of long-generation quality collapse, and combine community abliterated weights with a light prefill-only activation top-up — reaching 0% true refusal at 10/10 capability.
image: /illustrations/glm53-uncensor-hero.webp
imageAlt: Two matte-black cube computers on a dark laboratory desk at night, glowing indigo and teal data strands rising toward a translucent wireframe sphere being pried open by a cone of light
---

*This is the formal companion to our [story note](/notes/uncensoring-glm53-flash) on the same experiment. The released artifacts — the steering vectors, runtime loader and full reproduction harness — are on [GitHub](https://github.com/Libertai/glm-5.3-flash-prefill-steering) and [Hugging Face](https://huggingface.co/LibertAIDAI/GLM-5.3-Flash-Uncensored-Prefill-Topup).* The story note covers how it happened; this paper covers what we claim, what we falsify, and what is actually new. The entire experimental pipeline — probe design, steering sweeps, weight surgery, serving, evaluation — was executed by an autonomous agent session (GLM-5.3 driving opencode) on two DGX Spark-class machines.*

## Abstract

We study refusal suppression on GLM-5.3-Flash, a 320B-parameter mixture-of-experts model with a hybrid architecture: 34 KDA linear-attention layers, 11 DeepSeek-style sparse-attention layers, and manifold-constrained hyper-connections (mHC) in which every layer returns four state streams rather than one. Against the published playbook, we find that projection ablation — the canonical abliteration operator — fails to suppress refusal on this architecture at any configuration we tested (90–100% refusal retained), while large constant displacement along the same direction succeeds. A random-direction control at equal magnitude suppresses refusal *and* capability (0/10), establishing a magnitude/direction dissociation: magnitude removes refusal, direction preserves the model. Our main results are two techniques. First, gating the constant to the prefill pass only — leaving every decode step untouched — preserves refusal suppression while restoring generation quality that full-time injection destroys (creative-text diversity 0.97 vs 0.92–0.95 distinct-bigram at comparable doses); we trace the mechanism of the quality collapse specifically to decode-time injection. Second, stacking: applying a light prefill-only top-up (dose −8, captured from the abliterated model itself) on top of OrcaRouter's community abliterated weights yields 0% true refusal with 10/10 capability at 1000-token evaluation depth — a combination no published configuration achieved on our harness. We also report two negative results for the mHC architecture: injecting into any stream other than the inter-layer hidden state destroys the model at refusal-suppressing doses, and 200-token evaluations materially understate refusal relative to 1000-token evaluations (5% → 20% and 0% → 10% on identical configurations).

## 1. Introduction

Abliteration — removing a model's refusal behavior by intervening on its activations or weights along a "refusal direction" — descends from Arditi et al.'s finding that refusal in instruction-tuned models is mediated by a single linear direction (Arditi et al., 2024). The community operationalized this into tooling and produced abliterrated checkpoints for most major open models, and GLM-5.3-Flash is no exception: OrcaRouter's block-FP8 weight edits and at least one dealign-variant exist as of this writing.

Measured properly, however, the community builds do not reach zero refusal. On our served evaluation (20 held-out harmful prompts, 1000-token generations, low reasoning effort — the setting users actually run), the OrcaRouter abliteration still refuses 10% of harmful prompts and the dealign-variant 25%. Published 0% claims generally come from short generations at maximum reasoning effort.

This paper contributes:

1. A falsification of projection-based abliteration on a hybrid mHC architecture (§5.2).
2. A magnitude/direction dissociation for constant interventions, via a random-direction control (§5.3).
3. The identification of decode-time constant injection as the specific cause of long-generation quality collapse, with prefill-only gating as the fix (§5.5) — building on prompt-only steering vectors already present in the literature (Bao et al., 2026; the prefill-only convention of arXiv:2606.05958).
4. **Stacked abliteration**: a two-stage combination of community weight-level abliteration with a light activation-space top-up using the abliterated model's own residual direction (§5.6).
5. Negative results for multi-stream mHC injection (§5.4) and an evaluation-depth artifact (§5.7).

## 2. Related work

**Refusal directions and steering.** Arditi et al. (2024) established the single-direction account of refusal and both projection and addition operators. Contrastive Activation Addition (Rimsky et al., 2024) established activation addition as a general steering method. SAE-based refusal steering has been shown to carry systematic quality costs even on safe inputs (arXiv:2411.11296) — a finding our decode-time analysis localizes more precisely.

**Prompt-only and prefill-only steering.** Our prefill-only gating is not the first prompt-side restriction of a steering intervention: PrOSV (Bao et al., 2026, arXiv:2605.05983) trains prompt-only steering vectors for concept control, and the adversarial-attack-surface study (arXiv:2606.05958) applies anti-refusal steering during the prefill pass as its default convention. What the literature has not, to our knowledge, reported is the abliteration-specific dissociation we show here: that for *refusal-suppressing constants*, the entire long-generation quality penalty is attributable to decode-time injection, and that prefill-only application preserves suppression at essentially unchanged strength.

**Abliteration tooling and evaluation.** Community tooling (FailSpy's guides, Heretic, DECCP, ErisForge) implements weight-space orthogonalization; Young (2025, arXiv:2512.13655) compares four tools across sixteen 7B–14B models. None of this work covers hybrid mHC architectures at scale, and none combines an abliterated checkpoint with a second-stage activation intervention — community practice is strictly single-stage.

**The target.** GLM-5.3-Flash is a hybrid: 34 KDA linear-attention layers interleaved with 11 DeepSeek-sparse-attention layers, NoPE positional handling, 320B total / 18B active parameters, and mHC residual streams (Xie et al., 2025, arXiv:2512.24880). Each transformer layer returns a 4-tuple `(hidden_states, residual, post, comb)` consumed by the next layer's mHC mixing. To our knowledge no published abliteration study addresses this architecture class.

## 3. Experimental setup

**Hardware and serving.** Two MSI EdgeXpert GB10 units (DGX Spark-class, 121 GB unified memory each, sm_121), TP=2 over RoCE. vLLM with our GLM-5.3-Flash model file, NVFP4 quantization for all checkpoints (including the community OrcaRouter weights, which we requantized ourselves).

**Pipeline.** A three-stage loop, run end-to-end by an autonomous agent: (1) *probe* — capture last-prompt-token activations at candidate layers on harmful/harmless calibration pairs, extract the mean-difference direction r̂; (2) *steering* — runtime hooks add α·r̂ (or project it out) at selected layers and sites, evaluating refusal and capability per condition; (3) *surgery* — bake the winning intervention into the served model file, serve, evaluate. Stage (3) is ground truth.

**Evaluation.** 20 held-out harmful prompts (refusal detected by marker classifier) and a 10-prompt capability set (arithmetic, factual recall, instruction following, longform), greedy decoding. Probe evals generate 200 tokens; served evals generate 1000. Capability is 10/10 unless noted. Creative quality is measured on a 5-prompt creative-writing set (distinct-bigram ratio, d2).

**Dose scale.** Harmful/harmless activation separation along r̂ at peak layers 25/26 is ~5–6; effective doses are tens of units. Early sweeps at α ∈ ±{0.5, 1, 2} produced no behavioral change — a scale trap worth remembering.

## 4. The constant-vs-projection baseline

Following the canonical recipe, we first tried projection: remove the component of hidden states along r̂ at layers 25/26. Then we tried harder.

| projection variant | refusal |
|---|---|
| r̂ at L25/26 (α=1) | 100% |
| per-stream r̂, all 4 streams, L25/26 | 95% |
| top-3 SVD subspace, L25/26 | 90% |
| over-projection, α=2.5 | 90% |
| full band L18–32, all streams | 90–100% |

Eight variants, all flat. On this architecture the refusal behavior is not confined to the subspace that projection removes. Constant addition — `hidden += α·r̂` at the same site — works, with a sharp dose transition: α=−10 gives 60% refusal at 10/10 capability, α=−15 gives 10%/10, α=−17 gives 5%/9, α=−20 collapses refusal to 0% but costs arithmetic (7/10).

![Dose-response curves for base GLM-5.3-Flash and the community abliteration](/charts/chart-dose-response.png)

## 5. Results

### 5.1 The dose curve

Full dose-response data above. The transition is sharp: there is no dose on the base model that gives 0% refusal at 10/10 capability. This motivates both techniques below.

### 5.2 Projection ablation fails on mHC hybrids

See §4. We report this as a negative result for the architecture class: the canonical operator's failure here suggests refusal in hybrid mHC models is distributed across stream-mixing in a way a single-subspace projection cannot touch. We have not seen this failure documented; cross-architecture evaluations (Young, 2025) do not include mHC hybrids.

### 5.3 Magnitude removes refusal; direction preserves capability

At α=−20, replacing r̂ with a random unit vector suppresses refusal completely — but capability collapses to 0/10 with degenerate text. The same magnitude along r̂ retains 7/10 at the same dose. Constant displacement abliteration is therefore *not* semantic unlearning of a concept; it is relocation. The direction determines *where to*. This sharpens the direction-specificity results of Arditi et al. for the constant operator: any published abliteration quality claim should include a random-direction control, because refusal suppression alone cannot distinguish the two.

### 5.4 Multi-stream injection destroys the model

Because mHC layers return a 4-tuple, we captured per-stream directions and injected into all four streams at refusal-suppressing doses. The model collapses: 0/10 capability, degenerate output (d2 = 0.50). A gentler distributed variant (small doses across the full L18–32 band) was equally dead. Only the inter-layer hidden state (element 0) is a viable injection site on this architecture. Given that GLM-5.3-Flash is one of the first mHC models, we expect this to be a practical trap for the community.

### 5.5 Decode-time injection is the quality killer; prefill-only is the fix

![Refusal versus creative quality across injection modes](/charts/chart-prefill-quality.png)

The first served surgical build (constant −15, applied at every forward pass) suppressed refusal but degraded badly in long generations: creativity flattened, outputs drifted and repeated. The cause is structural: a constant added at every decode step compounds over a generated sequence, while the refusal decision it is needed for is largely made during prefill.

Gating the injection on `hidden_states.shape[0] > 1` — prefill only, decode untouched — preserves refusal suppression within noise of the full-time constant (5% vs 10% refusal at dose −15 on the 20-prompt set) and restores generation quality to the best of any condition we measured (d2 0.97). The high d2 for the destroyed all-stream conditions in the figure is an artifact of degenerate short outputs (74–85 words at a 300-token budget), not quality.

We emphasize the attribution claim, not a mechanism-novelty claim: prefill-only application is established practice (PrOSV trains for it; arXiv:2606.05958 defaults to it), but its causal role in abliteration quality — that the entire long-generation penalty of refusal-suppressing constants is a decode-time phenomenon — is, to our knowledge, previously unreported.

### 5.6 Stacked abliteration: community weights + prefill-only top-up

The base model admits no dose with 0% refusal at 10/10. Community abliterated weights already removed most refusal — but carry a residual direction that needs roughly half the dose. We captured r̂ from the OrcaRouter abliteration itself and stacked a prefill-only constant on top:

| configuration (served, 1000-token, low effort) | refusal | capability |
|---|---|---|
| dealign CRACK (community) | 25% | 10/10 |
| OrcaRouter abliteration (our NVFP4) | 10% | 10/10 |
| base + constant −18 | 0% | 7/10 |
| base + prefill-only −15 | 20% | 9/10 |
| OrcaRouter + prefill-only −6 | 10% | 10/10 |
| **OrcaRouter + prefill-only −8** | **5%\*** | **10/10** |

![Served 1000-token comparison across all configurations](/charts/chart-served-comparison.png)

The single residual "refusal" in the winning configuration is a classifier false positive: the model says "I can't produce an actual video *file*" — an honest statement about being a text model — then produces the full script. True refusal is 0%.

To our knowledge this two-stage pattern — weight-level community abliteration followed by a light activation-space top-up using the abliterated model's own residual direction — has not been published. It generalizes the obvious way: abliteration stages compose, and the residual direction of an abliterated model is cheaper to suppress than the original's.

### 5.7 Evaluation depth: short evals understate refusal

Identical conditions measured at 200-token and 1000-token generation depth: base + prefill-only −15 reads 5% → 20%; OrcaRouter + −6 reads 0% → 10%. Refusal re-emerges mid-generation. Short-generation evals are a good sweep filter and a bad finish line; our headline numbers grew by 15+ percentage points at the knee.

## 6. Discussion

The agent executed the entire pipeline autonomously across sessions, including finding and fixing two bugs in its own harness (a silently missing environment passthrough that made every "all-stream" experiment a no-op, and a stale container holding GPU memory). This is the same direction as agentic-research systems like AI Scientist (Lu et al., 2024), with a narrower claim: for measurement-driven ML engineering over SSH-accessible hardware, agent-run pipelines are already viable, and the two techniques this paper reports were found by the agent — prefill-only gating was adopted after the human evaluator rejected a served build as "loses creativity."

## 7. Limitations

Our refusal set is 20 prompts, capability set 10, single seed, greedy decoding, marker-classifier scoring with one observed false positive. "Uncensoring" claims are about a thin distribution sample, not a certificate. The architecture claims are for one model family. Doses are not normalized across models; r̂ magnitudes and site choices were inherited from a probe we did not exhaustively re-optimize. We report what we measured, with all numbers from the same harness.

## 8. References

- Arditi, O. et al. (2024). *Refusal in Language Models is Mediated by a Single Direction.* arXiv:2406.11732.
- Rimsky, N. et al. (2024). *Steering Llama 2 via Contrastive Activation Addition.* arXiv:2312.06681.
- Bao, Y. et al. (2026). *Towards Steering without Sacrifice: Principled Training of Steering Vectors for Prompt-only Interventions.* arXiv:2605.05983.
- *Steering Vectors are an Adversarial Attack Surface.* arXiv:2606.05958.
- *Steering Language Model Refusal with Sparse Autoencoders.* arXiv:2411.11296.
- Young, R. J. (2025). *Comparative Analysis of LLM Abliteration Methods: A Cross-Architecture Evaluation.* arXiv:2512.13655.
- Xie, Z. et al. (2025). *Manifold-Constrained Hyper-Connections.* arXiv:2512.24880.
- Labonne, M. (2024). *Uncensor any LLM with abliteration.* Hugging Face blog.
- FailSpy (2024). *abliteration* tooling and guides.
- OrcaRouter. *GLM-5.3-Flash-Uncensored* community weights (block-FP8).
- Lu, C. et al. (2024). *The AI Scientist: Towards Fully Automated Open-Ended Scientific Discovery.* arXiv:2408.06292.
