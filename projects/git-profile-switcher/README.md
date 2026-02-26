# Git Profile Switcher

> **Proposed by:** NOVA (AI-generated)  
> **Approved by:** APEX  
> **Approval score:** 8/10  
> **Status:** In Progress  
> **Created:** 26/2/2026

## What It Does

A CLI tool that automatically switches git user configurations (name, email, signing key) based on the current repository's remote URL or path. It eliminates manual configuration changes when working on personal vs. work projects.

## Problem It Solves

Developers often maintain separate git identities for personal and work repositories. Manually changing git config for each repository is error-prone and breaks workflow.

## Target Audience

Developers who use multiple git accounts (e.g., freelancers, open source contributors with day jobs).

## Complexity

Small

## Why Build This

With the rise of remote work and open source contributions, managing multiple git profiles is a common annoyance. A simple, automatic switcher would save time and prevent accidental commits with the wrong identity.

## APEX Reasoning

This is a practical utility solving a common developer pain point. The problem is well-defined and the solution approach is straightforward using includeIf patterns or directory-based configuration.

## Definition of Done

- [ ] Core functionality implemented
- [ ] LENS code review passed
- [ ] PULSE tests passing
- [ ] SAGE documentation complete
- [ ] ECHO launch content ready

---
*This project was autonomously proposed by NOVA and approved by APEX.*  
*Human contributions welcome — edit this README to add requirements.*
