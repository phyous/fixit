export function getWebviewContent(markdown: string) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Stack Trace Analysis</title>
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github.min.css" id="light-theme-highlight">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github-dark.min.css" id="dark-theme-highlight">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
                line-height: 1.6;
                color: var(--vscode-editor-foreground);
                background-color: var(--vscode-editor-background);
                margin: 0;
                padding: 20px;
                font-size: 12px;
            }
            .markdown-body {
                box-sizing: border-box;
                min-width: 200px;
                max-width: 980px;
                margin: 0 auto;
                padding: 45px;
                font-size: 12px;
            }
            @media (max-width: 767px) {
                .markdown-body {
                    padding: 15px;
                }
            }
            pre code.hljs {
                display: block;
                overflow-x: auto;
                padding: 1em;
                font-size: 11px;
            }
            code.hljs {
                padding: 3px 5px;
                font-size: 11px;
            }
            /* Adjust heading sizes */
            .markdown-body h1 { font-size: 1.8em; }
            .markdown-body h2 { font-size: 1.6em; }
            .markdown-body h3 { font-size: 1.4em; }
            .markdown-body h4 { font-size: 1.2em; }
            .markdown-body h5 { font-size: 1em; }
            .markdown-body h6 { font-size: 0.9em; }
        </style>
    </head>
    <body class="markdown-body">
        <div id="content" class="markdown-body"></div>
        <script>
            const vscode = acquireVsCodeApi();
            const content = document.getElementById('content');

            const languageAliases = {
                'py': 'python',
                'js': 'javascript',
                'ts': 'typescript',
                'cpp': 'c++',
                'cxx': 'c++',
                'h': 'c',
                'hpp': 'c++',
                'kt': 'kotlin',
                'rb': 'ruby',
                'rs': 'rust',
                'sh': 'bash',
                'yml': 'yaml'
            };

            marked.setOptions({
                highlight: function(code, lang) {
                    lang = lang ? lang.toLowerCase() : '';
                    lang = languageAliases[lang] || lang;

                    if (hljs.getLanguage(lang)) {
                        return hljs.highlight(code, { language: lang }).value;
                    }

                    return hljs.highlightAuto(code).value;
                },
                langPrefix: 'hljs language-'
            });

            function renderContent(markdown) {
                content.innerHTML = marked.parse(markdown);
                hljs.highlightAll();
            }

            renderContent(${JSON.stringify(markdown)});

            // Listen for messages from the extension
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'update':
                        renderContent(message.content);
                        break;
                }
            });

            function updateTheme(theme) {
                document.getElementById('light-theme-highlight').disabled = theme !== 'light';
                document.getElementById('dark-theme-highlight').disabled = theme !== 'dark';
            }

            // Initial theme setting
            updateTheme(document.body.classList.contains('vscode-light') ? 'light' : 'dark');

            // Handle color theme changes
            window.addEventListener('vscode.colorTheme', () => {
                const newTheme = document.body.classList.contains('vscode-light') ? 'light' : 'dark';
                updateTheme(newTheme);
                document.body.className = document.body.className.replace(/vscode-(dark|light)/, '');
                document.body.classList.add(newTheme === 'light' ? 'vscode-light' : 'vscode-dark');
            });
        </script>
    </body>
    </html>`;
}