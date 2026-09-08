---
title: "We reviewed 30 post-quantum blockchain efforts. The hard part is everything around the signature"
date: 2026-07-17
summary: We reviewed live networks, migration roadmaps, standards proposals and on-chain verifiers across six adversarial lenses. The strongest lesson is that quantum resistance has to survive key management, consensus, bridges, verification costs and deployment reality.
image: /illustrations/post-quantum-review.webp
imageAlt: Thirty abstract blockchain networks arranged around a transparent shield while cyan diagnostic beams scan the landscape
---

Quantum-resistant blockchain design is often introduced as a cryptography choice:
replace an elliptic-curve signature with a post-quantum one, then update the
transaction format. Our review kept finding that the decisive security boundary
sits around that primitive. Keys still have to be generated and rotated safely.
Consensus votes and bridge messages still need authentication. Verifiers still
have to reject malformed inputs within a predictable budget. Migration logic
still has to keep two signature worlds from colliding.

We reviewed 30 efforts across that wider boundary. The set spans established
networks, historical deployments, active migration plans, Ethereum and Bitcoin
proposals, proving systems, precompiles and experimental verification libraries.
Some findings are already public or architectural. Others are moving through
responsible disclosure, so this note shares the aggregate evidence and broad
issue classes while withholding affected code paths, triggers, reproduction
steps and project-by-project mappings.

The full scope and disclosure policy live on the
[research project page](/projects/post-quantum-blockchain-review).

![Review scope split across seven live or deployed systems, thirteen migration efforts and ten on-chain verifiers or libraries](/charts/post-quantum-review-scope.svg)

## The 30 efforts we reviewed

The review uses "project" as shorthand. Several entries are proposals, roadmaps,
libraries or a recurring implementation class, and we kept those distinctions in
the impact analysis.

| Domain | Reviewed efforts |
| --- | --- |
| Live and deployed systems (7) | QRL; historical IOTA WOTS; Mochimo; Cellframe; Abelian; Algorand state proofs and PQ accounts; AERE Network |
| Migration and readiness (13) | Ethereum PQ and Lean Ethereum; StarkWare/Starknet roadmap; Algorand Falcon roadmap; Cardano Nightstream; Solana Falcon in Anza and Firedancer; Cosmos/CometBFT PQC; Bitcoin BIP-360; Zcash ZIP-2005 and Ironwood; EIP-7702; EIP-8141; PQCC and NIST migration guidance; libbitcoinpqc; Falcon implementation side-channel class |
| On-chain verification and libraries (10) | SPHINCS+ Solidity by blocq-inc; SPHINCS- by nconsigny; EVM Dilithium gas analysis; Falcon-on-Solana; StarkWare SHARP and the Ethereum STARK verifier; =nil; Proof Market; quantum-safe-cre; EIP-7619; EIP-7885; RISC Zero 0xisk and HAPPIER aggregation |

This boundary matters. A live mainnet and a draft precompile can contain the same
kind of technical flaw while presenting radically different risk today. We
therefore tracked deployment, attacker access, required privileges and funds
impact separately from technical severity.

A separate preliminary, web-only landscape scan also covered QANplatform,
Hedera, Nervos Network and XDC, alongside QRL, Algorand, Abelian and Starknet.
Those four additional names complete the set we looked at, but their results are
excluded from the figures in this note because the earlier scan did not use the
same source-level adversarial workflow.

[![Every project, proposal, roadmap and implementation analyzed, grouped by review domain](/charts/post-quantum-project-landscape.svg)](/charts/post-quantum-project-landscape.svg)

## We tried to disprove our own findings

Each target was profiled across architecture, deployed cryptography, key
management, consensus, audit history and known incidents. Six adversarial lenses
then covered consensus safety, implementation correctness, key and state
management, smart-contract verification cost, network denial of service, and
governance, upgrades and bridges.

Every candidate went to a verifier whose default posture was refutation. A claim
survived only when source code, deployed state or primary references supported
the mechanism. The first pass verified 1,205 candidates: 695 survived and 510
were rejected.

The scale was unusual. Discovery, profiling, threat-modeling and initial
verification used approximately 1,850 agent assignments. Each of the seven
critical deep-dives then received five independent agent passes, while each of
the 149 high-severity root issues received three. That works out to approximately
2,332 bounded assignments across the complete workflow.

| Run statistic | Value |
| --- | ---: |
| Model | GLM-5.2 |
| Initial workflow | approximately 1,850 agent assignments |
| Critical triage | 5 passes per issue, 35 assignments |
| High-severity triage | 3 passes per issue, 447 assignments |
| Approximate total | 2,332 agent assignments |
| Model tokens | 4.4 billion |

These are agent assignments rather than 2,332 distinct persistent workers. Each
assignment was a bounded research, attack or verification pass with evidence
handed to the next stage.

![Review funnel from 1,205 verified candidates to 99 supported high or critical reports retained for disclosure](/charts/post-quantum-review-funnel.svg)

We then consolidated repeated descriptions into 149 high-severity root issues
and performed a source-level deep review of every one. Thirty-five initial
verdicts changed under that pressure. One of seven critical deep-dives was
refuted outright. After deployment and scope trimming, 93 supported high reports
and six supported critical reports remain in the disclosure track.

