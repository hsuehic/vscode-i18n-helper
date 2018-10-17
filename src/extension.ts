import * as path from 'path';
import { KEY_INTL_DICTIONARY_PATH, KEY_INTL_FUNCTION_NAME } from './constant';
import {
  commands,
  languages,
  window,
  ExtensionContext,
  CompletionItem,
  TextDocument,
  Position,
  CancellationToken,
  CompletionContext,
  workspace,
  FileSystemWatcher,
  DecorationOptions,
  Range,
  CompletionItemKind,
  WorkspaceEdit,
  Definition,
  ProviderResult,
  DefinitionLink,
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity
} from 'vscode';
import { getConfig } from './config';
import { createIntlCompletionItem } from './createIntlCompletionItem';
import { getDictionary } from './getDictionary';
import {
  i18nReplace,
  i18nReplaceCurrentDocument,
  i18nReplaceAllDocuments,
  exchangeKeyValue,
  i18nEdit
} from './utils';
import {
  Program,
  Node,
  BaseNode,
  CallExpression,
  SimpleCallExpression
} from 'estree';
import { I18nCodeActionProvider } from './I18nCodeActionProvider';
const parse = require('babel-eslint').parse;
const walk = require('estree-walker').walk;

const documentSelector = [
  'javascript',
  'typescript',
  'javascriptreact',
  'typescriptreact'
];

let completionItems: CompletionItem[] = [];
let dictionaryWatcher: FileSystemWatcher | undefined;
let dictionary: object = {};
let exchangedDictionary: Map<string, string> = new Map<string, string>();
let isHighlightEnabled = true;

const decorationType = window.createTextEditorDecorationType({
  backgroundColor: 'rgba(0, 218, 0, 0.3)',
  color: '#ffffff'
});

const decorationTypeError = window.createTextEditorDecorationType({
  backgroundColor: 'rgba(218, 0, 0, 0.3)',
  color: '#ffffff'
});

const regEmpty = /^\s+$/g;
const regLeadingAndTrailingBlanks = /(^\s+)|(\s+$)/gm;

function getI18nKeyDecoration(match: RegExpMatchArray) {
  const len = match.length;
  let key = match[2];
  let startIndex = match.index + match[0].indexOf(key);
  let endIndex = startIndex + key.length;
  const document = window.activeTextEditor.document;
  return {
    range: new Range(
      document.positionAt(startIndex),
      document.positionAt(endIndex)
    ),
    hoverMessage: dictionary[key]
  };
}

