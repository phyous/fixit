# FixIt - Stack Trace Analysis for VSCode

FixIt is a Visual Studio Code extension that helps developers quickly analyze and fix errors by providing intelligent recommendations based on stack traces.

## Features

- Automatically analyze stack traces from various programming languages
- Extract relevant code snippets from your project files
- Generate fix recommendations using AI-powered analysis
- Display results in a dedicated output channel for easy viewing

## Requirements

- Visual Studio Code version 1.91.0 or higher
- An OpenAI API key (to be configured in the extension settings)

## Installation

1. Install the FixIt extension from the Visual Studio Code Marketplace
2. Restart Visual Studio Code
3. Configure your OpenAI API key in the extension settings

## Usage

1. Highlight a stack trace from a test failure/error in your terminal
2. Right-click and choose "Analyze Stack Trace" from the context menu (or use the command palette)
3. View the analysis results and fix recommendations in the "Stack Trace Analysis" output channel

## Extension Settings

This extension contributes the following settings:

* `fixit.apiKey`: Your OpenAI API key for FixIt to use for analysis

## Known Issues

- Currently, the extension may have difficulty parsing stack traces from less common programming languages or non-standard formats
- Large projects with many files may experience slower performance during code extraction

## Release Notes

### 1.0.0

Initial release of FixIt:
- Support for analyzing stack traces from multiple languages including TypeScript, JavaScript, Python, Java, Go, SQL, C/C++, and C#
- AI-powered fix recommendations
- Relevant code extraction from project files
- Customizable OpenAI API key setting
---

## Contributing

If you'd like to contribute to FixIt, please feel free to submit pull requests or open issues on our [GitHub repository](https://github.com/phyous/fixit).

## License

This extension is licensed under the [MIT License](LICENSE.md).

**Enjoy using FixIt to streamline your debugging process!**
