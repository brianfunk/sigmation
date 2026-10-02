export interface Example {
  name: string;
  math: string;
  lang: 'tex' | 'ascii';
}

export const EXAMPLES: Example[] = [
  { name: 'Sum', math: 'sum_(i=1)^N 2^i', lang: 'ascii' },
  { name: 'Quadratic', math: 'x = (-b +- sqrt(b^2 - 4ac)) / (2a)', lang: 'ascii' },
  { name: 'Pythagoras', math: 'a^2 + b^2 = c^2', lang: 'ascii' },
  { name: 'Euler', math: 'e^{i\\pi} + 1 = 0', lang: 'tex' },
  { name: 'Mass–energy', math: 'E = mc^2', lang: 'tex' },
  { name: 'Schrödinger', math: 'i\\hbar \\frac{\\partial}{\\partial t} \\Psi(\\mathbf{r},t) = \\hat{H} \\Psi(\\mathbf{r},t)', lang: 'tex' },
  { name: 'Einstein field', math: 'G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}', lang: 'tex' },
  { name: 'Maxwell', math: '\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}', lang: 'tex' },
  { name: 'Newton', math: '\\mathbf{F} = G \\frac{m_1 m_2}{r^2}', lang: 'tex' },
  { name: 'Entropy', math: 'S = k_B \\ln W', lang: 'tex' },
  { name: 'Gaussian', math: '\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}', lang: 'tex' },
  { name: 'Normal', math: 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}', lang: 'tex' },
  { name: 'Fourier', math: '\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x)\\, e^{-2\\pi i x \\xi}\\, dx', lang: 'tex' },
  { name: 'Limit', math: 'lim_(n->oo) (1 + 1/n)^n = e', lang: 'ascii' },
  { name: 'Matrix', math: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', lang: 'tex' },
];
