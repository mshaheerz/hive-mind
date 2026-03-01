 To implement the workflow-template-seeder skill, we need to create a new template directory based on a short spec provided by the user, using skills as the primary execution engine. Below is a detailed implementation plan for this task.

## Workflow: Template Seeder (Skills → Templates)

### Goal
The goal of this workflow is to turn a short template spec into a runnable, documented template under `templates/`. This will be achieved by chaining existing skills (intake → ship-faster stages) while keeping it clean and shareable (no secrets, minimal scope).

### Input
- `repo_root`: Ship Faster repository root (where `templates/` lives)
- `run_dir`: `runs/template-seeder/active/<run_id>/`
- `template_spec.md`: One-page spec (what it is, target user, core pages, required integrations)

### Output
- `03-plans/template-plan.md`
- `05-final/template-summary.md`
- A new template directory: `templates/<NNN>-<slug>/` containing:
  - `README.md` (5‑minute runnable)
  - `.env.local.example` (keys only)
  - `metadata.json`

### Workflow Steps

#### 0) Initialize
1. Create `run_dir`.
2. Determine `<slug>` from spec (kebab-case) and `<NNN>` as the next available number under `templates/` (001, 002, …).
3. Write `01-input/context.json`:
   - `entry_type: idea`
   - `repo_root: <path-to-new-template-dir>`
   - `need_deploy: false` (templates should not auto-deploy)
   - Enable only the integrations required by the spec (DB/billing/SEO)

#### 1) Generate the template baseline (prefer clean + minimal)
- **Preferred path**: Create a clean Next.js baseline in the new template directory, then run the same "Ship Faster chain" against it.
- Execution order:
  1. `workflow-project-intake` (optional if spec is already complete)
  2. `workflow-ship-faster` with the template directory as `repo_root`
  3. If any steps are skipped, record why in `00-index.md` / `05-final/template-summary.md`.

#### 2) Template hardening (shareable output)
- Must do:
  - Remove secrets; only keep env **key names** in `.env.local.example`.
  - Ensure `README.md` includes:
    - Node version
    - install + dev
    - required env keys
    - optional integrations notes
  - Ensure `metadata.json` is accurate and generic (no private branding unless intended).

#### 3) Verification
- At minimum, document results in `05-final/template-summary.md`:
  - install works
  - `dev` starts
  - `build` succeeds (if the template requires external credentials, document the minimal required keys).

### Constraints
- Do not create a "kitchen sink" template.
- Avoid large refactors; prefer small, clean baselines that are easy to adapt.
- Never commit secrets.

### Implementation Plan
1. **Initialize**: Create `run_dir` and determine `<slug>` and `<NNN>`. Write `context.json` with the required fields.
2. **Generate the template baseline**: Use a clean Next.js baseline and run the Ship Faster chain against it.
3. **Template hardening**: Remove secrets, update documentation, and prepare metadata.
4. **Verification**: Document the results in `template-summary.md`.

### Example Implementation
```markdown
## Initialize
1. Create `runs/template-seeder/active/<run_id>/`.
2. Extract `<slug>` from `template_spec.md` and determine `<NNN>`.
3. Write `01-input/context.json`:
   ```json
   {
     "entry_type": "idea",
     "repo_root": "<path-to-new-template-dir>",
     "need_deploy": false,
     "integrations": ["DB", "billing", "SEO"]
   }
   ```

## Generate the template baseline
1. Create a new directory `templates/<NNN>-<slug>/`.
2. Initialize a clean Next.js project in this directory.
3. Run the Ship Faster chain against this directory:
   - `workflow-project-intake` (optional)
   - `workflow-ship-faster` with `<path-to-new-template-dir>` as `repo_root`.

## Template hardening
1. Remove all secrets from the project files.
2. Update `README.md` with installation, development setup instructions, required env keys, and optional integrations notes.
3. Create `metadata.json`:
   ```json
   {
     "name": "<slug>",
     "description": "A minimal template based on the <slug> specification."
   }
   ```

## Verification
Document the results in `05-final/template-summary.md` indicating:
- Installation works (`npm install` succeeds).
- Development starts successfully (`npm run dev`).
- Build succeeds (`npm run build` without errors, if required credentials are missing, document them).
```

### Final Output Format
Ensure the following format for every file modified:
**File: `relative/path/to/file.ext`**
```json
// full file content
```

This implementation plan ensures that the template creation process is efficient and adheres to the constraints provided by the workflow-template-seeder skill definition.