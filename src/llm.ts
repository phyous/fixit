import * as vscode from 'vscode';
import { OpenAI } from 'openai';

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
        // Get the extension's name and configuration
        const manifest = require('../package.json');
        const appName = manifest.name;
        const config = vscode.workspace.getConfiguration(appName);
        console.log('appName:', appName);
    
        const apiKey = config.get<string>('apiKey');
    
        if (!apiKey) {
            vscode.window.showErrorMessage('OpenAI API Key is not set. Please set it in the extension settings.');
            return null;
        }
    
        this.client = new OpenAI({ apiKey });
    }
    
    public async getFixRecommendation(stackTrace: string, relevantCode: string): Promise<string> {
        if (!this.client) {
            return 'OpenAI client is not initialized. Please check your API key in the settings.';
        }

        console.log('Entering getFixRecommendation function');
        const prompt = `Given the following stack trace and relevant code, suggest a fix for the error:\n\nStack Trace:\n${stackTrace}\n\nRelevant Code:\n${relevantCode}`;

        try {
            console.log('Sending request to OpenAI API');
            const response = await this.client.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
            });

            console.log('Received response from OpenAI API');
            return response.choices[0].message.content || 'No fix recommendation available.';
        } catch (error) {
            console.error(`Error getting fix recommendation: ${error}`);
            return 'Failed to get fix recommendation.';
        }
    }
}

