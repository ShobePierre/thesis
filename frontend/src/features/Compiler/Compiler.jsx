import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Editor, { useMonaco } from "@monaco-editor/react";
import Header from "../../web_components/Header";
import Sidebar from "../../pages/student/Sidebar";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import "./Compiler.css";

function Compiler() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [language, setLanguage] = useState("python3");
  const [code, setCode] = useState("print('Hello, World!')");
  const [theme, setTheme] = useState("vs-dark");
  const monaco = useMonaco();

  const terminalRef = useRef(null);
  const termInstance = useRef(null);
  const wsRef = useRef(null);
  const sessionActiveRef = useRef(false);
  const fitAddonRef = useRef(null);
  const inputBufferRef = useRef('');
  const currentSessionIdRef = useRef(null);

  // Setup intellisense and completion providers
  useEffect(() => {
    if (!monaco) return;

    // Register custom completion providers for each language
    const pythonCompletions = ['print', 'def', 'class', 'import', 'from', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'finally', 'with', 'return', 'yield', 'lambda', 'pass', 'break', 'continue', 'len', 'range', 'enumerate', 'zip', 'map', 'filter', 'sum', 'min', 'max', 'sorted', 'reversed', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple'];
    
    const cppCompletions = ['#include', 'using', 'namespace', 'std', 'cout', 'cin', 'int', 'void', 'double', 'float', 'char', 'string', 'vector', 'map', 'set', 'class', 'struct', 'public', 'private', 'protected', 'virtual', 'override', 'const', 'static', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'throw'];
    
    const cCompletions = ['#include', 'stdio.h', 'stdlib.h', 'string.h', 'math.h', 'int', 'void', 'double', 'float', 'char', 'unsigned', 'signed', 'struct', 'typedef', 'enum', 'union', 'static', 'extern', 'const', 'volatile', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'malloc', 'free', 'printf', 'scanf'];
    
    const javaCompletions = ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'new', 'static', 'final', 'abstract', 'synchronized', 'volatile', 'transient', 'native', 'strictfp', 'void', 'int', 'double', 'float', 'boolean', 'char', 'long', 'short', 'byte', 'String', 'System', 'println', 'print', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'try', 'catch', 'finally', 'throw', 'throws', 'import', 'package', 'super', 'this'];

    const completionProviders = {
      python: pythonCompletions,
      cpp: cppCompletions,
      c: cCompletions,
      java: javaCompletions,
    };

    const disposables = [];

    Object.entries(completionProviders).forEach(([lang, completions]) => {
      const provider = monaco.languages.registerCompletionItemProvider(lang, {
        provideCompletionItems: (model, position) => {
          const textUntilPosition = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          const match = textUntilPosition.match(/\b\w*$/);
          const word = match ? match[0] : '';

          return {
            suggestions: completions
              .filter(c => c.startsWith(word))
              .map(c => ({
                label: c,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: c,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column - word.length,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                },
              })),
          };
        },
      });
      disposables.push(provider);
    });

    return () => {
      disposables.forEach(d => d.dispose());
    };
  }, [monaco]);

  const getDefaultCode = (lang) => {
    const templates = {
      python3: "print('Hello, World!')",
      c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
      cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
      java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
    };
    return templates[lang] || templates.python3;
  };

  const initTerminal = () => {
    if (!terminalRef.current) return;

    if (termInstance.current) termInstance.current.dispose();
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) wsRef.current.close();

    termInstance.current = new Terminal({
      cols: 100,
      rows: 30,
      cursorBlink: true,
      theme: { background: "#1D252A", foreground: "#ffffff" },
      scrollback: 1000,
      fontSize: 13,
      allowTransparency: true,
      fontFamily: 'Courier New, monospace',
    });

    fitAddonRef.current = new FitAddon();
    termInstance.current.loadAddon(fitAddonRef.current);

    termInstance.current.open(terminalRef.current);

    try {
      fitAddonRef.current.fit();
    } catch (e) {
      console.warn('Terminal fit error:', e);
    }

    termInstance.current.focus();

    wsRef.current = new WebSocket("ws://localhost:5001");

    wsRef.current.onopen = () => {
      console.log("✓ Connected to compiler server");
      termInstance.current.write("\r\n\x1b[32m▶ Output will be shown here...\x1b[0m\r\n");
    };

    wsRef.current.onmessage = (event) => {
      if (!termInstance.current) return;

      let data = event.data;
      data = data.replace(/\r?\n/g, '\r\n');
      termInstance.current.write(data);

      if (event.data.includes('[Session') && event.data.includes('started')) {
        sessionActiveRef.current = true;
        console.log('✓ Session active - input enabled');
      }

      if (event.data.includes('[Container stopped]') || event.data.includes('[Session ended]')) {
        sessionActiveRef.current = false;
        console.log('✗ Session ended - input disabled');
      }
    };

    wsRef.current.onerror = (err) => {
      console.error("WebSocket error:", err);
      if (termInstance.current) {
        termInstance.current.write(`\r\n\x1b[31m✗ Connection error\x1b[0m\r\n`);
      }
    };

    wsRef.current.onclose = () => {
      console.log("Connection closed");
      sessionActiveRef.current = false;
    };

    termInstance.current.onData((data) => {
      const charCode = data.charCodeAt(0);
      console.log(`Key pressed: "${data}" (charCode: ${charCode})`);

      // Ctrl+C
      if (data === '\x03') {
        if (sessionActiveRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          console.log('Sending Ctrl+C');
          wsRef.current.send(JSON.stringify({ type: 'interrupt' }));
        }
        return;
      }

      // Ctrl+D
      if (data === '\x04') {
        if (sessionActiveRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          console.log('Sending Ctrl+D (EOF)');
          wsRef.current.send(JSON.stringify({ type: 'eof' }));
        }
        return;
      }

      if (!sessionActiveRef.current || wsRef.current?.readyState !== WebSocket.OPEN) {
        console.warn('⚠ Input ignored: session not active or WS closed');
        return;
      }

      if (data === '\r') {
        termInstance.current.write('\r\n');
        wsRef.current.send(inputBufferRef.current + '\n');
        console.log(`✓ Sent complete line: "${inputBufferRef.current}"`);
        inputBufferRef.current = '';
        return;
      }

      if (data === '\u007F') {
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          termInstance.current.write('\b \b');
          console.log(`✓ Backspace - buffer now: "${inputBufferRef.current}"`);
        }
        return;
      }

      if (charCode >= 32 || data === '\t') {
        inputBufferRef.current += data;
        termInstance.current.write(data);
        return;
      }
    });

    const handleResize = () => {
      if (fitAddonRef.current && termInstance.current) {
        try {
          fitAddonRef.current.fit();
          const { cols, rows } = termInstance.current;

          if (sessionActiveRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }));
          }
        } catch (e) {
          console.warn('Resize error:', e);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");

    document.body.style.backgroundColor = "#f3f4f6";
    const timer = setTimeout(() => initTerminal(), 0);

    return () => {
      clearTimeout(timer);
      if (wsRef.current) wsRef.current.close();
      if (termInstance.current) termInstance.current.dispose();
      document.body.style.backgroundColor = "";
    };
  }, [navigate]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const defaultCode = getDefaultCode(newLang);
    if (!code.trim() || code.trim() === getDefaultCode(language)) {
      setCode(defaultCode);
    }
  };

  const runCode = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      if (termInstance.current) {
        termInstance.current.write("\r\n\x1b[31m✗ WebSocket not connected\x1b[0m\r\n");
      }
      return;
    }

    sessionActiveRef.current = false;
    inputBufferRef.current = '';
    currentSessionIdRef.current = null;

    if (termInstance.current) {
      termInstance.current.clear();
      termInstance.current.write("\x1b[36m⏳ Starting new session...\x1b[0m\r\n");
    }

    console.log('Starting new session...');
    wsRef.current.send(JSON.stringify({
      type: "start",
      language,
      code
    }));
  };

  const clearTerminal = () => {
    if (termInstance.current) {
      termInstance.current.clear();
      console.log('Terminal cleared');
    }
  };

  return (
    <div className="compiler-container">
      {/* Animated background blobs */}
      <div className="compiler-bg-blob compiler-blob-1" />
      <div className="compiler-bg-blob compiler-blob-2" />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="compiler-content">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <div className="compiler-toolbar">
          <div className="toolbar-left">
            <select
              value={language}
              onChange={handleLanguageChange}
              className="compiler-select"
              title="Select programming language"
            >
              <option value="python3">🐍 Python</option>
              <option value="c">📘 C</option>
              <option value="cpp">⚡ C++</option>
              <option value="java">☕ Java</option>
            </select>

            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="compiler-select"
              title="Select editor theme"
            >
              <option value="vs-dark">🌙 Dark Theme</option>
              <option value="light">☀️ Light Theme</option>
            </select>
          </div>

          <div className="toolbar-right">
            <button
              onClick={runCode}
              className="compiler-btn btn-run"
              title="Run code (Ctrl+Enter)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <span>Run</span>
            </button>
            <button
              onClick={clearTerminal}
              className="compiler-btn btn-clear"
              title="Clear terminal output"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m3 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6h14z"/>
              </svg>
              <span>Clear</span>
            </button>
            <button
              onClick={() => navigate(-1)}
              className="compiler-btn btn-close"
              title="Close compiler"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              <span>Close</span>
            </button>
          </div>
        </div>

        <div className="compiler-workspace">
          <div className="editor-panel">
            <div className="editor-header">
              <div className="editor-title">
                <svg className="editor-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <span>Code Editor</span>
              </div>
              <div className="status-badge status-idle">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                  <circle cx="4" cy="4" r="4"/>
                </svg>
                <span>Ready</span>
              </div>
            </div>
            <div className="editor-content">
              <Editor
                height="100%"
                language={language === "python3" ? "python" : language}
                theme={theme}
                value={code}
                onChange={(val) => setCode(val || "")}
                options={{
                fontSize: 16,
                minimap: { enabled: false },
                automaticLayout: true,
                smoothScrolling: true,
                // Intellisense & Autocompletion
                quickSuggestions: {
                  other: true,
                  comments: false,
                  strings: false,
                },
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnCommitCharacter: true,
                acceptSuggestionOnEnter: "on",
                // Auto-formatting & Bracket handling
                autoClosingBrackets: "always",
                autoClosingQuotes: "always",
                autoClosingOvertype: "always",
                autoSurround: "languageDefined",
                formatOnType: true,
                formatOnPaste: true,
                // Code navigation
                inlayHints: {
                  enabled: true,
                },
                // Suggestions configuration
                suggest: {
                  preview: true,
                  showIcons: true,
                  maxVisibleSuggestions: 12,
                  filterGraceful: true,
                  showStatusBar: true,
                },
                // Additional features
                wordBasedSuggestions: "on",
                parameterHints: {
                  enabled: true,
                  cycle: true,
                },
              }}
              />
            </div>
          </div>

          <div className="terminal-panel">
            <div className="terminal-header">
              <div className="terminal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="4 17 10 11 4 5"/>
                  <line x1="12" y1="19" x2="20" y2="19"/>
                </svg>
                <span>Terminal Output</span>
              </div>
              <div className="terminal-dots">
                <div className="terminal-dot dot-red"></div>
                <div className="terminal-dot dot-yellow"></div>
                <div className="terminal-dot dot-green"></div>
              </div>
            </div>
            <div className="terminal-content">
              <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Compiler;
