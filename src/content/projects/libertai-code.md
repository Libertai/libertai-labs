---
title: LibertAI Code
summary: A coding agent for the terminal and desktop that runs open models on confidential, TEE-backed inference, with no training on your code.
status: shipped
order: 3
image: /illustrations/libertai-code.webp
imageAlt: Dark developer workspace with terminal panels, command timeline, and secure compute enclave
links:
  - label: Product site
    href: https://code.libertai.io
  - label: CLI repo
    href: https://github.com/Libertai/libertai-cli
---

`libertai code` is our first-party coding agent. It ships inside the single-binary `libertai` CLI, starts instantly, and runs open models on LibertAI's confidential inference, where the hardware itself (a trusted execution environment on Aleph Cloud) prevents anyone from reading your prompts or code. You can run it as an interactive REPL in a repo or pass a prompt for a one-shot answer that pipes cleanly to other tools.

The same binary also acts as a launcher for agents you may already use. `libertai claude`, for example, starts Claude Code pre-wired against LibertAI's OpenAI-compatible API, and equivalent launchers exist for OpenCode and Aider. Utility commands cover chat, image generation and [consensus web search](/projects/consensus-search).

## The desktop app

LibertAI Desktop wraps the same agent loop in a Tauri 2 workspace: multi-pane sessions, inline approval prompts, a plan mode toggle, a live transcript with markdown rendering, and a slide-in diff editor for reviewing changes before they land.

## Credit where due

The agent loop builds on our fork of [pi_agent_rust](https://github.com/Dicklesworthstone/pi_agent_rust), Dicklesworthstone's Rust port of [Pi](https://github.com/badlogic/pi) by Mario Zechner. Our work is the product around it: the CLI, the confidential inference integration, the third-party agent launchers, the packaging (apt, Homebrew, cargo, a no-sudo installer), and the desktop app.

## Install

```sh
curl -fsSL https://raw.githubusercontent.com/Libertai/libertai-cli/main/packaging/install.sh | sh
libertai login
libertai code
```
