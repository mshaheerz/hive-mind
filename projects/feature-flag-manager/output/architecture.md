### System Overview
The Feature Flag Manager is a Next.js web application that provides a simple UI for creating, toggling, and versioning feature flags. It utilizes Next.js server actions for instant flag updates and stores flags in Vercel KV or a JSON file. The application enables per-environment controls and is designed for self-hosting.

### Component Diagram
```mermaid
graph LR
    A[User] -->|Interacts with| B[Next.js App]
    B -->|Fetches/Updates| C[Feature Flag Storage (Vercel KV/JSON)]
    B -->|Renders| D[Feature Flag UI]
    D -->|Displays| E[Feature Flags with Toggle and Versioning]
    B -->|Handles| F[Environment Controls]
```

### Data Flow
1. The user interacts with the Next.js application through the UI.
2. The application fetches or updates feature flags from the chosen storage (Vercel KV or JSON file) using Next.js server actions.
3. The UI displays the feature flags with toggle and versioning capabilities.
4. The user can select environment controls, which are handled by the application.

### File/Folder Structure
```plaintext
feature-flag-manager/
├── app/
│   ├── components/
│   │   ├── FeatureFlagList.js
│   │   ├── FeatureFlagToggle.js
│   │   └── EnvironmentControls.js
│   ├── actions/
│   │   ├── createFeatureFlag.js
│   │   ├── toggleFeatureFlag.js
│   │   └── getFeatureFlags.js
│   ├── api/
│   │   └── featureFlags.js
│   ├── layout.js
│   └── page.js
├── public/
├── prisma/ 
│   └── schema.prisma
├── utils/
│   └── featureFlags.js
├── .env
├── next.config.js
└── package.json
```

### Key Technical Decisions + Justification
- **Next.js 15**: Chosen for server-side rendering, static site generation, and built-in support for server actions and API routes.
- **Tailwind CSS**: Selected for utility-first CSS and easy customization.
- **Lucide Icons**: Used for a consistent and modern icon set.
- **Vercel KV or JSON file**: Chosen for storing feature flags, with Vercel KV offering a scalable solution and JSON file providing simplicity.
- **Prisma**: Used for database schema management and type safety.

### Template/Bootstrap Plan
- **nextjs**: The project will use the `nextjs` template, running `npx create-next-app@latest` to create a new Next.js application.

### FORGE EXECUTION CONTRACT

#### Required Files FORGE Must Create/Modify
- `app/components/FeatureFlagList.js`
- `app/components/FeatureFlagToggle.js`
- `app/components/EnvironmentControls.js`
- `app/actions/createFeatureFlag.js`
- `app/actions/toggleFeatureFlag.js`
- `app/actions/getFeatureFlags.js`
- `app/api/featureFlags.js`
- `prisma/schema.prisma`
- `utils/featureFlags.js`

#### Minimum Test Targets
- Feature flag creation
- Feature flag toggling
- Environment control selection and functionality
- Data persistence in Vercel KV or JSON file

#### Acceptance Criteria
- The UI allows creation of at least 10 feature flags without errors.
- Toggling a feature flag updates its status in real-time via Next.js server actions.
- Per-environment controls are selectable and functional for at least 3 environments (e.g., dev, staging, prod).
- Feature flags are persisted correctly in Vercel KV or a JSON file.
- The application can be self-hosted without reliance on external third-party services.

#### Non-Goals
- Integration with external feature flag management services
- Support for complex flag configurations (e.g., multivariate flags)

### What FORGE Needs to Know to Start Coding
- Confirmation of storage choice (Vercel KV or JSON file)
- Specific requirements for environment controls and feature flag versioning
- Any additional features or integrations needed beyond the core functionality