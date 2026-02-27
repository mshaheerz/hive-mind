module.exports = {
  name: 'frontend-stack-planner',
  version: '1.0.0',
  description: 'Provides web stack defaults and starter file checklist.',
  agents: ['nova', 'atlas', 'forge', 'pulse', 'sage'],
  params: {
    appKind: { type: 'string', required: false, default: 'dashboard', description: 'dashboard | landing | app' },
    preferNext: { type: 'boolean', required: false, default: true, description: 'Prefer Next.js over React/Vite' },
  },
  async execute(params = {}) {
    const preferNext = params.preferNext !== false;
    const appKind = String(params.appKind || 'dashboard');
    const stack = preferNext
      ? 'Next.js + TypeScript + Tailwind CSS'
      : 'React + Vite + TypeScript + Tailwind CSS';

    return {
      success: true,
      result: {
        stack,
        appKind,
        files: [
          'package.json',
          'src/app/page.tsx or src/main.tsx',
          'tailwind.config.js',
          '.env.example',
          '.gitignore',
          'tests/*.test.ts',
        ],
      },
    };
  },
};
