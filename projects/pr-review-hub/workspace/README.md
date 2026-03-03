# PR Review Hub

A self‑hosted dashboard that aggregates open Pull Requests from multiple GitHub repositories, allowing developers to review and comment inline without leaving the app.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [GitHub OAuth Setup](#github-oauth-setup)
- [Running the App](#running-the-app)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)
- [Rate‑Limit Handling](#rate-limit-handling)

## Features
- Aggregate open PRs from ≥ 5 repositories.
- Inline commenting that syncs back to GitHub.
- Real‑time refresh (≤ 30 s) using Server Actions.
- GitHub OAuth authentication respecting repository permissions.

## Installation

