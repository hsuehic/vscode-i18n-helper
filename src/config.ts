/**
 * util methods for configurations
 */
import { workspace, window, Uri } from 'vscode';

/**
 * get the value of the node identified by the key
 * @param key {string} key of the config node
 * @returns string
 */
export function getConfig(key: string): string | undefined {
  let uri: Uri | undefined;
  if (window.activeTextEditor) {
    uri = window.activeTextEditor.document.uri;
  }
  const configs = workspace.getConfiguration(
    '',
    window.activeTextEditor.document.uri
  );
  return configs.get(key);
}
