// rollup.config.js
import { terser } from "rollup-plugin-terser"
import resolve from '@rollup/plugin-node-resolve'

export default {
  input: "src/vision-stage.js",
  output: [
    { file: "public/vision-stage.min.js", format: "esm", plugins: [terser({ output: { comments: false } })] },
  ],
  plugins: [ resolve() ],
  external: id => /z\-console/.test( id)
  // z-console needs to be a file to be sandboxed by chrome to show real line numbers
}
