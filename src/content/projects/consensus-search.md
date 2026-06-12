---
title: Consensus web search
summary: A search API that queries Google, Bing and DuckDuckGo in parallel from Aleph Cloud's decentralized network and ranks results by cross-engine agreement.
status: shipped
order: 2
links:
  - label: API docs
    href: https://docs.libertai.io/apis/search/
---

A single POST to the search API fans out to three engines at once, executed by workers running as virtual machines on [Aleph Cloud](https://aleph.cloud), the decentralized compute network the rest of our stack runs on, spread across North America, Europe and Asia. The responses come back deduplicated by URL and ranked by consensus: a link that all three engines return outranks the top hit of any single engine. This turns out to be a useful spam filter, because SEO manipulation that fools one ranking algorithm rarely fools all three at the same time.

The API serves web, news, image and academic search, plus a fetch endpoint that returns clean, readable page text for any URL. It runs on the same credits as our inference API, and agents can alternatively pay per query over [x402](https://docs.libertai.io) micropayments without creating an account.

## Privacy properties

Queries and page fetches reach the web from the decentralized network rather than from your machine, so nothing ties a search to you, and there is no central datacenter accumulating everyone's queries in one place. We keep no search history attached to a person and build no interest profiles. This matters most for agents, which tend to search with far more context about their owner's intentions than a human typing keywords would reveal.

## Pricing

A single-engine query costs $0.002 with DuckDuckGo or $0.003 with Google or Bing, which works out to $2 to $3 per 1,000 queries. Full three-engine consensus mode is $8 per 1,000. For comparison, in June 2026 Tavily charged $8 per 1,000 searches, Exa $5, and Brave $4 plus token fees, each as a separate vendor with its own account and billing.

## Where it shows up

The CLI exposes it as `libertai search` and the [MCP server](/projects/mcp-server) exposes it as a `web_search` tool, so coding agents and chat clients can use the same consensus results.
