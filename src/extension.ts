import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let explorerDisposable = vscode.commands.registerCommand(
        'explorer.migrateme',
        (uri: vscode.Uri) => {
            fire(uri);
        }
    );

    let editorDisposable = vscode.commands.registerCommand(
        'editor.migrateme',
        (uri: vscode.Uri) => {
            fire(uri);
        }
    );

    context.subscriptions.push(explorerDisposable);
    context.subscriptions.push(editorDisposable);
}

function fire(uri: any) {
    const { fsPath } = uri;

    // Open Terminal
    vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal');

    // Get Migration Terminal
    const migrationTerminal = ensureTerminalExists();

    // Run Migration
    if (migrationTerminal) {
        migrationTerminal.show();
        migrate(fsPath, migrationTerminal);
    }
}

function migrate(fsPath: string, terminal: any) {
    const fleekPath = fsPath.split('fleek')[0] + 'fleek';
    const fileInfo = fsPath.split('/');
    const fileSchema = fileInfo[fileInfo.length - 2];
    const fileName = fileInfo[fileInfo.length - 1].replace('.sql', '');
    const file = fileSchema.concat('.', fileName);

    let typeName;

    switch (true) {
        case fsPath.includes('/database/views/'):
            typeName = 'view';
            break;
        case fsPath.includes('/database/stored-procedures/'):
            typeName = 'sp';
            break;
        case fsPath.includes('/database/triggers/'):
            typeName = 'trigger';
            break;
        default:
            typeName = '';
            break;
    }

    interface TypeMap {
        [key: string]: string;
    }

    const type: TypeMap = {
        view: 'view',
        sp: 'proc',
        trigger: 'trigger',
    };

    terminal.sendText(`cd ${fleekPath}`);

    if (fsPath.includes('/database/migrations/')) {
        // For Normal Migration
        terminal.sendText('yarn sam migrate');
    } else {
        // For View, SP and Trigger Migrations
        terminal.sendText(`yarn sam alter:${type[typeName]} ${file}`);
    }
}

function ensureTerminalExists() {
    let t;

    const currentTerminal = (<any>vscode.window).terminals.filter(
        (t: any) => t._name === 'migration'
    );

    if (
        (<any>vscode.window).terminals.length === 0 ||
        currentTerminal.length === 0
    ) {
        t = vscode.window.createTerminal('migration');
    }

    // return migration terminal
    // If it doesn't exist, creat one and return it
    return t || currentTerminal[0];
}

// this method is called when your extension is deactivated
export function deactivate() {}
