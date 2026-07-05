"use client";

import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  language: string;
  theme: "vs-dark" | "light";
  fontSize: number;
}

export default function CodeEditor({
  code,
  onChange,
  language,
  theme,
  fontSize,
}: CodeEditorProps) {
  // Monaco expects specific identifiers for languages:
  // python -> python, javascript -> javascript, java -> java, cpp -> cpp
  const monacoLanguage = language === "cpp" ? "cpp" : language;

  return (
    <Editor
      height="100%"
      language={monacoLanguage}
      theme={theme}
      value={code}
      onChange={onChange}
      loading={
        <div className="flex flex-col items-center justify-center h-full bg-[#1e1e1e] text-gray-400 gap-2">
          <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Mounting Monaco Workspace...</span>
        </div>
      }
      options={{
        fontSize: fontSize,
        fontFamily: "var(--font-geist-mono), Courier New, monospace",
        minimap: { enabled: false },
        lineNumbers: "on",
        automaticLayout: true,
        wordWrap: "on",
        tabSize: 4,
        scrollBeyondLastLine: false,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        padding: { top: 12, bottom: 12 },
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
      }}
    />
  );
}