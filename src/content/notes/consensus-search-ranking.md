---
title: Ranking web search by cross-engine consensus
date: 2026-06-10
summary: Our search API queries Google, Bing and DuckDuckGo in parallel from Aleph Cloud's decentralized network and ranks by agreement. Here is why consensus beats any single engine for agents, and what we never store.
---

We have been running a web search API in production for months as the backend for `libertai search` and our agents' research tools. The work is done by worker VMs on [Aleph Cloud](https://aleph.cloud), the same decentralized compute network that runs our confidential inference, spread across North America, Europe and Asia. The ranking model is simple to state: query three engines in parallel, deduplicate by URL, and score each result by how many engines returned it and how highly they placed it. A link that all three engines surface outranks the top hit of any single one.

## Why agreement is a signal

Each engine ranks with its own algorithm, its own index and its own spam filters. SEO manipulation is an adversarial game played against one ranker at a time, and a page that games Google's signals rarely games Bing's and DuckDuckGo's simultaneously. Consensus is therefore a cheap ensemble: it needs no model, no training data and no maintenance, and it degrades gracefully, because when engines disagree you still get the union, ordered by partial agreement.

For human searching, single-engine results are usually good enough. Agents change the economics. An agent issues many queries per task, follows results it cannot eyeball first, and feeds what it finds straight into a context window. Precision at the top of the list is worth more, and an obviously spammy page is more costly, when no human is in the loop to filter it.

## The privacy half

Queries and page fetches originate from the decentralized network, never from your machine, so no engine or website can associate a request with you. There is also no central search datacenter on our side to subpoena or breach, because the workers are distributed and hold no history. We keep no search log attached to a person and build no profiles. Agent queries deserve this more than human ones, because an agent's search trail spells out its owner's intentions far more explicitly than a person typing keywords ever would.

Payment works the same way as the rest of our APIs: shared credits, or per-query x402 micropayments starting at $0.002, which lets an agent pay for exactly the searches it runs with no account at all.

## The numbers

Single-engine queries cost $2 to $3 per 1,000 depending on the engine, and full three-engine consensus costs $8 per 1,000. The API also serves news, image and academic search, plus a fetch endpoint returning clean readable page text. Docs are at [docs.libertai.io](https://docs.libertai.io/apis/search/), and the [MCP server](/projects/mcp-server) exposes the whole thing to any MCP client as a `web_search` tool.
