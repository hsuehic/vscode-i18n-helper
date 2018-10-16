import { KEY_INTL_FUNCTION_NAME } from './constant';
import { getDictionary } from './getDictionary';
import {
  CompletionItem,
  CompletionItemKind,
  SnippetString,
  MarkdownString
} from 'vscode';
import { getConfig } from './config';

export function createIntlCompletionItem(): CompletionItem {
  const functionName = getConfig(KEY_INTL_FUNCTION_NAME);
  const dictionary = getDictionary();
  const keys = Object.keys(dictionary);
  const item = new CompletionItem(functionName, CompletionItemKind.Snippet);
  const suggestions = keys.join(',');
  item.insertText = new SnippetString(
    functionName + "('${1|" + suggestions + "|}')"
  );
  item.documentation = new MarkdownString('Insert a i18n statement');
  return item;
}
