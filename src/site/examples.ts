export interface Example {
  name: string;
  math: string;
  lang: 'tex' | 'ascii';
}

export const EXAMPLES: Example[] = [
  { name: 'Sum', math: 'sum_(i=1)^N 2^i', lang: 'ascii' },
  { name: 'Quadratic', math: 'x = (-b +- sqrt(b^2 - 4ac)) / (2a)', lang: 'ascii' },
  { name: 'Euler', math: 'e^{i\\pi} + 1 = 0', lang: 'tex' },
  { name: 'Integral', math: '\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}', lang: 'tex' },
  { name: 'Matrix', math: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', lang: 'tex' },
  { name: 'Limit', math: 'lim_(n->oo) (1 + 1/n)^n = e', lang: 'ascii' },
  { name: 'Maxwell', math: '\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}', lang: 'tex' },
];
