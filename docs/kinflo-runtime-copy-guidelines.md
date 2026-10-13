# KinFlo runtime copy guidelines

Status: project rule

Date: October 13, 2026

KinFlo product screens should explain what a person can do, what has happened, and what needs to happen next. The interface should sound like a working product, not an engineering handoff.

## Runtime rule

Client and associate screens use normal product language. Keep implementation history, prompt provenance, source mapping, validator results, branch and pull-request details, deployment gates, and test-fixture terminology in documentation and QA records.

When a capability is unavailable, name the operational state:

- "Sign in before saving this request."
- "Draft saving is not available in this preview."
- "Private file uploads are not available in this release."
- "This sample is not an active order."

Avoid runtime labels such as:

- source-backed, fixture, synthetic, provenance, or evidence packet;
- validator, generated API, codegen, branch, commit, or PR number;
- prompt, source data, implementation boundary, or provider-light;
- database or framework names when the user only needs the product state.

Technical terms can appear when the product user needs them to complete a technical task. They should not appear merely to document how the screen was built.

## Review checklist

Before client or associate UI reaches review:

- Read the screen as a client or associate. Every message should answer a product question.
- State whether an action is available, what it will do, and what the person should do next.
- Keep privacy and access limits visible in plain language.
- Move provenance, architecture, test counts, and release evidence into docs or QA artifacts.
- Search changed runtime UI files for the avoided terms above.
- Confirm screenshots and walkthroughs show the final product copy.

This rule applies to public sites, client portals, admin workspaces, notifications, empty states, blockers, and recovery paths.
