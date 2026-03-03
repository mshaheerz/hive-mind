# PR Review Hub

A self‑hosted dashboard that aggregates open Pull Requests from multiple GitHub repositories, allowing developers to review and comment inline without leaving the app.

## Table of Contents
- [Features](#features)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [GitHub OAuth Setup](#github-oauth-setup)
- [Security Considerations](#security-considerations)
- [Rate‑Limit Handling](#rate-limit-handling)
- [Testing](#testing)
- [Deployment](#deployment)

## Features
- Aggregate open PRs from ≥ 5 repositories.
- Inline commenting that syncs back to GitHub.
- Real‑time refresh (≤ 30 s) using Server Actions.
- GitHub OAuth authentication respecting repository permissions.

## Quick Start
