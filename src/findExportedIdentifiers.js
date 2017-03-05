/* @flow */
import type {NodePath} from 'babel-traverse';

export default function findExportedIdentifiers (path: NodePath | NodePath[], found: NodePath[] = []): Node[] {
  if (!path) {
    return found;
  }
  else if (Array.isArray(path)) {
    for (const item of path) {
      findExportedIdentifiers(item, found);
    }
    return found;
  }
  else if (path.isIdentifier()) {
    found.push(path.node);
  }
  else if (path.isAssignmentPattern()) {
    findExportedIdentifiers(path.get('left'), found);
  }
  else if (path.isArrayPattern()) {
    for (const element of path.get('elements')) {
      findExportedIdentifiers(element, found);
    }
  }
  else if (path.isObjectPattern()) {
    for (const property of path.get('properties')) {
      findExportedIdentifiers(property.get('value'), found);
    }
  }
  else if (path.isRestElement() || path.isRestProperty()) {
    findExportedIdentifiers(path.get('argument'), found);
  }
  else if (path.isFunction() || path.isClass()) {
    return findExportedIdentifiers(path.get('id'), found);
  }
  else if (path.isVariableDeclaration()) {
    for (const item of path.get('declarators')) {
      findExportedIdentifiers(item.get('id'), found);
    }
    return found;
  }
  else if (path.isExportSpecifier()) {
    return findExportedIdentifiers(path.get('local'), found);
  }
  return found;
}