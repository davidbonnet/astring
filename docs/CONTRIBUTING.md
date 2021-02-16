# Contributing to Astring

Suggestions and changes are welcome and can be made through issue tickets and pull requests.

## Code

Formatted code is written out through `state.write(code)` calls. The `code` can end with a `state.lineEnd`, but no use of `state.lineEnd` must be made within. In that case, multiple `state.write()` calls should be made.

## Tests

Code fixtures are used to assert that the generated code matches the expected content. These fixtures are located in `src/tests/fixtures/syntax`. Testing new syntax extensions simply consists of updating the files within that folder or by adding new files.

## Scripts

- `npm run build`: Produces a JavaScript 5-compliant modules at `dist/astring.js`.
- `npm run build:minified`: Produces a JavaScript 5-compliant modules at `dist/astring.min.js` along with a source map at `dist/astring.min.js.map`.
- `npm start`: Generates `dist/astring.js` and `dist/astring.js.map` at each change detected on `src/astring.js`.
- `npm test`: Runs tests.
- `npm run dev`: Runs tests and watches for changes.
- `npm run test:coverage`: Runs tests with coverage.
- `npm run test:scripts`: Runs tests over a large array of script files.
- `npm run test:performance`: Runs performance tests to ensure thresholds are met.
- `npm run benchmark`: Runs benchmarks against other code generators. Requires to run `npm install escodegen@1.8 uglify-js@2 babel-generator@6 buble@0.15` first.

## Roadmap

Planned features and releases are outlined on the [milestones page](https://github.com/davidbonnet/astring/milestones).
