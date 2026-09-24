---
title: "Deem: Open Machine Reflexes, Measured Honestly on Tare"
date: 2026-09-24
summary: The paper behind Deem, our open-weight System One decision model family. We document the letter-slot architecture, two failure modes of decision SFT that accuracy gates cannot see, a teacher study whose pilot result did not transfer at scale, and how we arrived at the released deem-9b-v1 and deem-0.8-v1 checkpoints.
---

*This is the v1 cut of the Deem paper. The released weights are on Hugging Face ([deem-9b-v1](https://huggingface.co/LibertAIDAI/deem-9b-v1) and [deem-0.8-v1](https://huggingface.co/LibertAIDAI/deem-0.8-v1)) and the full stack, serving code and benchmark harness included, is on [GitHub](https://github.com/Libertai/deem). Everything below is measured; the sections of the living paper that are still stubs (the Tare leaderboard, the calibration catalogue, the diffusion lane) are cut from this version rather than summarized. Every number traces to a dated ledger entry in the research repo.*

## 1. Context: software needs decisions

LLMs generate text; software needs decisions. Between a state representation and an action, most automation code needs small, typed judgments, executed thousands of times per second, with probabilities the surrounding code can trust. Chat models are a poor fit: slow, verbose, unparseable, and systematically overconfident when verbally asked for probabilities.

A new model category formed to close this gap. TypeSafe's Jev, launched September 15, 2026, calls itself a *System One model*: a non-generative network trained with RL for calibrated decisions, mapping unstructured state to typed probabilistic decisions in a single pass. Within 48 hours of launch, at least six independent open-source clones appeared. The architecture is a commodity. What is scarce is open weights at frontier quality, an honest benchmark, and closure of the System-1 failure modes the whole category currently avoids (counting, arithmetic, multi-hop, cross-question consistency).

Deem addresses all three, under one banner: open machine reflexes, measured honestly on Tare. The external comparisons in this version are JevBench public, the category's MIT-licensed development suite (231 items); Tare leaderboard numbers ship with the next release cut.

## 2. Architecture: a letter-slot cross-encoder

Deem exposes three typed primitives over unstructured state: **Choice** (pick from 2 to 255 supplied options, returning per-option probabilities), **Score** (rate against 2 to 10 ordered levels, returning the level distribution), and **Noul** (probability that a proposition is true). The wire format is compatible with the emerging `/v1/systemone` API shape, so existing System One harnesses interoperate unchanged.

State, question, lettered options, and an answer slot (`Answer k: (`) are encoded in a single forward pass. Hidden states at the answer slots are projected with the option-letter rows of the pretrained LM head and softmaxed over valid letters. Every layer attends to all options jointly, which makes Deem an encoder of the decision rather than of each option; late-interaction readouts were rejected as data-starved at our training scales.

There are no novel heads. Noul is a sigmoid on a state-conditioned hidden state. Score is an independent per-level softmax with a monotonicity regularizer. Evidential and Dirichlet heads were rejected for overconfidence and regularizer fragility, and a separate learned confidence head was killed in adversarial review on Goodhart grounds: trained through the same gradients on the same data, it would be a second drifting channel claiming to measure the calibration of the first.

Two more commitments complete the core. **Policy-neutral weights:** no refusal or alignment training is baked in, because decision models are sensors in perception-action loops and policy belongs in an auditable application layer. **Ground-truth-first data:** teacher distillation is augmentation only, never the reference; the trusted sources are programmatic generators whose labels are computed by construction (Section 6 explains what happens to teachers that are measured honestly).

## 3. Tare: an outcome-grounded benchmark

Tare is our evaluation suite for calibrated machine decisions, named for the counterweight that zeroes a scale. Its thesis is that the category's public evaluations are circular because they score agreement with a teacher consensus. Honest measurement is itself a contribution, so the rules of honesty are explicit:

1. No teacher-agreement scoring. Every reference is an outcome or a human label.
2. Calibration is measured strictly after frozen temperature scaling, with fitted temperatures published per release.
3. Eval sets are never teacher-graded; teacher-disagreement rows form a separate diagnostic set.
4. Datasets are versioned and Apache-2.0, so scores are comparable across releases.

Consistency probes (negation, paraphrase, permutation) are scored as paired accuracy, because invariance alone can be satisfied by a model that is consistently wrong.

## 4. Five acts of letter-slot SFT

The paper's spine is a five-act arc in which each failure was caught by a pre-registered gate, diagnosed causally, and fixed with a one-line data-emission change. The released recipe is the residue of those failures.

**Act 1: position-tied shortcuts.** A full fine-tune of Qwen3.5-0.8B on 41,420 letter-slot rows lifts held-out macro accuracy from 0.508 to 0.679 across eight anchor datasets, with macro ECE falling from 0.191 to 0.053. The accuracy gate passes. The consistency gate fails by roughly 50x: permutation flip rates of 0.92 to 0.99 against a pre-registered threshold below 2%, tuned ag_news accuracy collapsing from 0.84 to chance under option shuffling, and catastrophic interference on the one per-row-shuffled anchor (MMLU 0.405 to 0.253, a perfectly calibrated uniform: the model is honestly ignorant). The root cause is a fixed option order in seven of eight training-data anchors. The model had learned the letter, not the answer.

**Act 2: the fix exposes negation blindness.** Training-time option-order randomization kills the shortcut catastrophe in one run (ag_news flip 0.993 to 0.0067, macro accuracy 0.768). The sharpened readout then exposes a second failure: the model assigns nearly the same probability to a proposition and its negation, correlation +0.93, because the negated template never appeared in training data. A causal 0.8B probe-model experiment reproduced the blindness and predicted the fix before the full retrain.

**Act 3: negation pairs.** Emitting both polarity rows for every ground-truth yes/no item is free, because ground truth is known. It resolved the blindness at zero accuracy cost: consistency error 0.895 to 0.0128, paired accuracy 0.213 to 0.827, correlation +0.93 to -0.99, macro accuracy held at 0.766.

**Act 4: calibrated uncertainty on exact laws.** Training on programmatically generated card draws, coin binomials, counting, and grid problems whose targets are genuine probability distributions produced the first checkpoint with calibrated uncertainty on closed-form probability questions: macro Brier on 313 held-out keys fell 0.328 to 0.033, accuracy rose 0.649 to 0.971, and counting zero-answer rows went from 0.909 to a perfect 55/55.

**Act 5: one temperature was hiding five miscalibrations.** A per-class post-hoc calibrator closed the final ECE gate (macro ECE 0.0433 against a 0.06 target, accuracy up 0.74 points) on an honest dev/eval split. The near-miss it resolved is a small classic: a single scalar temperature (T=3.46) on a five-level ordinal task was flattening four well-behaved levels to near-uniformity. The per-class vector reads [1.24, 0.97, 0.93, 0.94, 0.92].

The central empirical lesson is that accuracy gates certify nothing by themselves. Each consistency probe that failed exposed a training-data defect with a one-line fix, and each fix was validated causally at probe scale before the full retrain.

## 5. Long state, external checks, and the levers that worked

The 4B policy lane trained on 28,500 programmatically generated policy-packet rows (multi-clause employment policies with annexes and amendments, ground truth by construction), and its long-state re-render at 2,000 to 3,200 tokens took the long-policy hold-out to 0.975 with trap questions at 0.951 and surface-follow behavior at 0.043 (lower is better): the model applies amendments rather than matching keyword proximity. On the external JevBench public suite (231 items, used strictly as a development gate, never trained on), the same checkpoints tell a more disciplined story:

| JevBench public | easy | original | hard | noul |
|---|---|---|---|---|
| base 4B zero-shot | 0.875 | 0.500 | 0.369 | 0.478 |
| 4B + policy lanes (v8) | 0.958 | 0.750 | 0.441 | 0.689 |
| 9B scale-up (v10) | 0.958 | 0.736 | 0.486 | 0.689 |
| open frontier (reflex-4B) | - | - | 0.632 | - |
| Jev (closed leader) | - | - | 0.741 | - |

*Runner note: the original JevBench runner scored every score item as yes/no, auto-failing 18 of the 231 items (all 12 ordinal, 6 hard). The fixed runner reads v10 at 0.495 hard and the frozen 9B base at 0.568, and the fine-tune/regression comparison below uses those fixed-runner numbers.*

Three controlled experiments bracket the released checkpoint. **The domain thesis failed its first test.** Adding a fully verified working-time domain (also 28,500 rows, hold-out 0.963) left JevBench hard worse (0.396), so generator diversity alone does not close the external gap. **The zero-shot control was the most consequential.** The frozen 9B base reads 0.568 on hard through the identical harness, meaning our own 112,841-row mixture cost 7.3 points of hard-tier reasoning while buying format, calibration, and long-state gains. **Scale and composition work.** Geometric (logit-space) ensembling of fine-tune and base at 0.5/0.5 reads 0.595 hard with easy at 1.00, weight-space interpolation reads 0.559, and a 9,149-row targeted delta (temporal/numeric drills, judge-verification domain, ambiguity pairs) also reached 0.559 solo, closing the gap to the frozen base without ensembling.

**The think-slot and faithful traces.** Extending the readout with sampled rationale traces (k=4, letter slot read after each) and training on multi-step traces lifted hard to 0.604, but the first trace generation was rationalizing rather than recomputing: a judge yes-bias survived at 9/17. Replacing the traces with faithful ones, verification by recomputation in the GenRM style, improved the yes-bias from 9/17 to 16/17 and lifted hard to 0.689 CoT-only, 0.658 on the full 231 with direct fallback on the 10/231 items where no trace completes.

Tier-routed composite serving (direct on easy, extended elsewhere) reads 100.0 / 91.7 / 65.8, the numbers on the released model card. Two nulls bracket the gain: a confidence-aware router over the base nets zero, because the base is uniformly no-biased on judge items (it answers no to everything, ~0.005), so no routing signal exists and the fix had to be trained; and single-pass distillation of the chain of thought transfers nothing, with the student reading exactly the teacher's direct 0.541. A probability-repair delta (v14) made the probability benchmarks worse. The ~23-item impossible core persists.

## 6. Teachers, measured honestly

Before committing compute to distillation we ran a pre-registered kill-gate probe of three frontier teachers: agreement at or above 0.85 and ECE at or below 0.10. All three passed on the pilot (50 hand-written items): agreement 0.96 to 0.98, ECE 0.025 to 0.040. Then we repeated the measurement at scale on real anchor data (1,050 items, 5,600 API calls, $0.71, two of the three teachers): agreement fell to 0.730 and 0.782, ECE rose to 0.133 and 0.198, both teachers failed the pre-registered gate, the accuracy lead flipped to the less-calibrated teacher, and the designated calibration anchor showed a 40% slot-A position bias. A small probe on easy items only measures the probe itself.

The machinery that makes teacher distributions usable is now a hard requirement rather than best practice: permutation marginalization (the anchor teacher's own flip rate is 14%), fitted temperatures (T=3.26 and T=7.40), per-domain inverse-Brier weighting, and flagging of the 16% disagreement rows. No raw teacher distribution ever touches a student.

## 7. Vision: free generator ground truth beats frontier distillation

A synthetic-UI generator with ground truth by construction isolated a presence-bias failure in frontier vision teachers: on zero-count panels they count every element instead of the target kind. The failure replicated across three probes (worst teacher: 22.7% accuracy on zero-count rows). A 2B open VLM (Qwen3-VL-2B + LoRA) trained purely on generator ground truth for 48 minutes on one GPU eliminates it: 100% (200/200) on zero-count rows against teacher ceilings of 22.7% and 59.1%, and overall count accuracy of 86.2% beats both teachers (61.4% / 68.6%). The one concession is identical-pair reading over small text, a small-model OCR limit. The headline is clean: on the teachers' worst failure mode, generator ground truth beat frontier distillation at a training cost of 48 minutes on one GPU.

## 8. Eighty-nine seconds of RL

The first RL-from-checkable-densities run, REINFORCE with a hard KL anchor to the SFT checkpoint and every reward computed against a closed-form probability law or a breadth-first search (BFS) result, cuts held-out exact-laws macro Brier from 0.0332 to 0.0291 (12% relative) at unchanged accuracy, with zero measurable drift: permutation flip rates and dev macro accuracy are byte-identical before and after. There are no teacher labels, no human graders, and no decoding in the loop; rollouts are single forward passes reading answer-slot logits. It ran in 89 seconds on one workstation GPU. The RL loop works end to end; a real RL phase on policy generators is the medium-term differentiator.

## 9. The release

Two checkpoints shipped on launch day, both Apache-2.0.

**deem-9b-v1** (Qwen3.5-9B-Base + LoRA, merged) serves JevBench public easy 1.00 / original 0.944 / hard 0.613 in its shipped confidence-gated mode: a direct pass always, a chain-of-thought pass when the direct readout's entropy exceeds a threshold tau, at roughly 2.2s per item with 58% of items resolving in a single pass. The tier-routed composite reads 1.00 / 0.917 / 0.658, and extended reasoning on completed traces reads 0.689 hard. Single-pass hard reads 0.541; the model card labels 0.658 as composite. Judge-tier verification sits at 16/17. It serves a short-form decision at P50 103.2ms and a 3,222-token long-state decision at P50 787.8ms on a low-power edge GPU, prefill-only, no decode phase; the category leader's median is 252.8ms remote over HTTP (network included, so not directly comparable).

**deem-0.8-v1** (Qwen3.5-0.8B, full fine-tune on its own 124.8k-row ground-truth-verified mixture) is the CPU-native sibling: 96.3% long-policy hold-out (traps 91.8%), exact-law counting 0.976 and grid 0.984 with zero-count at 1.000, 362ms short-form decisions on a contended desktop CPU, and 0.9GB resident through hand-written AVX-512 int8 kernels in our Rust runtime, parity-gated against PyTorch to the bf16 noise floor. Its external hard split reads 0.333; its strength is the long-policy domain.

## 10. Limitations

The teacher study covers two teachers at scale, three anchor datasets, one seed, and one point in time; its fitted temperatures must be refit per release. The SFT arc is single-seed at each scale, and post-hoc calibration closed the ECE gate rather than training. JevBench public is a 231-item development gate carrying binomial noise of roughly 3 points per split; no item from it was used for training or temperature calibration, and the gated-mode tau was selected on the public suite, where it sits on a stable plateau (0.01 to 0.06). The vision pilot's counting finding is crisp but small, and the vision hold-out contains almost no flip-pair questions. Deem trains on a workstation-plus-edge-cluster budget, not datacenter scale, and frontier parity must be demonstrated on Tare rather than assumed from benchmark transfer.

## Links

- Weights: [deem-9b-v1](https://huggingface.co/LibertAIDAI/deem-9b-v1), [deem-0.8-v1](https://huggingface.co/LibertAIDAI/deem-0.8-v1) (Apache-2.0)
- Code, serving stack, Rust runtime, Tare harness: [github.com/Libertai/deem](https://github.com/Libertai/deem)
- JevBench: [fstandhartinger/jevbench](https://github.com/fstandhartinger/jevbench), the external MIT-licensed suite used as a development gate
