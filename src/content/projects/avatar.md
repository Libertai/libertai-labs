---
title: Avatar
summary: A browser avatar you can talk to, combining a 3D stage, browser speech APIs and LibertAI chat completions, with conversations kept in your browser.
status: experiment
order: 6
image: /illustrations/avatar.webp
imageAlt: Abstract glass browser avatar with speech waveforms and local privacy controls
links:
  - label: GitHub
    href: https://github.com/Libertai/libertai-avatar
---

Avatar is an experiment in giving a voice conversation a face without giving up privacy. A Next.js app renders a 3D avatar stage with Three.js, speech recognition and speech synthesis run entirely in the browser, and a small FastAPI gateway forwards the conversation to LibertAI's OpenAI-compatible chat API.

Memory is browser-local only. The server keeps no conversation state, so closing the tab is a complete reset, and there is nothing for anyone to retrieve later. For self-hosted demos the browser can bring its own API key, which removes the server from the trust equation entirely.

It is an MVP and we describe it as one. The interesting questions it raises are about latency budgets (speech in, inference, speech out) and how much presence a rendered face adds over a plain voice loop. Both are open.
