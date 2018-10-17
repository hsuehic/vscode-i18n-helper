import {
  CodeActionProvider,
  TextDocument,
  Range,
  CodeActionContext,
  CancellationToken,
  Command,
  workspace,
  commands,
  CodeAction,
  CodeActionKind,
  ProviderResult
} from 'vscode';

/**
 * I18nCodeActionProvider.js
 * @Author: ()
 * @Link: http://www.gistop.com/
 * @Date: 10/16/2018, 8:19:13 PM
 */

export class I18nCodeActionProvider implements CodeActionProvider {
  provideCodeActions(
    document: TextDocument,
    range: Range,
    context: CodeActionContext,
    tocken: CancellationToken
  ): ProviderResult<(Command | CodeAction)[]> {
    if (context.diagnostics.length > 0) {
      const diagnostics = context.diagnostics.filter(
        diagnostic => diagnostic.source === 'i18n'
      );
      if (diagnostics.length > 0) {
        const diagnostic = diagnostics[0];
        let command: Command = {
          title: 'Replace with i18n expression?',
          tooltip: 'i18n',
          arguments: [document, diagnostic.range, diagnostic],
          command: 'i18nHelper.fixLiteralCodeAction'
        };
        return [command];
      }
    }
  }
}
