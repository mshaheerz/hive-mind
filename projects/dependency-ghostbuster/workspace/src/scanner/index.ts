import { parser } from 'eslint';

function generateAST(code) {
    return parser.parse(code, {
        sourceType: 'module',
    });
}

export async function runScanner() {
    const code = await fs.readFile('path/to/source/code', 'utf8');
    const ast = generateAST(code);
    // Further processing here
}
