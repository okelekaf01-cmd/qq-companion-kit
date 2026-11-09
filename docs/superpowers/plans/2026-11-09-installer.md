# QQ Companion Kit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish a generic online installation kit and an offline-readable Chinese tutorial for Windows x64 and Linux amd64, based on the user's approved DSH + QQBridge + NapCat architecture.

**Architecture:** Docker Compose runs an initialization job, NapCat and a non-root DSH/QQBridge runtime. Localhost management ports and per-install random tokens protect setup. Named volumes keep user data separate from source. Source and packages contain generic settings only.

**Tech Stack:** Node 24, Docker Compose v2, PowerShell 5.1, Bash, static HTML/SVG.

- [ ] Test configuration generation, allowlist validation, first-run preservation and setup HTTP authentication.
- [ ] Implement pinned build, volume initialization, supervised runtime and authenticated setup UI.
- [ ] Implement repeatable Windows/Linux launchers, readiness checking and explicit prerequisite guidance.
- [ ] Write architecture-first DIY guide and short installation README. Include annotated diagrams, troubleshooting and backup instructions.
- [ ] Verify source, scripts, browser layout and image build when a Docker daemon is available. Record untested end-to-end steps.
- [ ] Scan tracked files for private data, publish source and a prerelease ZIP with SHA-256. No real QQ login or messages in tests.

Decisions delegated by the user: repository name qq-companion-kit, public GitHub repository, Windows x64/Linux amd64 first release. This is an online ZIP installer with Docker as prerequisite. Existing personal deployment remains separate.
