/* --------------------------------------------------------------------------------------------
 * Copyright (c) Muraak. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as  vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "multi-code-checker" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.check', onCommand);

    vscode.workspace.onDidSaveTextDocument(onSaved);

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

interface CodeChecker {
	maxNumberOfProblems: number;
	compileCommand: string;
	compileOptions: string[];
	diagDelimiter: string;
	parse: {
		diagInfoPattern: string;
		index: {
			file_name: number;
			line_pos: number;
			char_pos: number;
			severity: number;
		}
	};
}

class Setting {
    onSavedChecker: CodeChecker[] | undefined;
    onCommandChecker: CodeChecker[] | undefined;
}

function getSetting(document :vscode.TextDocument) : Setting | undefined
{
    let setting = new Setting;
    
    setting.onSavedChecker = vscode.workspace
        .getConfiguration('mcc', document.uri).get('checker.onSaved');
    setting.onCommandChecker = vscode.workspace
        .getConfiguration('mcc', document.uri).get('checker.onCommand');

    return setting;
}

function onSaved(document :vscode.TextDocument)
{
    let setting  = getSetting(document);

    if(setting)
    {
        // check by all onSavedChecker
        checkByAll(document, setting.onSavedChecker);
    }
}

function onCommand()
{
    if(vscode.window.activeTextEditor)
    {
        let target = vscode.window.activeTextEditor.document;
        let setting  = getSetting(target);

        if(setting)
        {
            // check by all onCommandChecker
            checkByAll(target, setting.onCommandChecker);
        }
    }
}

function checkByAll(document :vscode.TextDocument, checkers :CodeChecker[] | undefined)
{
    if(checkers)
    {
        checkers.forEach(checker => {
            check(document, checker);
        });
    }
}

function check(document :vscode.TextDocument, checker :CodeChecker)
{
    
}
