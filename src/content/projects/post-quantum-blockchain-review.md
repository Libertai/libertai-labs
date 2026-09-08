---
title: Post-quantum blockchain security review
summary: "An adversarial review of 30 live networks, migration efforts, standards proposals and on-chain verifiers, with high-priority findings moving through responsible disclosure."
status: research
order: 7
image: /illustrations/post-quantum-review.webp
imageAlt: Thirty abstract blockchain networks arranged around a transparent shield while cyan diagnostic beams scan the landscape
links:
  - label: Read the findings overview
    href: /notes/post-quantum-blockchain-landscape-review
---

We reviewed 30 post-quantum blockchain efforts across live networks, migration
roadmaps, standards proposals and on-chain signature verifiers. The objective was
to test the whole security path around post-quantum cryptography, including the
parts that are easy to miss when a project focuses on the signature primitive
alone.

The review produced a public landscape and a private disclosure track. This page
shares the scope, aggregate results and ecosystem lessons. It withholds affected
code paths, trigger conditions, reproduction steps and project-by-project issue
mappings while maintainers have time to investigate and remediate.

![Review scope split across seven live or deployed systems, thirteen migration efforts and ten on-chain verifiers or libraries](/charts/post-quantum-review-scope.svg)

## What we reviewed

The 30 review targets were grouped into three domains:

- **Live and deployed systems:** QRL, historical IOTA WOTS, Mochimo, Cellframe,
  Abelian, Algorand state proofs and PQ accounts, and AERE Network.
- **Migration and readiness efforts:** the Ethereum PQ roadmap, the
  StarkWare/Starknet roadmap, the Algorand Falcon roadmap, Cardano Nightstream,
  Solana Falcon work in Anza and Firedancer, Cosmos/CometBFT PQC, Bitcoin
  BIP-360, Zcash ZIP-2005 and Ironwood, EIP-7702, EIP-8141, PQCC and NIST
  migration guidance, libbitcoinpqc, and the Falcon implementation side-channel
  class.
- **On-chain verification and libraries:** SPHINCS+ Solidity by blocq-inc,
  SPHINCS- by nconsigny, EVM Dilithium gas analysis, Falcon-on-Solana,
  StarkWare SHARP and the Ethereum STARK verifier, the =nil; Proof Market,
  quantum-safe-cre, EIP-7619, EIP-7885, and the RISC Zero 0xisk and HAPPIER
  aggregation work.

A separate preliminary, web-only landscape scan also covered QANplatform,
Hedera, Nervos Network and XDC, alongside four projects repeated in the core set.
We list those names for completeness but keep their results out of the figures
below because that scan did not use the same source-level adversarial workflow.

[![Every project, proposal, roadmap and implementation analyzed, grouped by review domain](/charts/post-quantum-project-landscape.svg)](/charts/post-quantum-project-landscape.svg)

The word "project" is convenient shorthand here. The scope also includes EIPs,
roadmaps, standards guidance, implementation libraries and one cross-cutting
implementation class. Deployment maturity was tracked separately because a
mainnet protocol, a testnet integration and an unshipped proposal do not carry
the same practical risk.

## Adversarial verification

Each target was profiled and threat-modeled through six lenses: consensus,
post-quantum implementation correctness, key and state management, smart-contract
verification cost, network denial of service, and governance, upgrades and
bridges. Reviewers then tried to refute every candidate against source code,
deployed state and primary references.

## Scale of the run

The initial discovery, profiling, threat-modeling and verification stages used
approximately 1,850 agent assignments. Subsequent finding triage allocated five
independent agent passes to each of the seven critical deep-dives and three passes
to each of the 149 high-severity root issues.

| Measure | Review scale |
| --- | ---: |
| Model | GLM-5.2 |
| Initial workflow | approximately 1,850 agent assignments |
| Critical triage | 5 passes per issue, 35 assignments |
| High-severity triage | 3 passes per issue, 447 assignments |
| Approximate total | 2,332 agent assignments |
| Model tokens | 4.4 billion |

An assignment is one bounded agent review pass, not a claim that 2,332 distinct
persistent workers ran simultaneously. The scale created breadth and redundancy;
the source-level refutation stages provided the quality control.

![Review funnel from 1,205 verified candidates to 99 supported high or critical reports retained for disclosure](/charts/post-quantum-review-funnel.svg)

The first pass verified 1,205 candidate findings. Of those, 695 survived and 510
were rejected. We then consolidated repeated descriptions into 149 high-severity
root issues and deep-reviewed each one. Source-level rechecking overturned 35 of
the 149 initial verdicts. One of seven critical deep-dives was also refuted. The
current disclosure set contains 93 supported high-priority reports and six
supported critical reports across mainnet, testnet, integration and standards
contexts.

Those counts measure the review process, not 99 immediately exploitable mainnet
vulnerabilities. Deployment, attacker access, required privileges and value at
risk were graded independently, and many technically serious conditions are
latent, testnet-only or conditional on future integration.

## Where the evidence was encouraging

Three targets had no high or critical candidate survive the first adjudication:
QRL, the Cardano Nightstream roadmap and the official Solana migration work in
Anza and Firedancer. The Solana result is separate from the experimental
Falcon-on-Solana library, which was reviewed as its own target. The meaning also
differs by maturity. QRL provided years of live operational evidence and retained
medium-level key-management and protocol concerns. Cardano and Solana were
assessed primarily as roadmaps or pre-deployment engineering, so the clean
high-severity result is promising but cannot substitute for reviewing shipped
code.

Starknet and StarkWare were among the strongest positive results. Their
transparent, hash-based proving core avoids the classical assumptions that break
under Shor's algorithm, the verifier has substantial production history, and the
surrounding stack has a broad audit footprint. The retained concerns clustered
around availability, governance and classical boundary components rather than a
break in the core proving construction or a straightforward remote-funds path.

Algorand also showed meaningful strengths through deployed post-quantum
state-proof infrastructure and practical account agility. It retained
higher-priority concerns, so the recognition here is about concrete engineering
signals rather than a safety certificate.

## Responsible disclosure

We are preparing project-specific reports for maintainers, ordered by deployment
reality and realistic attacker capability. Each disclosure separates what is
confirmed in source from what is conditional, identifies the smallest useful
reproduction, and gives maintainers room to validate and patch before technical
details are published.

The accompanying [research note](/notes/post-quantum-blockchain-landscape-review)
explains the broad patterns that emerged and the lessons teams can act on now.
