import { workspace, window } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getConfig } from './config';
import { KEY_INTL_DICTIONARY_PATH } from './constant';

/**
 * Get and update i18n directory
 */
export const getDictionary = (): object => {
  const dictionaryPath = getConfig(KEY_INTL_DICTIONARY_PATH);
  const fullDictionaryPath = path.resolve(
    workspace.getWorkspaceFolder(window.activeTextEditor.document.uri).uri.path,
    dictionaryPath
  );
  let v = {};
  if (fs.existsSync(fullDictionaryPath)) {
    delete require.cache[require.resolve(fullDictionaryPath)];
    v = require(fullDictionaryPath);
  }
  return v;
};
