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
  Range
} from 'vscode';
import { getConfig } from './config';
import { createIntlCompletionItem } from './createIntlCompletionItem';
import { getDictionary } from './getDictionary';

let completionItems: CompletionItem[] = [];
let dictionaryWatcher: FileSystemWatcher | undefined;
let dictionary: object = {};

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

  // Verify whether all intl key exists.
  const disposable = commands.registerCommand(
    'intlHelper.validateIntlKeys',
    () => {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      console.log(new Date());
      window.showErrorMessage('Thare are some errors');
    }
  );

  // enable auto replace
  const disposableAutoReplace = commands.registerCommand(
    'intlHelper.autoReplace',
    () => {
      console.log(new Date());
      window.showInformationMessage('Replaced');
    }
  );

  // highlight all the intl statements
  const disposableHighlight = commands.registerCommand(
    'intlHelper.highlight',
    () => {
      console.log('highlight');
      console.log(new Date());
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

  context.subscriptions.push(disposable);
  context.subscriptions.push(disposableAutoReplace);
  context.subscriptions.push(disposableDictionaryWatcher);
  context.subscriptions.push(disposableCompletion);
}

// this method is called when your extension is deactivated
export function deactivate() { }
