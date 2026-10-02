declare module 'mathjax' {
  const MathJax: { init(config: object): Promise<unknown> } & Record<string, unknown>;
  export default MathJax;
}
