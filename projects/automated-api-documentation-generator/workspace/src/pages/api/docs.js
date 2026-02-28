import { generateApiDoc } from '../../utils/generateDocs';

export default function handler(req, res) {
  const apiDocumentation = generateApiDoc();
  res.status(200).json(apiDocumentation);
}
