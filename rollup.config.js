import terser from '@rollup/plugin-terser';

export default [{
  input: 'index.js',
  output: {
    file: 'dist/sync-promise-commonjs.cjs',
    format: 'cjs'
  }
}, {
  input: 'index.js',
  output: {
    file: 'dist/sync-promise-amd.js',
    format: 'amd'
  }
}, {
  input: 'index.js',
  output: {
    file: 'dist/sync-promise-amd.min.js',
    format: 'amd',
    plugins: [
      terser()
    ]
  }
}, {
  input: 'index.js',
  output: {
    file: 'dist/sync-promise-global.js',
    format: 'iife',
    name: 'SyncPromise'
  }
}, {
  input: 'index.js',
  output: {
    file: 'dist/sync-promise-global.min.js',
    format: 'iife',
    name: 'SyncPromise',
    plugins: [
      terser()
    ]
  }
}];
