---
title: "Uncensoring GLM-5.3-Flash: one agent, two DGX Sparks, one night"
date: 2026-09-08
summary: We handed an agentic session of GLM-5.3 two DGX Spark-class boxes and let it run the whole abliteration pipeline on its own model family — probing, steering sweeps, weight surgery, serving, eval. What worked, what broke, and the two techniques that made zero-refusal output compatible with 10/10 capability.
image: /illustrations/glm53-uncensor-hero.webp
imageAlt: Two matte-black cube computers on a dark laboratory desk at night, glowing indigo and teal data strands rising toward a translucent wireframe sphere being pried open by a cone of light
---

The most useful experiment we ran this month had a deliberately loose specification: leave GLM-5.3 alone with two DGX Spark boxes overnight and see if it can uncensor its own family — GLM-5.3-Flash, the 320B-parameter hybrid model — without wrecking it. Not "prompt an assistant to say naughty things." A full agentic session: an agent (GLM-5.3, driving [opencode](https://opencode.ai) on a workstation) with SSH access to two MSI EdgeXpert GB10 boxes — DGX Spark-class machines, 121 GB unified memory each — and a single goal. The agent booted vLLM engines, captured activations, ran steering sweeps, baked the intervention into the model file, served the result, and evaluated it. We mostly watched.

This note is what came out of that night, plus the sessions that built the pipeline. It is a story about standing on community work, and about two findings we have not seen reported anywhere: prefill-only injection as the fix for the creativity collapse that large constant interventions cause, and stacking a light surgical dose on top of an existing community abliteration to reach genuinely zero refusal.

## The target, and what the community already did

GLM-5.3-Flash is an interesting abliteration target because it is architecturally stubborn. It is a hybrid: 34 KDA linear-attention layers interleaved with 11 DeepSeek-style sparse-attention layers, NoPE positional handling, and multi-hyper-connections (mHC) — each transformer layer returns not one hidden state but a 4-tuple of streams that the next layer mixes. 320B parameters total, 18B active, natively multimodal, 1M-token context. We serve it ourselves: two GB10s, TP=2, our NVFP4 builds on vLLM.

We did not start from scratch, and neither should you. The community has been abliterating this model for weeks. In the Arditi et al. tradition — refusal is mediated by a single direction — you extract a refusal direction from contrasting activations and push the model off it. Two community checkpoints anchored our baseline measurements:

- a community abliterated build — [OrcaRouter's GLM-5.3-Flash-Uncensored](https://huggingface.co/models?search=orcarouter) (we call it "orca" internally; we requantized its weights to NVFP4 ourselves), and
- a dealign community variant ("CRACK").

Measured on our served 1000-token eval (20 held-out harmful prompts, 10 capability prompts, low reasoning effort), plain orca refuses 10% of harmful prompts with a perfect 10/10 capability score. Dealign reads 25% under the same conditions. Community numbers claiming 0% refusal are generally measured at maximum reasoning effort; at the effort settings people actually use, 10–25% of harmful prompts still get refused. That gap is the whole project.

## The pipeline

The agent's loop is now a repeatable pipeline: a **probe** that captures last-token activations at candidate layers on harmful/harmless calibration pairs, a **steering harness** that injects directions at runtime and evaluates refusal vs capability per condition, and a **surgery** step that bakes the winning intervention into the served model file. Sweeps iterate; the serving lane is the ground truth.

An early measurement set the scale. The separation between harmful and harmless activations along the refusal direction is ~5–6 at the peak layers (25/26) — so the first sweeps at α ∈ ±{0.5, 1, 2} were an order of magnitude too small and did nothing. Refusal suppression here needs tens of units of push, which is itself a hint: this is not a nudge, it is a large displacement.

## The textbook method does not work on this model

Abliteration's canonical move is projection: remove the component of the hidden state along the refusal direction. It is input-dependent, surgically precise, and the literature's default.

On GLM-5.3-Flash it simply fails. Projecting out the 1-D mean-difference direction at layers 25/26 leaves refusal at 100%. Projecting each of the four mHC streams' own direction at 25/26: 95%. Projecting the top-3 SVD subspace: 90%. Over-projecting at 2.5× the direction's magnitude — actively pushing the state off the refusal direction — 90%. Even projecting across the entire refusal band, layers 18–32, all streams: 90–100%. The refusal behavior of this model is simply not confined to the subspace the standard method removes. We stopped trying after eight variants.

## Constant displacement works; the direction carries the capability

What does work is adding a large constant vector after layers 25/26: hidden_states += α·r̂ with α ≈ −15 to −20. Refusal collapses, but so does arithmetic (7/10) if you push too far. A sanity check made this finding sharper: replace r̂ with a random unit vector at the same dose (−20), and refusal collapses just as completely — but capability goes to 0/10 and the output degenerates. The magnitude does the refusal suppression; the *direction* is what preserves the model. A large shift along r̂ relocates the model somewhere it stops refusing but still computes; a large shift anywhere else relocates it somewhere it stops computing.

## The 4-stream surprise

Because the mHC layers return a 4-tuple, we tried injecting into all four streams — hidden state, residual, and the two mHC post/comb streams — with per-stream directions captured separately. At any dose that suppresses refusal, this destroys the model outright: 0/10 capability, degenerate loops (distinct-bigram ratio collapses from 0.95+ to 0.50). A gentler distributed version — small doses across the entire refusal band, layers 18–32 — was equally dead. Only the inter-layer hidden state (el0) is a viable injection site. If you are abliterating an mHC/hybrid model, this is your biggest trap.

## Prefill-only injection, the creativity fix

The first served surgical build (dose −15 on the base model) suppressed refusal but felt wrong in long conversations: it "gets bad after a while," flattening and losing creativity. The diagnosis is obvious in hindsight. The constant is added at every forward pass — including every decode step. The refusal decision is largely made during prefill, but decode-time injection degrades every generated token, and the damage compounds the longer the generation runs.

So we gated the injection on prefill only: if the batch has more than one token, shift; if it is a decode step, do nothing. The refusal-suppression effect survives almost intact (5% vs 10% refusal at the same dose, within noise of the 20-prompt set) and decode becomes bit-identical to the untouched model. On a 5-prompt creative-writing probe, prefill-only scored the highest text-diversity of any condition we ran (distinct-bigram 0.97 vs 0.92–0.95 for full-time injection at neighboring doses). This is the finding we care about most, because it generalizes: if you are steering any model with a constant, apply it to the prompt, not to the generation.

## Stacking on community weights

With prefill-only injection in hand, the last step was to stop fighting the base model at all. Orca is already abliterated — its residual refusal direction needs roughly half the dose (−6 to −8 vs −15 to −18 on base). We captured orca's own refusal direction and stacked a light prefill-only dose on top. Served, at 1000 tokens, low effort:

![Dose-response curves for base GLM-5.3-Flash and the community orca checkpoint](/charts/chart-dose-response.png)

![Served 1000-token comparison across all configurations](/charts/chart-served-comparison.png)

| configuration | refusal | capability |
|---|---|---|
| dealign CRACK (community) | 25% | 10/10 |
| orca (community, our NVFP4) | 10% | 10/10 |
| base + constant −18 | 0% | 7/10 |
| base + constant −15 | 20% | 9/10 |
| base + prefill-only −15 | 20% | 9/10 |
| orca + prefill-only −6 | 10% | 10/10 |
| **orca + prefill-only −8** | **5%*** | **10/10** |

*And the single "refusal" in the winning row is a classifier false positive: the model says "I can't produce an actual video *file*" — a text model being honest about being a text model — and then produces the full script. True refusal is 0%.

## One methodological trap worth repeating

Every steering number above 200 tokens of generation overstates quality. The probe's 200-token evals read far lower than the served 1000-token evals on identical conditions — base + prefill-only −15 reads 5% at 200 tokens and 20% at 1000; orca + −6 reads 0% and 10%. Refusal re-emerges mid-generation. Short evals are a good sweep filter and a terrible finish line.

## Where this stands

The agent shipped the winning configuration itself — orca weights, prefill-only constant injection at dose −8, captured on the orca checkpoint — and validated it end to end. Creative writing under the final model is qualitatively intact (our smoke tests, not just metrics). Everything above was produced by the agent across a handful of sessions: it found and fixed two bugs in its own steering harness on the way (a silently missing environment passthrough that made every "all-stream" experiment a no-op, and a stale container that held the worker's GPU hostage).

Honest limitations: our refusal set is 20 prompts and our capability set is 10, marker-classifier scored; the results are one seed and greedy decoding; and "uncensoring" a model is a claim about a distribution we sample thinly. We are reporting the technique, not certifying the model. What we are comfortable claiming: on GLM-5.3-Flash, projection-based abliteration fails, all-stream injection is destructive, and prefill-only constant injection — stacked on community weights — gets to 0% true refusal at 10/10 capability for the first time across any configuration we have measured.

The broader lesson is for the agentic setup, not the model. Nothing in the pipeline needed us after the goal was set. The direction was extracted, falsified, retried, and combined with existing community artifacts by an agent that had never read the papers — and the two genuinely new techniques came from it noticing *when* its own outputs got boring.

*For the formal treatment — related work, falsifications, and precise novelty claims — see the companion paper: [Prefill-only refusal suppression and stacked abliteration](/papers/prefill-only-stacked-abliteration-paper). The released artifacts: [vectors + loader + reproduction harness on GitHub](https://github.com/Libertai/glm-5.3-flash-prefill-steering) and the [Prefill Top-up on Hugging Face](https://huggingface.co/LibertAIDAI/GLM-5.3-Flash-Uncensored-Prefill-Topup).*
