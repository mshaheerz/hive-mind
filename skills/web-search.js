module.exports = {
  name: 'web-search',
  version: '1.0.0',
  description: 'Search the web and return concise findings.',
  agents: ['scout', 'nova', 'atlas', 'echo'],
  params: {
    query: { type: 'string', required: true, description: 'Search query text' },
    maxResults: { type: 'number', required: false, default: 5, description: 'Maximum results to return' },
  },
  async execute(params = {}) {
    const query = String(params.query || '').trim();
    if (!query) return { success: false, error: 'query is required' };
    return {
      success: true,
      result: {
        query,
        maxResults: Number(params.maxResults || 5),
        note: 'Web search adapter placeholder: connect external search provider here.',
      },
    };
  },
};
