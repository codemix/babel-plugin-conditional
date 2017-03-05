import fixtures from './fixtures';
import {equal} from 'assert';
import {transformFileSync} from 'babel-core';
import {format} from 'prettier';
import babelPluginConditional from '../src';

describe('babel-plugin-conditional', () => {

  for (const [name, {filename, expected}] of fixtures) {
    describe(`Fixture: ${name}`, () => {
      it('should run the fixture', () => {
        const transformed = transformFileSync(filename, {
          babelrc: false,
          presets: ['react'],
          plugins: [
            [babelPluginConditional, {
              test: 'process.env.TEST_CONDITION',
              consequent: [
                ['flow-runtime', {assert: true, annotate: false}]
              ],
              alternate: [
              ]
            }]
          ]
        }).code;

        const prettified = format(transformed);

        if (prettified.replace(/\s+/g, ' ') !== expected.replace(/\s+/g, ' ')) {
          equal(prettified, expected);
        }
      });
    });
  }
});