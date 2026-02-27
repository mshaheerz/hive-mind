import * as depGraph from 'dep-graph';

async function buildDependencyGraph() {
    const sourceCode = await fs.readFile('path/to/compiled/code', 'utf8');
    const ast = parser.parse(sourceCode, {
        sourceType: 'module',
    });
    const graph = depGraph.graphFromAST(ast);
    return graph;
}

export async function generateAST(code) {
    return parser.parse(code, {
        sourceType: 'module',
    });
}
