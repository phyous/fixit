import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import { OpenAI } from 'openai';
import { LlmClient } from './llm';

export function activate(context: vscode.ExtensionContext) {
    console.log('Entering activate function');
    try {
        console.log('Starting extension activation...');
        
        let llmClient = new LlmClient();

        // Add listener for configuration changes
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('fixit.apiKey')) {
                    console.log('API key configuration changed, reinitializing OpenAI client');
                    llmClient.initialize();
                }
            })
        );

        // Register command for editor
        let editorCommand = vscode.commands.registerCommand('extension.analyzeStackTrace', async () => {
            console.log('Command extension.analyzeStackTrace triggered from editor');
            await handleStackTraceAnalysis(llmClient);
        });

        // Register command for terminal
        let terminalCommand = vscode.commands.registerCommand('extension.analyzeStackTraceFromTerminal', async () => {
            console.log('Command extension.analyzeStackTraceFromTerminal triggered from terminal');
            try {
                const stackTrace = await vscode.env.clipboard.readText();
                if (stackTrace.trim()) {
                    await analyzeStackTrace(llmClient, stackTrace);
                } else {
                    vscode.window.showErrorMessage('No text found in clipboard. Please highlight and copy the stack trace first.');
                }
            } catch (error) {
                vscode.window.showErrorMessage('Failed to read clipboard: ' + error);
            }
        });

        context.subscriptions.push(editorCommand, terminalCommand);
        console.log('Extension activation completed.');
    } catch (error) {
        handleError(error, 'Error during extension activation');
    }
    console.log('Exiting activate function');
}

async function handleStackTraceAnalysis(llmClient: LlmClient) {
    try {
        console.log('Activating extension...');
        console.log('Current active editor:', vscode.window.activeTextEditor ? 'exists' : 'does not exist');
        await waitForActiveTextEditor();
        console.log('Active text editor found.');

        const editor = vscode.window.activeTextEditor;
        if (editor) {
            console.log('Extracting relevant code...');
            const selection = editor.selection;
            console.log('Selection:', selection);
            const highlightedText = editor.document.getText(selection);
            console.log('Highlighted text length:', highlightedText.length);
            console.log('Analyzing stack trace...');
            if (llmClient) {
                await analyzeStackTrace(llmClient, highlightedText);
                console.log('Fix recommendation generated.');
            } else {
                vscode.window.showErrorMessage('OpenAI client is not initialized. Please check your API key in the settings.');
                console.log('OpenAI client not initialized, cannot analyze stack trace.');
            }
        } else {
            console.log('No active text editor found after waiting.');
            vscode.window.showErrorMessage('No active text editor found.');
        }
    } catch (error) {
        handleError(error, 'Error in analyzeStackTrace command');
    }
}

function handleError(error: unknown, contextMessage: string): void {
    console.error('Entering handleError function');
    console.error(contextMessage, error);
    let errorMessage = 'An unexpected error occurred.';

    if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Stack trace:', error.stack);
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    console.error('Showing error message to user');
    vscode.window.showErrorMessage(`${contextMessage}: ${errorMessage}`);
    console.error('Exiting handleError function');
}

async function waitForActiveTextEditor(): Promise<vscode.TextEditor | undefined> {
    console.log('Entering waitForActiveTextEditor function');
    if (vscode.window.activeTextEditor) {
        console.log('Active text editor already exists');
        return vscode.window.activeTextEditor;
    }

    console.log('Waiting for active text editor...');
    return new Promise((resolve) => {
        const disposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                console.log('Active text editor changed, resolving promise');
                disposable.dispose();
                resolve(editor);
            }
        });
    });
}

async function analyzeStackTrace(llmClient: LlmClient, stackTrace: string) {
    console.log('Entering analyzeStackTrace function');
    try {
        const stackFrames = parseStackTrace(stackTrace);
        console.log('Parsed stack frames:', stackFrames);
        const relevantCode = await extractRelevantCode(stackFrames);
        console.log('Extracted relevant code length:', relevantCode.length);
        const fixRecommendation = await llmClient.getFixRecommendation(stackTrace, relevantCode);
        console.log('Got fix recommendation');
        displayResults(fixRecommendation);
        console.log('Results displayed');
    } catch (error) {
        console.error('Error in analyzeStackTrace:', error);
        vscode.window.showErrorMessage(`Error analyzing stack trace: ${error}`);
    }
    console.log('Exiting analyzeStackTrace function');
}

function parseStackTrace(stackTrace: string): { file: string; line: number; language: string }[] {
    console.log('Parsing stack trace...');
    const lines = stackTrace.split('\n');
    console.log('Number of lines in stack trace:', lines.length);

    return lines
        .map(line => {
            let match;
            let language;

            // TypeScript/JavaScript pattern
            if ((match = line.match(/at .+ \((.+):(\d+):\d+\)/))) {
                language = 'typescript';
            }
            // Python pattern
            else if ((match = line.match(/File "(.+)", line (\d+)/))) {
                language = 'python';
            }
            // Java pattern
            else if ((match = line.match(/at .+\((.+):(\d+)\)/))) {
                language = 'java';
            }
            // Go pattern
            else if ((match = line.match(/(.+):(\d+)/))) {
                language = 'go';
            }
            // SQL pattern (assuming a specific format, may need adjustment)
            else if ((match = line.match(/at line (\d+) in file (.+)/))) {
                language = 'sql';
                // Swap file and line for consistency with other formats
                [match[1], match[2]] = [match[2], match[1]];
            }
            // C/C++ pattern
            else if ((match = line.match(/(.+):(\d+):/))) {
                language = 'c/c++';
            }
            // C# pattern
            else if ((match = line.match(/at .+ in (.+):line (\d+)/))) {
                language = 'c#';
            }

            if (match) {
                console.log('File:', match[1], 'Line:', match[2], 'Language:', language);
                return { 
                    file: match[1], 
                    line: parseInt(match[2], 10), 
                    language 
                };
            }
            return null;
        })
        .filter((frame): frame is { file: string; line: number; language: string } =>
            frame !== null && !frame.file.includes('node_modules')
        );
}

async function extractRelevantCode(stackFrames: { file: string; line: number }[]): Promise<string> {
    console.log('Entering extractRelevantCode function');
    let relevantCode = '';
    for (const frame of stackFrames) {
        const filePath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
            ? vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, frame.file).fsPath
            : frame.file;

        console.log('Attempting to read file:', filePath);
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const lines = fileContent.split('\n');
            const startLine = Math.max(0, frame.line - 5);
            const endLine = Math.min(lines.length, frame.line + 5);
            relevantCode += `File: ${frame.file}\n`;
            relevantCode += lines.slice(startLine, endLine).join('\n');
            relevantCode += '\n\n';
            console.log(`Read ${endLine - startLine} lines from ${filePath}`);
        } catch (error) {
            console.error(`Error reading file ${filePath}: ${error}`);
        }
    }
    console.log('Exiting extractRelevantCode function');
    return relevantCode;
}

function displayResults(fixRecommendation: string) {
    console.log('Entering displayResults function');
    const outputChannel = vscode.window.createOutputChannel('Stack Trace Analysis');
    outputChannel.clear();
    outputChannel.appendLine('Fix Recommendation:');
    outputChannel.appendLine(fixRecommendation);
    outputChannel.show();
    console.log('Results displayed in output channel');
}

export function deactivate() {
    console.log('Extension deactivated');
}