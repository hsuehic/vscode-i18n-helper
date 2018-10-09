/**
 * utils.js
 * @Author: Richard<xiaoweihsueh@gmail.com>
 * @Link: http://www.gistop.com/
 * @Date: 10/9/2018, 5:55:04 PM
 */

import { window, workspace, Range, WorkspaceEdit } from 'vscode';

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
