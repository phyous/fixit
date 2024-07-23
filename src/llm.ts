import * as vscode from 'vscode';
import OpenAI from 'openai';

export class LlmClient {
    private client: OpenAI | null;

    constructor() {
        this.client = null;
        this.initialize();
    }

    public initialized(): boolean {
        return this.client !== null;
    }

    public initialize() {
        const manifest = require('../package.json');
        const appName = manifest.name;
        const config = vscode.workspace.getConfiguration(appName);
        console.log('appName:', appName);
    
        const apiKey = config.get<string>('apiKey');
    
        if (!apiKey) {
            vscode.window.showErrorMessage('OpenAI API Key is not set. Please set it in the extension settings.');
            return;
        }
    
        this.client = new OpenAI({ apiKey });
    }
    
    public getFixRecommendation(stackTrace: string, relevantCode: string): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
        if (!this.client) {
            return Promise.reject(new Error('OpenAI client is not initialized. Please check your API key in the settings.'));
        }

        console.log('Entering getFixRecommendation function');
        const prompt = `Given the following stack trace and relevant code, suggest a fix for the error:\n\nStack Trace:\n${stackTrace}\n\nRelevant Code:\n${relevantCode}`;

        console.log('Sending request to OpenAI API');
        return this.client.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            stream: true,
        });
    }
}