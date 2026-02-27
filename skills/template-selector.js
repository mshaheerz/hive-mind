module.exports = {
  name: 'template-selector',
  version: '1.0.0',
  stage: 'tool',
  description: 'Selects the best starter template for a project idea.',
  contract: {
    input: ['projectType', 'preferredStack?'],
    output: ['success', 'result{template,stack,rationale}', 'error?'],
  },
  agents: ['nova', 'atlas', 'forge'],
  params: {
    projectType: { type: 'string', required: true, description: 'web_app | cli_tool | api_service | library | automation' },
    preferredStack: { type: 'string', required: false, default: '', description: 'Requested stack from proposal' },
  },
  async execute(params = {}) {
    const projectType = String(params.projectType || '').toLowerCase();
    const preferredStack = String(params.preferredStack || '').toLowerCase();

    let template = 'node-cli';
    let stack = 'Node.js + TypeScript';

    if (projectType === 'web_app' || preferredStack.includes('next')) {
      template = 'nextjs-starter';
      stack = 'Next.js + TypeScript + Tailwind CSS';
    } else if (preferredStack.includes('react') || preferredStack.includes('vite')) {
      template = 'react-vite-tailwind';
      stack = 'React + Vite + TypeScript + Tailwind CSS';
    } else if (preferredStack.includes('python') || projectType === 'automation') {
      template = 'python-cli';
      stack = 'Python + Click + Pytest';
    } else if (projectType === 'api_service') {
      template = 'node-api';
      stack = 'Node.js + TypeScript + Fastify';
    }

    return {
      success: true,
      result: {
        template,
        stack,
        rationale: `Selected ${template} for projectType=${projectType || 'unknown'}.`,
      },
    };
  },
};
