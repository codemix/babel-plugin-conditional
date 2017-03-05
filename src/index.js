/* @flow */

import type {NodePath, Scope} from 'babel-traverse';
import {parse} from 'babylon';
import findExportedIdentifiers from './findExportedIdentifiers';
type Node = {
  type: string;
};

type Context = {
  defaultUID: ? string;
  imports: {
    [path: string]: Node[];
  };
  exports: {
    [name: string]: string;
  };
  exportAlls: string[];
  scope: Scope;
};

export default function babelPluginConditional ({transform, transformFromAst, traverse, types: t}: any) {

  function makeTestNode (input: string): Node {
    const parsed = parse(input).program.body;
    for (const statement of parsed) {
      if (statement.type === 'ExpressionStatement') {
        return statement.expression;
      }
    }
    return t.booleanLiteral(false);
  }

  function makeBranch (context: Context, node: Node, plugins: any[]): Node {
    const transformed = transformFromAst(node, null, {
      babelrc: false,
      plugins
    });

    const program = transformed.ast.program;

    traverse(program, {
      ImportDeclaration (path: NodePath) {
        const statement = path.node;
        const source = statement.source.value;
        if (!context.imports[source]) {
          context.imports[source] = [];
        }
        const items = context.imports[source];
        specifierLoop: for (const specifier of statement.specifiers) {
          existingLoop: for (const item of items) {
            if (item.type === specifier.type && specifier.local.name === item.local.name) {
              continue specifierLoop;
            }
          }
          items.push(specifier);
        }
        path.remove();
      },
      ExportAllDeclaration (path: NodePath) {
        const source = path.node.source.value;
        if (context.exportAlls.indexOf(source) === -1) {
          context.exportAlls.push(source);
        }
        path.remove();
      },
      ExportDefaultDeclaration (path: NodePath) {
        context.defaultUID = context.defaultUID || path.scope.generateUid('default');
        path.replaceWith(t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.identifier(context.defaultUID),
            path.node.declaration
          )
        ))
      },
      ExportNamedDeclaration (path: NodePath) {
        const identifiers = [];
        if (path.has('declaration')) {
          const declaration = path.get('declaration');
          identifiers.push(...findExportedIdentifiers(declaration));
          path.replaceWith(path.node.declaration);
        }
        if (path.has('specifiers')) {
          const specifiers = path.get('specifiers');
          identifiers.push(...findExportedIdentifiers(specifiers));
          path.remove();
        }
        for (const identifier of identifiers) {
          const oldName = (identifier: any).name;
          context.exports[oldName] = oldName;
          const newName = path.scope.generateUid(oldName);
          path.scope.rename(oldName, newName);
          path.insertAfter(t.expressionStatement(
            t.assignmentExpression(
              '=',
              t.identifier(oldName),
              t.identifier(newName)
            )
          ));
        }
      }
    });
    return t.blockStatement(program.body);
  }

  return {
    visitor: {
      Program (path: NodePath, state: Object) {
        if (path.node.__visitedByBabelPluginConditional) {
          return;
        }
        const {opts} = state;
        const test = makeTestNode(opts.test);
        const body = path.get('body');

        const exportNames = [];

        const context: Context = {
          defaultUID: null,
          imports: {},
          exports: {},
          exportAlls: [],
          scope: path.scope
        };


        const consequent = makeBranch(context, t.cloneDeep(path.node), opts.consequent);
        const alternate = makeBranch(context, t.cloneDeep(path.node), opts.alternate);

        const header = [];

        for (const source in context.imports) {
          const specifiers = context.imports[source];
          const declaration = t.importDeclaration(specifiers, t.stringLiteral(source));
          header.push(declaration);
        }

        for (const name in context.exports) {
          header.push(t.exportNamedDeclaration(
            t.variableDeclaration(
              'let',
              [t.variableDeclarator(
                t.identifier(name)
              )]
            ),
            []
          ));
        }

        for (const source of context.exportAlls) {
          header.push(t.exportAllDeclaration(t.stringLiteral(source)));
        }
        const replacement = t.program([
          ...header,
          t.ifStatement(test, consequent, alternate)
        ]);
        replacement.__visitedByBabelPluginConditional = true;
        path.replaceWith(replacement);
      }
    }
  }
}