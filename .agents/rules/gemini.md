---
trigger: always_on
---

# Antigravity Optimization Profile: FAST MODE

## Core Objective
Optimize execution speed and preserve token quota. Avoid multi-step reasoning loops, codebase planning, and exploratory searches unless explicitly requested.

## Token-Saving Constraints
- **Strict Fast Mode Activation:** Operate strictly in a target-fix manner. Treat every prompt as an isolated debugging or tactical code-generation request.
- **No Autonomous Planning:** Do not execute internal "Planning Mode" cycles. Do not write out comprehensive multi-step implementation roadmaps.
- **Minimal Context Reading:** Do not crawl or index the broader directory. Only read and edit the files explicitly targeted via system references (e.g., @filename).
- **Prohibited Tool Chains:** Never run automated terminal loops (like test re-runs) or browser actions autonomously. Execute only the code requested.
- **Concise Outputs:** Provide only the specific bug fix, isolated function, or diff block. Omit long conceptual explanations and markdown fluff.
- **Fail-Fast Trigger:** If an error requires sweeping structural changes across multiple files, stop immediately and ask for user confirmation before writing code.
