import { getDictionary } from './getDictionary';
import { ParseOptions, parseForEslint } from 'babel-eslint';
/**
 * utils.js
 * @Author: Richard<xiaoweihsueh@gmail.com>
 * @Link: http://www.gistop.com/
 * @Date: 10/9/2018, 5:55:04 PM
 */

import {
  window,
  workspace,
  Range,
  WorkspaceEdit,
  TextDocument,
  Definition,
  Position
} from 'vscode';

import jsonParse from 'json-to-ast';
import {
  JsonArray,
  JsonObject,
  JsonLoc,
  JsonLiteral,
  JsonParseSettings,
  JsonProperty
} from 'json-to-ast';

import { AST } from 'eslint';
import { BaseNode, Program } from 'estree';

/**
 * Replace selection with i18n statement
 * @param dictionary object, i18n dictionary
 * @param withContainer boolean, indicate if wrapped with bracket
 */
export const i18nReplace = (
  dictionary: object,
  withContainer: boolean = false
) => {
  const activeTextEditor = window.activeTextEditor;
  if (activeTextEditor) {
    const { selection } = activeTextEditor;
    const { document } = activeTextEditor;
    if (!selection.isEmpty) {
      const range = new Range(selection.start, selection.end);
      const text = document.getText(range);
      const keys = Object.keys(dictionary);
      let key: string | undefined;
      for (let i = 0; i < keys.length; i++) {
        key = keys[i];
        if (dictionary[key] === text) {
          const edit = new WorkspaceEdit();
          const newText = withContainer ? `{intl('${key}')}` : `intl('${key}')`;
          edit.replace(document.uri, range, newText);
          workspace.applyEdit(edit);
          return;
        }
      }
      window.showWarningMessage(`Can't find "${text}" in the dictionary.`);
    } else {
      window.showWarningMessage(
        'Please select the literal you want to replace with i18n.'
      );
    }
  }
};

/**
 * Replace all literal in current document with i18n statement
 * @param dictionary object, i18n dictionary
 */
export const i18nReplaceCurrentDocument = (dictionary: object) => {};

/**
 * Replace all literal in all documents with i18n statement
 * @param dictionary object, i18n dictionary
 */
export const i18nReplaceAllDocuments = (dictionary: object) => {};

/**
 * get i18n definitions from a json document
 * @param code string code of dictionary file, json or javascript
 */
export const getI18nDefinitionsFromJson = (
  document: TextDocument
): Map<string, Definition> => {
  const i18nDefinitions = new Map<string, Definition>();
  const settings: JsonParseSettings = {
    loc: true,
    source: ''
  };
  const json: JsonObject = jsonParse(document.getText(), settings);
  if (json && json.children && json.children.length > 0) {
    const properties = json.children;
    properties.map((property: JsonProperty) => {
      const key = property.key.value;
      const definition: Definition = {
        uri: document.uri,
        range: new Range(
          document.positionAt(property.loc.start.offset),
          document.positionAt(property.loc.end.offset)
        )
      };
      i18nDefinitions.set(key, definition);
      return property;
    });
  }
  return i18nDefinitions;
};

/**
 * get i18n dictionary from a javascript document
 * @param document a javascipt document returns the dictionary
 */
export const getI18nDefinitionsFromJavascript = (
  document: TextDocument
): Map<string, Definition> => {
  const i18nDefinition = new Map<string, Definition>();
  const ast: AST.Program = getAstFromECMAScript(document);
  const dictionary = getDictionary();

  return i18nDefinition;
};

/**
 * get ast of the passed in document, using babel-eslint parser
 * @param document TextDocument, a text document
 */
export const getAstFromECMAScript = (document: TextDocument): AST.Program => {
  const code = document.getText();
  const options = {
    ecmaVerion: 2017
  };
  return parseForEslint(code, options);
};

/**
 * exchange key and value, convinence for to get key by value. Values must be unique.
 * @param obj object to be converted
 */
export const exchangeKeyValue = (obj: Object): Map<any, any> => {
  const exchangedObject = new Map<any, any>();
  for (let key in obj) {
    exchangedObject.set(obj[key], key);
  }
  return exchangedObject;
};

interface EslintNode extends BaseNode {
  start: number;
  end: number;
}

/**
 * if a position in the span of a node
 * @param node EslintNode
 * @param position Position
 * @returns boolean
 */
export const inNodeSpan = (node: EslintNode, position: Position): boolean => {
  const { start, end } = node;
  const { line } = position;
  return line >= start && line <= end;
};

/**
 * get the minimum node with the given position
 * @param node 从节点
 */
export const getMinimumNode = (
  node: EslintNode,
  position: Position
): EslintNode => {
  return null;
};