function updateDictionary() {
  dictionary = getDictionary();
  exchangedDictionary = exchangeKeyValue(dictionary);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  updateDictionary();
  let diagnosticCollection: DiagnosticCollection = languages.createDiagnosticCollection(
    'i18n'
  );

  let activeTextEditor = window.activeTextEditor;

  // enable validation
  const disposableEnableValidation = commands.registerCommand(
    'i18nHelper.enableValidation',
    () => {
      isHighlightEnabled = true;
      triggerUpdateDecorations();
      window.showInformationMessage('I18n validation enabled');
    }
  );

  // disable validation
  const disposableDisableValidation = commands.registerCommand(
    'i18nHelper.disableValidation',
    () => {
      isHighlightEnabled = false;
      triggerUpdateDecorations();
      window.showInformationMessage('I18n validation disabled');
    }
  );

  // replace selection with i18n statement
  const disposableReplaceWithI18n = commands.registerCommand(
    'i18nHelper.replaceWithI18n',
    () => {
      i18nReplace(dictionary, false);
    }
  );

  // replace selection with i18n container statement
  const disposableReplaceWithI18nContainer = commands.registerCommand(
    'i18nHelper.replaceWithI18nContainer',
    () => {
      i18nReplace(dictionary, true);
    }
  );

  // replace all literal with i18n statement
  const disposableReplaceAllWithI18n = commands.registerCommand(
    'i18nHelper.replaceCurrentDocumentWithI18n',
    () => {
      i18nReplaceCurrentDocument(dictionary);
    }
  );

  // replace all literal with i18n container statement
  const disposableReplaceAllWithI18nContainer = commands.registerCommand(
    'i18nHelper.replaceAllDocumentsWithI18n',
    () => {
      i18nReplaceAllDocuments(dictionary);
    }
  );

  const disposableFixLiteralCodeAction = commands.registerCommand(
    'i18nHelper.fixLiteralCodeAction',
    (document: TextDocument, range: Range, diagnostic: Diagnostic) => {
      if (diagnostic.code) {
        i18nEdit(document, range, diagnostic.code.toString(), true);
      }
    }
  );

  completionItems = [createIntlCompletionItem()];

  const disposableCompletion = languages.registerCompletionItemProvider(
    'javascript',
    {
      provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext
      ): CompletionItem[] {
        return completionItems;
      }
    }
  );

  const disposableGoDefinition = languages.registerDefinitionProvider(
    documentSelector,
    {
      provideDefinition(
        document: TextDocument,
        position: Position,
        token: CancellationToken
      ): ProviderResult<Definition | DefinitionLink[]> {
        return [];
      }
    }
  );

  let timer;
  function triggerUpdateDecorations() {
    if (timer) {
      clearTimeout(timer);
    }
    // timer = setTimeout(updateDecorations, 300);
    timer = setTimeout(updateDecorationsByWalkingAst, 300);
  }

  /**
   * Update i18n keys decorations, using regex search
   */
  function updateDecorations() {
    if (activeTextEditor) {
      let document = activeTextEditor.document;
      if (document) {
        try {
          let text = document.getText();
          let i18nKeys: DecorationOptions[] = [];
          if (isHighlightEnabled) {
            let functionId = getConfig(KEY_INTL_FUNCTION_NAME);
            let reg = new RegExp(
              `[\\s\\{(]${functionId}\\(('|\\\")([a-zA-Z)[0-9A-Za-z-_\\.]*)\\1\\)`,
              'igm'
            );
            let match = reg.exec(text);
            while (match) {
              i18nKeys.push(getI18nKeyDecoration(match));
              match = reg.exec(text);
            }
          }
          activeTextEditor.setDecorations(decorationType, i18nKeys);
        } catch (ex) {
          console.error(ex);
        }
      }
    }
  }

  /**
   * Update i18n keys decorations, by walking the ast
   */
  function updateDecorationsByWalkingAst() {
    diagnosticCollection.clear();
    if (activeTextEditor) {
      let document = activeTextEditor.document;
      if (document) {
        try {
          const text = document.getText();
          const i18nKeys: DecorationOptions[] = [];
          const literals: DecorationOptions[] = [];
          const diagnostics: Diagnostic[] = [];
          if (isHighlightEnabled) {
            let functionId = getConfig(KEY_INTL_FUNCTION_NAME);
            const ast: Program = parse(text, {
              ecmaVersion: 2017,
              sourceType: 'module'
            });
            walk(ast, {
              enter: (node: Node, parent: Node) => {},
              leave: (node: BaseNode, parent: BaseNode) => {
                const { type } = node;
                if (type === 'CallExpression') {
                  const callExpression: SimpleCallExpression = node as SimpleCallExpression;
                  const { callee } = callExpression;
                  // highlight i18n keys
                  if (callee.name === functionId) {
                    if (callExpression.arguments.length > 0) {
                      let arg0 = callExpression.arguments[0];
                      const { start, end, value: key } = arg0;
                      if (arg0.type === 'Literal') {
                        i18nKeys.push({
                          range: new Range(
                            document.positionAt(start),
                            document.positionAt(end)
                          ),
                          hoverMessage: dictionary[key]
                        });
                      }
                    }
                  }
                } else if (type === 'Literal') {
                  // check for literals
                  if (parent.type === 'JSXElement') {
                    if (!regEmpty.test(node.raw)) {
                      const i18nContent = node.raw.replace(
                        regLeadingAndTrailingBlanks,
                        ''
                      );
                      if (i18nContent) {
                        const index = node.raw.indexOf(i18nContent);
                        const start = node.start + index;
                        const end = start + i18nContent.length;
                        const i18nKey = exchangedDictionary.get(i18nContent);
                        const hoverMessage = i18nKey
                          ? `please replace with ${functionId}('${i18nKey}')`
                          : 'This is not a corresponding key for this literal, please add one.';
                        const range = new Range(
                          document.positionAt(start),
                          document.positionAt(end)
                        );
                        // literals.push({
                        //   range,
                        //   hoverMessage
                        // });
                        const diagnostic = new Diagnostic(
                          range,
                          hoverMessage,
                          DiagnosticSeverity.Error
                        );
                        diagnostic.code = i18nKey;
                        diagnostic.source = 'i18n';
                        diagnostics.push(diagnostic);
                      }
                    }
                  }
                }
              }
            });
          }
          activeTextEditor.setDecorations(decorationType, i18nKeys);
          activeTextEditor.setDecorations(decorationTypeError, literals);
          diagnosticCollection.set(document.uri, diagnostics);
        } catch (ex) {
          console.error(ex);
        }
      }
    }
  }

  if (activeTextEditor) {
    triggerUpdateDecorations();
  }
  window.onDidChangeActiveTextEditor(editor => {
    activeTextEditor = editor;
    if (activeTextEditor) {
      triggerUpdateDecorations();
    }
  });
  workspace.onDidChangeTextDocument(
    e => {
      if (activeTextEditor && e.document === activeTextEditor.document) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );
  const dictionaryPath = getConfig(KEY_INTL_DICTIONARY_PATH);
  const rootPath = workspace.rootPath;
  const dictionaryFullPath = path.join(rootPath, dictionaryPath);

  dictionaryWatcher = workspace.createFileSystemWatcher(dictionaryFullPath);
  const disposableDictionaryWatcher = dictionaryWatcher.onDidChange(e => {
    completionItems = [createIntlCompletionItem()];
    updateDictionary();
    triggerUpdateDecorations();
  });

  context.subscriptions.push(disposableDisableValidation);
  context.subscriptions.push(disposableEnableValidation);
  context.subscriptions.push(disposableReplaceAllWithI18n);
  context.subscriptions.push(disposableReplaceAllWithI18nContainer);
  context.subscriptions.push(disposableReplaceWithI18n);
  context.subscriptions.push(disposableReplaceWithI18nContainer);
  context.subscriptions.push(disposableCompletion);
  context.subscriptions.push(diagnosticCollection);
  context.subscriptions.push(
    languages.registerCodeActionsProvider(
      documentSelector,
      new I18nCodeActionProvider()
    )
  );
  context.subscriptions.push(disposableFixLiteralCodeAction);
}

// this method is called when your extension is deactivated
export function deactivate() {}
