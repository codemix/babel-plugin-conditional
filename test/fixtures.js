/* @flow */

import fs from 'fs';
import path from 'path';

const fixturesDir = path.join(__dirname, '__fixtures__');

const INCLUDE_PATTERN = process.env.TEST_FILTER
                   ? new RegExp(process.env.TEST_FILTER)
                   : null
                   ;

function findFiles (dirname: string, filenames: [string, string][]): [string, string][] {
  for (const filename of fs.readdirSync(dirname)) {
    const qualified = path.join(dirname, filename);
    if (/\.js$/.test(filename)) {
      filenames.push([
        qualified,
        qualified.slice(0, -3) + '.exp'
      ]);
    }
    else if (!/\.exp$/.test(filename)) {
      const stat = fs.statSync(qualified);
      if (stat.isDirectory()) {
        findFiles(qualified, filenames);
      }
    }
  }
  return filenames;
}

function filterIncluded ([filename, expected]: [string, string]): boolean {
  if (INCLUDE_PATTERN) {
    return INCLUDE_PATTERN.test(filename);
  }
  else {
    return true;
  }
}

const files = findFiles(fixturesDir, []);

export type Fixture = {
  filename: string;
  expected: string;
};

const fixtures: Map<string, Fixture> = new Map(files.filter(filterIncluded).map(([filename, exp]) => {
  // @flowIgnore
  const name = filename.slice(fixturesDir.length + 1, -3);
  const expected = fs.readFileSync(exp, 'utf8');
  return [name, {
    filename,
    expected
  }];
}));

export default fixtures;