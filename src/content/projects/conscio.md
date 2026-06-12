---
title: Conscio
summary: An autonomous agent runtime organized as a cognitive architecture, where attention, memory, goals and prediction are inspectable mechanisms rather than prompt roleplay.
status: research
order: 4
---

Most LLM agents are prompt pipelines. Conscio is an experiment in building one as a persistent cognitive architecture instead, and it claims consciousness only in an operational, computational sense: selfhood, attention, memory, appraisal, goal formation, reflection and action are implemented as mechanisms you can inspect, rather than behaviors a prompt asks the model to perform.

A cognitive episode flows through a fixed loop. Incoming events become local specialist candidates that compete for attention. The winner is broadcast through a global workspace, competing intentions form, a bounded context is assembled with a cache-stable prefix, and an LLM tool-loop acts. Every intention carries a typed prediction (for example `tool_succeeded` or `answer_delivered`), so prediction error reflects a real check instead of word overlap. Outcomes consolidate into episodic, procedural and semantic memory, and a periodic review pass keeps, retires or reprioritizes goals transactionally.

The point of all this structure is evidence. Generated self-report is cheap, so Conscio also records what it attended to and what it ignored, which intention won, what it expected, what actually happened, and how its goals changed as a result.

## Running it

The runtime can execute a single deterministic episode offline, hold an interactive local session, or run nonstop as an authenticated service with its own web dashboard, evolving its goals between heartbeats. Unsafe shell and code autonomy is disabled by default and config-gated for deployment inside disposable VMs, with a persistent per-hour action budget that survives restarts.

We treat Conscio as a research vehicle. The question it explores is what changes when an agent's inner life is a data structure you can audit, and the honest answer so far is that auditability changes more about debugging than about philosophy.
