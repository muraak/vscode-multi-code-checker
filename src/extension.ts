/* --------------------------------------------------------------------------------------------
 * Copyright (c) Muraak. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as  vscode from 'vscode';
import * as path from "path";
import * as child_process from "child_process";
import * as iconv from "iconv-lite";

let _diag: vscode.DiagnosticCollection;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "multi-code-checker" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('mcc.check', onCommand);

    vscode.workspace.onDidSaveTextDocument(onSaved);

    context.subscriptions.push(disposable);

    // After create our diagnosticCollection, 
    // we can update diagnostic squiggles by _diag.set() method.
    _diag = vscode.languages.createDiagnosticCollection("mcc");
}

// this method is called when your extension is deactivated
export function deactivate() {
    
    // release diagnostic collection
    _diag.dispose();
}

interface CodeChecker {
    maxNumberOfProblems: number;
    compileCommand: string;
    compileOptions: string[];
    includeOptionPrefix: string;
    includePath: {
        absolute: string[];
        relative: string[];
    };
    diagDelimiter: string;
    parse: {
        encoding: string;
        diagInfoPattern: string;
        index: {
            file_name: number;
            line_pos: number;
            char_pos: number;
            severity: number;
        }
        severityIdentifier: {
            error: string;
            warning: string;
            information: string;
            hint: string;
        }
    };
}

// const defaultChecker: CodeChecker = {
//     maxNumberOfProblems: 1000,
//     compileCommand: "gcc",
//     compileOptions: ["-fsyntax-only", "-Wall", "-fdiagnostics-parseable-fixits"],
//     includeOptionPrefix: "-I",
//     includePath: {
//         absolute: [],
//         relative: [],
//     },
//     diagDelimiter: "^.+:[0-9]+:[0-9]+:",
//     parse: {
//         encoding: "utf-8",
//         diagInfoPattern: "^(.+):([0-9]+):([0-9]+):\s*(.+):.*",
//         index: {
//             file_name: 1,
//             line_pos: 2,
//             char_pos: 3,
//             severity: 4
//         },
//         severityIdentifier: {
//             error: "error",
//             warning: "warning",
//             information: "information",
//             hint: "hint"
//         },
//     }
// };

class Setting {
    onSavedChecker: CodeChecker[] | undefined;
    onCommandChecker: CodeChecker[] | undefined;
}

// const defaultSettings: Setting = {
//     onSavedChecker: [defaultChecker],
//     onCommandChecker: [defaultChecker]
// }


function getSetting(document: vscode.TextDocument): Setting | undefined {
    let setting = new Setting;

    setting.onSavedChecker = vscode.workspace
        .getConfiguration('mcc', document.uri).get('checkers.onSaved');
    setting.onCommandChecker = vscode.workspace
        .getConfiguration('mcc', document.uri).get('checkers.onCommand');

    return setting;
}

function onSaved(document: vscode.TextDocument) {
    let setting = getSetting(document);

    if (setting) {
        // check by all onSavedChecker
        checkByAll(document, setting.onSavedChecker);
    }
}

function onCommand() {
    if (vscode.window.activeTextEditor) {
        let target = vscode.window.activeTextEditor.document;
        let setting = getSetting(target);

        if (setting) {
            // check by all onCommandChecker
            checkByAll(target, setting.onCommandChecker);
        }
    }
}

function checkByAll(document: vscode.TextDocument, checkers: CodeChecker[] | undefined) {
    if (checkers) {
        checkers.forEach(checker => {
            check(document, checker);
        });
    }
}

function check(document: vscode.TextDocument, checker: CodeChecker) {
    
    // reject except for *.c document
    if(document.languageId !== "c") return;
    
    let includePathOptions = getIncludePathOptions(document, checker);

    let args = checker.compileOptions;

    if (includePathOptions) {
        args = args.concat(includePathOptions);
    }

    args = args.concat([path.basename(document.uri.toString())]);

    child_process.execFile(checker.compileCommand, args, {
        cwd: path.dirname(vscode.Uri.parse(document.uri.toString()).fsPath),
        encoding: "buffer"
    },
        (error, stdout, stderr) => {
            if (error) { }
            if (stdout) { }
            if (stderr) {
                try {
                    parseDiagnosticMessage(iconv.decode(stderr, checker.parse.encoding), document, checker);
                }
                catch (e) {
                    showDiagnosticErrorMessage(e.message);
                }
            }
            else {
                // there is no error
                let diagnostics: vscode.Diagnostic[] = [];
                _diag.set(document.uri, diagnostics);
            }
        });
}

function getIncludePathOptions(document: vscode.TextDocument, settings: CodeChecker) {
    let includeOptions = [""];

    if (settings.includePath.absolute != null && settings.includePath.absolute.length > 0) {
        includeOptions = settings.includePath.absolute.map<string>((value) => {
            return settings.includeOptionPrefix + value
        });
    }

    if (settings.includePath.relative != null && settings.includePath.relative.length > 0) {
        let workPath = getWorkSpaceUri(document);
        if (workPath) {
            if (includeOptions && includeOptions !== [""]) {
                // includeOptions.concat(settings.includePath.relative.map<string>((value) => {
                //     return settings.includeOptionPrefix + path.join(workPath!.fsPath, value);
                // }));
                includeOptions = settings.includePath.relative.map<string>((value) => {
                    return settings.includeOptionPrefix + path.join(workPath!.fsPath, value);
                });
            }
            else {
                includeOptions = settings.includePath.relative.map<string>((value) => {
                    return settings.includeOptionPrefix + path.join(workPath!.fsPath, value);
                });
            }
        }
    }

    return includeOptions;
}

function getWorkSpaceUri(document: vscode.TextDocument) {
    let workspace = vscode.workspace.getWorkspaceFolder(document.uri);

    if (workspace)
        return workspace.uri;
    else
        return undefined;
}

async function parseDiagnosticMessage(message: string, textDocument: vscode.TextDocument, checker: CodeChecker) {
    let pattern = new RegExp("(?=" + checker.diagDelimiter + ")", "m");

    let errors = message.split(pattern);
    let lines = textDocument.getText().split(/\r\n|\r|\n/);

    let diagnostics: vscode.Diagnostic[] = [];

    errors.forEach(error => {
        let pattern = new RegExp(checker.parse.diagInfoPattern, "m");
        let match = pattern.exec(error);

        let basename = path.basename(textDocument.uri.toString());

        console.log(basename);

        if (match) {
            if (path.basename(textDocument.uri.toString()) === match[checker.parse.index.file_name]) {
                let range = new vscode.Range(
                    parseInt(match[checker.parse.index.line_pos], 10) - 1,
                    0,
                    parseInt(match[checker.parse.index.line_pos], 10) - 1,
                    lines[parseInt(match[checker.parse.index.line_pos], 10) - 1].length);

                let diagnosic: vscode.Diagnostic = {
                    severity: detectSeverity(match[checker.parse.index.severity], checker),
                    range: range,
                    message: error,
                    source: checker.compileCommand
                };
                diagnostics.push(diagnosic);
            }
        }
    });

    // Apply result of checking.
    _diag.set(textDocument.uri, diagnostics);
}

function detectSeverity(text: string, setting: CodeChecker) {
    if (text.includes(setting.parse.severityIdentifier.error)) {
        return vscode.DiagnosticSeverity.Error;
    }

    if (text.includes(setting.parse.severityIdentifier.warning)) {
        return vscode.DiagnosticSeverity.Warning;
    }

    if (text.includes(setting.parse.severityIdentifier.information)) {
        return vscode.DiagnosticSeverity.Information;
    }

    if (text.includes(setting.parse.severityIdentifier.hint)) {
        return vscode.DiagnosticSeverity.Hint;
    }

    return vscode.DiagnosticSeverity.Error;
}

function showDiagnosticErrorMessage(message: string) {
    vscode.window.showErrorMessage("Diagnostic Error: " + message);
}