---
title: Conscio
summary: An autonomous agent runtime organized as a cognitive architecture, where attention, memory, goals and prediction are inspectable mechanisms rather than prompt roleplay, now with an eval harness built to falsify it.
status: research
order: 4
image: /charts/chart-conscio-selfreport.png
imageAlt: Chart showing self-report groundedness rising from 0 to 100 percent as architecture conditions are added
links:
  - label: Eval results writeup
    href: /notes/conscio-measuring-the-architecture
---

Most LLM agents are prompt pipelines. Conscio is an experiment in building one as a persistent cognitive architecture instead: selfhood, attention, memory, appraisal, goal formation, reflection and action are implemented as mechanisms you can inspect, rather than behaviors a prompt asks the model to perform. The system prompt is deliberately neutral about consciousness; what the agent says about itself is a measured variable, and a claimed mechanism only counts when the trace shows it fired.

A cognitive episode runs through a per-tick control loop. Incoming events become workspace entries that compete for attention under an explicit budget, and the broadcast winners are what assemble the model's bounded context, so attention selection causally gates what the model sees. Episodes span multiple ticks of bounded tool rounds. Every tool call registers a typed expectation before it executes and resolves it against the actual result, so prediction error is a real check. Answers are validated against active constraints before they ship, and violations trigger a reflection tick. Memory carries provenance and trust tiers with embedding-based hybrid retrieval, web-derived content is quarantined end to end, and goals are selected by drives with appetite and satiation instead of a static priority sort. A plain chat message still costs exactly one LLM call.

The point of all this structure is evidence. Conscio ships with an evaluation harness that builds five baseline conditions out of one runtime with feature flags, runs a 30-task battery with machine scorers and an audited separate-model judge, and ablates one mechanism at a time against pre-registered predictions. The verdicts went both ways: memory and reflection are confirmed on both models we tested, attention gating is refuted on both, and the headline is that self-report groundedness collapses under ablations that task scores cannot see. The numbers, including the losses, are in [the eval results writeup](/notes/conscio-measuring-the-architecture).

## Running it

The runtime can execute a single deterministic episode offline, hold an interactive local session, or run nonstop as an authenticated service with its own web dashboard, evolving its goals between heartbeats. Unsafe shell and code autonomy is disabled by default and config-gated for deployment inside disposable VMs, with a persistent per-hour action budget that survives restarts.

We treat Conscio as a research vehicle. The question it explores is what changes when an agent's inner life is a data structure you can audit, and the honest answer so far is that auditability changes more about debugging than about philosophy, except in one place: an agent whose self-description is checked against its traces can be caught confabulating, and ours was.
