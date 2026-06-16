---
title: MCP server
summary: A Model Context Protocol server built into the CLI that gives Claude Code, Cursor, Cline and any other MCP client access to consensus web search.
status: shipped
order: 5
image: /illustrations/mcp-server.webp
imageAlt: Protocol hub connecting AI client surfaces to private search and page fetch tools
links:
  - label: CLI repo
    href: https://github.com/Libertai/libertai-cli
---

`libertai mcp` turns the CLI into a Model Context Protocol server. Any MCP client, including Claude Code, Claude Desktop, Cursor and Cline, can register it with one command and gains two tools: `web_search`, which runs [consensus search](/projects/consensus-search) across web, news, image and academic results, and `fetch_page`, which returns clean readable text for a URL. Both execute from Aleph Cloud's decentralized network rather than from your machine, so an agent's research leaves no trail from your IP.

The server reuses the API clients and credentials already configured in the CLI, so there is no second key to manage. Search queries are billed per use at the same rates as the API, which keeps an agent's research costs proportional to what it actually does.

The v1 scope is deliberately small. Search is the tool agents reach for most, and it is the one where private, consensus-ranked results differ most from what clients get by default. Inference and image tools can follow once the search tools have earned their place in people's configs.
