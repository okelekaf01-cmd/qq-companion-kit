# QQ Companion Kit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish a generic online installation kit and an offline-readable Chinese tutorial for Windows x64 and Linux amd64, based on the user's approved DSH + QQBridge + NapCat architecture.

**Architecture:** Docker Compose runs an initialization job, NapCat and a non-root DSH/QQBridge runtime. Localhost management ports and per-install random tokens protect setup. Named volumes keep user data separate from source. Source and packages contain generic settings only.

**Tech Stack:** Node 24, Docker Compose v2, PowerShell 5.1, Bash, static HTML/SVG.

- [x] Test configuration generation, allowlist validation, first-run preservation and setup HTTP authentication.
- [x] Implement pinned build, volume initialization, supervised runtime and authenticated setup UI.
- [x] Implement repeatable Windows/Linux launchers, readiness checking and explicit prerequisite guidance.
- [x] Write architecture-first DIY guide and short installation README. Include annotated diagrams, troubleshooting and backup instructions.
- [x] Verify source, scripts, browser layout and image build. GitHub Actions 42623491269 built and started from fresh volumes successfully. QQ login and real Windows installation remain manual acceptance items.
- [x] Scan tracked files for private data and publish source. Release ZIP is generated from tracked source with SHA-256; release preparation follows this final documentation commit.

Decisions delegated by the user: repository name qq-companion-kit, public GitHub repository, Windows x64/Linux amd64 first release. This is an online ZIP installer with Docker as prerequisite. Existing personal deployment remains separate.

Final review corrected the pinned bridge dshReady status field, delayed setup readiness until bridge connection, made staging symlink retryable and removed the fixed species requirement from the default v2 persona. Independent review was read-only. Browser checks passed at 1440px and 390px, including route switching, fragment targets and document overflow.
