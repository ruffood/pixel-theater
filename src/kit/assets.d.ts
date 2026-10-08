/** webpack 把字体当 asset/resource 处理，import 进来是一个 URL。 */
declare module '*.woff2' {
  const url: string;
  export default url;
}
