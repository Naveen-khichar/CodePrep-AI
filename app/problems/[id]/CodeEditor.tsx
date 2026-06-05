"use client";

import Editor from "@monaco-editor/react";

export default function CodeEditor() {
  return (
    <div className="mt-6">
      <Editor
        height="500px"
        defaultLanguage="javascript"
        defaultValue="// Write code here"
      />
    </div>
  );
}