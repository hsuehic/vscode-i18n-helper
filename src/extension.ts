import * as path from 'path';
import {
  KEY_INTL_DICTIONARY_PATH,
  KEY_INTL_STATEMENT_PATTERN
} from './constant';
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
  DefinitionLink
} from 'vscode';
import { getConfig } from './config';
import { createIntlCompletionItem } from './createIntlCompletionItem';
import { getDictionary } from './getDictionary';
import {
  i18nReplace,
  i18nReplaceCurrentDocument,
  i18nReplaceAllDocuments
} from './utils';

let completionItems: CompletionItem[] = [];
let dictionaryWatcher: FileSystemWatcher | undefined;
let dictionary: Object = {};

const decorationType = window.createTextEditorDecorationType({
  backgroundColor: 'rgba(233, 233, 0, 0.5)',
  color: '#ffffff'
});

function getIntlKeyDecoration(match: RegExpMatchArray) {
  const len = match.length;
  let key = match[1];
  for (let i = 2; i < len; i++) {
    key = match[i] || key;
  }
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

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  dictionary = getDictionary();
  let activeTextEditor = window.activeTextEditor;

  // enable validation
  const disposableEnableValidation = commands.registerCommand(
    'i18nHelper.enableValidation',
    () => {
      window.showInformationMessage('I18n validation enabled');
    }
  );

  // disable validation
  const disposableDisableValidation = commands.registerCommand(
    'i18nHelper.disableValidation',
    () => {
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
    ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
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
    timer = setTimeout(updateDecorations, 500);
  }

  /**
   * Update intl keys decorations
   */
  function updateDecorations() {
    if (activeTextEditor) {
      let document = activeTextEditor.document;
      if (document) {
        try {
          let text = document.getText();
          let intlKeys: DecorationOptions[] = [];
          let pattern = getConfig(KEY_INTL_STATEMENT_PATTERN);
          let reg = new RegExp(pattern, 'igm');
          let match = reg.exec(text);
          while (match) {
            intlKeys.push(getIntlKeyDecoration(match));
            match = reg.exec(text);
          }
          activeTextEditor.setDecorations(decorationType, intlKeys);
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
    dictionary = getDictionary();
    triggerUpdateDecorations();
  });

  context.subscriptions.push(disposableDisableValidation);
  context.subscriptions.push(disposableEnableValidation);
  context.subscriptions.push(disposableReplaceAllWithI18n);
  context.subscriptions.push(disposableReplaceAllWithI18nContainer);
  context.subscriptions.push(disposableReplaceWithI18n);
  context.subscriptions.push(disposableReplaceWithI18nContainer);
  context.subscriptions.push(disposableCompletion);
}

// this method is called when your extension is deactivated
export function deactivate() {}
