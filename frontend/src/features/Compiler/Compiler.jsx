import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Editor, { useMonaco } from "@monaco-editor/react";
import Header from "../../web_components/Header";
import Sidebar from "../../pages/student/Sidebar";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

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
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col bg-gray-100">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-300 shadow-sm sticky top-0 z-10 mt-25">
          <div className="flex items-center gap-4">
            <select
              value={language}
              onChange={handleLanguageChange}
              className="bg-white border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm cursor-pointer hover:border-blue-500 transition"
            >
              <option value="python3">Python</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>

            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm cursor-pointer hover:border-blue-500 transition"
            >
              <option value="vs-dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={runCode}
              className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition shadow-md font-medium"
            >
              ▶ Run
            </button>
            <button
              onClick={clearTerminal}
              className="bg-gray-600 text-white px-5 py-2 rounded-lg hover:bg-gray-700 transition shadow-md font-medium"
            >
              🗑 Clear
            </button>
            <button
              onClick={() => navigate(-1)}
              className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition shadow-md font-medium"
            >
              ✕ Close
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/2 h-full border-r border-gray-300">
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

          <div className="w-1/2 h-full p-2 bg-black flex flex-col">
            <div ref={terminalRef} className="flex-1 rounded bg-gray-900 p-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Compiler;