The correction rate is one of the most useful results. Agent-scale review can
search a large landscape and generate adversarial hypotheses quickly, but those
hypotheses are leads. Source-level rechecking and deployment verification decide
whether they become findings.

## What the findings say in aggregate

### Quantum resistance is an end-to-end property

Several designs protect one transaction or proof with post-quantum cryptography
while consensus, governance, relaying, custody or cross-chain transport still
depends on classical keys. A system's effective security follows the weakest
authorization step that can move value or finalize state. Teams should publish a
cryptographic dependency map that covers the whole path instead of describing
one upgraded component as the posture of the whole network.

### Key and state management can erase the primitive's security

Stateful hash-based signatures need strict one-time-key discipline. Lattice and
hash-based schemes also introduce larger keys, new backup behavior, hardware
support gaps and unfamiliar rotation requirements. The recurring pattern was
operational: a sound primitive can fail when backups, concurrent signers,
threshold custody or recovery procedures do not preserve its assumptions.

### Verification cost is part of correctness

Post-quantum signatures and proofs are larger and often more expensive to verify.
Average valid-input benchmarks are insufficient for setting gas or fee schedules.
Malformed inputs, worst-case branches, repeated calls and mempool admission can
turn a verifier into a resource-amplification surface. Cheap rejection paths and
adversarial cost benchmarks belong in the security specification.

### Migration creates a second protocol

Hybrid periods accept classical and post-quantum authorization at the same time.
That creates new questions around domain separation, replay, downgrade behavior,
account recovery and the exact point where old keys lose authority. Migration
logic deserves the same review intensity as the new cryptographic implementation.

### Supply-chain maturity is uneven

Some projects build on standardized schemes, reproducible implementations and
independent audits. Others depend on research code, archived upstreams, custom
variants or libraries whose deployment history is thin. Standards compliance,
implementation assurance and protocol integration are separate claims, and all
three need evidence.

### Deployment reality changes the ranking

A serious defect in an undeployed proof of concept and a narrower weakness on a
funded mainnet cannot be ranked by cryptographic severity alone. Our disclosure
queue prioritizes realistic remote attackers, public data, current deployment
and assets at risk. Trusted-role, physical side-channel and future
quantum-computer scenarios remain important, but they sit in different urgency
classes.

## Where the signal was strongest

QRL, the Cardano Nightstream roadmap and the official Solana migration work in
Anza and Firedancer had no high or critical candidate survive the initial
adjudication. The Solana result is separate from the experimental
Falcon-on-Solana library, which was reviewed as its own target. This is the
closest thing the review produced to a clean high-severity result, and the caveat
matters. QRL has years of mainnet evidence but still retained medium-level
concerns around key management and protocol operations. Cardano and Solana were
mostly assessed at roadmap or pre-deployment stage, where implementation evidence
is necessarily limited.

Starknet and StarkWare were among the strongest positive results. Their
transparent, hash-based proving core avoids the classical assumptions that fail
under Shor's algorithm, the verifier has substantial production history, and the
surrounding stack has a broad audit footprint. The retained concerns clustered
around availability, governance and classical boundary components rather than a
break in the core proving construction or a straightforward remote-funds path.

Algorand also stood out for deployed post-quantum state proofs, a live path
toward post-quantum accounts and useful account rekeying. It retained
higher-priority concerns, so it belongs in the encouraging category rather than
the zero-finding category.

Historical migration deserves credit too. When a project has removed a risky
legacy construction from current consensus, we record the lesson without
presenting the old condition as a live vulnerability.

None of these observations is a certification. They identify evidence worth
copying: shipped cryptographic agility, honest scoping, explicit dependency
inventories, years of operational history and migration plans that name what
remains classical.

## What teams can do now

1. Publish an end-to-end cryptographic inventory covering transactions,
   consensus, governance, custody, bridges, light clients and recovery.
2. Bind signatures to the chain, protocol version, operation and authorization
   mode with explicit domain separation.
3. Treat stateful-signature counters and recovery state as consensus-sensitive
   data, with rollback, backup and concurrent-signer tests.
4. Benchmark invalid and worst-case verifier inputs before setting gas, fees or
   admission limits, and reject malformed inputs before expensive work.
5. Design the classical-to-PQ transition as a protocol with clear downgrade,
   revocation, replay and emergency-recovery rules.
6. Require independent review, reproducible builds and maintained upstreams for
   every quantum-critical implementation.

## Disclosure comes next

We are preparing project-specific reports in an order driven by realistic impact.
Maintainers will receive the relevant source evidence, deployment context and the
smallest useful reproduction privately. We will update the public record as
issues are fixed, disputed or coordinated for publication.

The broad conclusion is constructive. Post-quantum blockchain engineering is no
longer a purely hypothetical field. Real networks and serious migration programs
exist. The next level of maturity comes from making the surrounding systems as
rigorous as the cryptography they advertise.

## Limits of the review

This was a public-source and local-code review where repositories were available,
not a private full-scope audit of every codebase. Candidate counts include
multiple adversarial lenses before consolidation and should not be read as unique
vulnerability counts. Confirmed in source means the mechanism held up against
refutation; it does not automatically mean exploitation was executed or that
funds are currently exposed. Project state can also change quickly, so the
published status is anchored to July 2026 and will be revised through disclosure.
