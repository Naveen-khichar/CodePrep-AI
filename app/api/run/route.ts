import { NextResponse } from "next/server";
import axios from "axios";

const languageIds: Record<string, number> = {
  cpp: 54,        // C++ (GCC 9.2.0)
  java: 62,       // Java (OpenJDK 13.0.1)
  python: 71,     // Python (3.8.1)
  javascript: 63, // JavaScript (Node.js 12.14.0)
};

export async function POST(request: Request) {
  try {
    const { language, code, stdin } = await request.json();

    if (!language || !code) {
      return NextResponse.json(
        { error: "Language and Code parameters are required" },
        { status: 400 }
      );
    }

    const languageId = languageIds[language.toLowerCase()];
    if (!languageId) {
      return NextResponse.json(
        { error: `Unsupported language: ${language}` },
        { status: 400 }
      );
    }

    const apiKey = process.env.RAPIDAPI_KEY;
    const judge0Url = process.env.JUDGE0_URL;

    // Base64 encoding for safe transport of source code and standard inputs
    const base64Code = Buffer.from(code).toString("base64");
    const base64Stdin = stdin ? Buffer.from(stdin).toString("base64") : "";

    // 1. Check if we have active Judge0 configs
    if (apiKey) {
      const rapidApiHost = process.env.RAPIDAPI_HOST || "judge0-ce.p.rapidapi.com";
      // RapidAPI Code Compiler execution
      const options = {
        method: "POST",
        url: `https://${rapidApiHost}/submissions`,
        params: { base64_encoded: "true", wait: "true" },
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": rapidApiHost,
          "Content-Type": "application/json",
        },
        data: {
          language_id: languageId,
          source_code: base64Code,
          stdin: base64Stdin,
        },
      };

      const response = await axios.request(options);
      return NextResponse.json(parseJudge0Response(response.data));
    } else if (judge0Url) {
      // Self-hosted Judge0 instance
      const response = await axios.post(`${judge0Url}/submissions`, {
        language_id: languageId,
        source_code: base64Code,
        stdin: base64Stdin,
      }, {
        params: { base64_encoded: "true", wait: "true" },
      });
      return NextResponse.json(parseJudge0Response(response.data));
    } else {
      // 2. High-quality Local Mock Fallback (for easy onboarding & demonstration)
      console.warn("No Judge0 configuration detected. Falling back to local compilation mock.");
      return NextResponse.json(simulateLocalExecution(language, code, stdin));
    }
  } catch (error: any) {
    console.error("Judge0 API execution error:", error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: "Execution service error", 
        details: error.response?.data?.message || error.message 
      },
      { status: 500 }
    );
  }
}

// Convert Base64 outputs back to utf-8 strings for the client
function parseJudge0Response(data: any) {
  const decode = (str: string | null) => {
    if (!str) return null;
    try {
      return Buffer.from(str, "base64").toString("utf-8");
    } catch {
      return str;
    }
  };

  return {
    stdout: decode(data.stdout),
    stderr: decode(data.stderr),
    compile_output: decode(data.compile_output),
    status: {
      id: data.status?.id,
      description: data.status?.description,
    },
    time: data.time || "0.00",
    memory: data.memory || "0",
  };
}

// Simulate program compiler returns for quick testing and client validation
function simulateLocalExecution(language: string, code: string, stdin: string) {
  // Check for simple compilation / syntax issues
  if (language === "javascript" && code.includes("const ") && !code.includes("=")) {
    return {
      stdout: null,
      stderr: "SyntaxError: Missing initializer in const declaration",
      compile_output: "Compilation failed: SyntaxError",
      status: { id: 6, description: "Compilation Error" },
      time: "0.01",
      memory: "1024",
    };
  }

  if (language === "python" && code.includes("def ") && !code.includes(":")) {
    return {
      stdout: null,
      stderr: "  File \"main.py\", line 1\n    def solution\n                ^\nSyntaxError: invalid syntax",
      compile_output: "Compilation failed: SyntaxError",
      status: { id: 6, description: "Compilation Error" },
      time: "0.01",
      memory: "1024",
    };
  }

  // Generate dynamic stdout matching target inputs
  let stdout = `[CodePrep Sandbox: ${language.toUpperCase()}]\n`;
  if (stdin) {
    stdout += `Received Standard Input: ${stdin}\n`;
  }
  
  // Try to inspect print statements inside code and output them
  if (language === "javascript") {
    const regex = /console\.log\(([^)]+)\)/g;
    let match;
    let found = false;
    while ((match = regex.exec(code)) !== null) {
      stdout += `${match[1].replace(/['"`]/g, "")}\n`;
      found = true;
    }
    if (!found) stdout += "Code completed with return status: 0";
  } else if (language === "python") {
    const regex = /print\(([^)]+)\)/g;
    let match;
    let found = false;
    while ((match = regex.exec(code)) !== null) {
      stdout += `${match[1].replace(/['"`]/g, "")}\n`;
      found = true;
    }
    if (!found) stdout += "Code completed with return status: 0";
  } else {
    stdout += "Execution finished successfully.";
  }

  return {
    stdout,
    stderr: null,
    compile_output: null,
    status: { id: 3, description: "Accepted" },
    time: "0.04",
    memory: "3480",
  };
}
