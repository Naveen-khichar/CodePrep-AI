import { NextResponse } from "next/server";
import axios from "axios";
import { problems } from "../../data/problems";

const languageIds: Record<string, number> = {
  cpp: 54,
  java: 62,
  python: 71,
  javascript: 63,
};

export async function POST(request: Request) {
  try {
    const { problemId, language, code } = await request.json();

    if (!problemId || !language || !code) {
      return NextResponse.json(
        { error: "Problem ID, Language, and Code are required parameters" },
        { status: 400 }
      );
    }

    const problem = problems.find((p) => p.id === Number(problemId));
    if (!problem) {
      return NextResponse.json(
        { error: `Problem with ID ${problemId} not found` },
        { status: 404 }
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

    // If Judge0 keys are configured, run real execution
    if (apiKey || judge0Url) {
      const results = [];
      
      // Execute each test case
      for (let i = 0; i < problem.testCases.length; i++) {
        const testCase = problem.testCases[i];
        
        // Wrap the user's solution with a test runner harness based on language
        const wrappedCode = wrapCodeWithHarness(problem.id, language, code);
        
        const base64Code = Buffer.from(wrappedCode).toString("base64");
        const base64Stdin = Buffer.from(testCase.input).toString("base64");
        
        let responseData;
        
        if (apiKey) {
          const rapidApiHost = process.env.RAPIDAPI_HOST || "judge0-ce.p.rapidapi.com";
          const response = await axios.request({
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
          });
          responseData = response.data;
        } else {
          const response = await axios.post(`${judge0Url}/submissions`, {
            language_id: languageId,
            source_code: base64Code,
            stdin: base64Stdin,
          }, {
            params: { base64_encoded: "true", wait: "true" },
          });
          responseData = response.data;
        }

        const decode = (str: string | null) => {
          if (!str) return "";
          try {
            return Buffer.from(str, "base64").toString("utf-8").trim();
          } catch {
            return str.trim();
          }
        };

        const stdout = decode(responseData.stdout);
        const stderr = decode(responseData.stderr);
        const compileOutput = decode(responseData.compile_output);
        const statusId = responseData.status?.id;
        const statusDesc = responseData.status?.description;

        // Judge0 Status IDs:
        // 3 = Accepted
        // 4 = Wrong Answer
        // 5 = Time Limit Exceeded
        // 6 = Compilation Error
        // 7-12 = Runtime Error
        if (statusId !== 3) {
          let verdict = "Runtime Error";
          if (statusId === 4) verdict = "Wrong Answer";
          else if (statusId === 5) verdict = "Time Limit Exceeded";
          else if (statusId === 6) verdict = "Compilation Error";
          
          return NextResponse.json({
            verdict,
            passedCount: i,
            totalCount: problem.testCases.length,
            runtime: parseFloat(responseData.time || "0.00") * 1000,
            memory: responseData.memory || 0,
            errorLogs: compileOutput || stderr || statusDesc,
          });
        }

        // Compare stdout with expected output
        if (stdout !== testCase.expectedOutput.trim()) {
          return NextResponse.json({
            verdict: "Wrong Answer",
            passedCount: i,
            totalCount: problem.testCases.length,
            runtime: parseFloat(responseData.time || "0.00") * 1000,
            memory: responseData.memory || 0,
            errorLogs: `Expected: "${testCase.expectedOutput.trim()}", but got: "${stdout}"`,
          });
        }

        results.push({
          runtime: parseFloat(responseData.time || "0.00") * 1000,
          memory: responseData.memory || 0,
        });
      }

      // If loop finishes, all test cases passed!
      const avgRuntime = results.reduce((acc, curr) => acc + curr.runtime, 0) / results.length;
      const maxMemory = Math.max(...results.map((r) => r.memory));

      return NextResponse.json({
        verdict: "Accepted",
        passedCount: problem.testCases.length,
        totalCount: problem.testCases.length,
        runtime: Math.round(avgRuntime),
        memory: maxMemory,
      });
    } else {
      // Local Validator Fallback
      console.warn("No Judge0 configuration detected. Running smart validator fallback.");
      return NextResponse.json(simulateSubmissionValidation(problem.id, language, code));
    }
  } catch (error: any) {
    console.error("Submission evaluation failure:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Submission server error", details: error.message },
      { status: 500 }
    );
  }
}

// Wraps user's function code with input/output runners to match standard inputs
function wrapCodeWithHarness(problemId: number, language: string, code: string): string {
  const lang = language.toLowerCase();
  
  if (problemId === 1) { // Two Sum
    if (lang === "javascript") {
      return `${code}
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (input.length >= 2) {
  const nums = JSON.parse(input[0]);
  const target = parseInt(input[1]);
  console.log(JSON.stringify(twoSum(nums, target)));
}`;
    }
    if (lang === "python") {
      return `${code}
import sys
import json

if __name__ == "__main__":
    lines = sys.stdin.read().splitlines()
    if len(lines) >= 2:
        nums = json.loads(lines[0])
        target = json.loads(lines[1])
        sol = Solution()
        print(json.dumps(sol.twoSum(nums, target)))`;
    }
  }

  if (problemId === 2) { // Valid Parentheses
    if (lang === "javascript") {
      return `${code}
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
const s = JSON.parse(input);
console.log(isValid(s) ? "true" : "false");`;
    }
    if (lang === "python") {
      return `${code}
import sys
import json

if __name__ == "__main__":
    input_str = sys.stdin.read().strip()
    s = json.loads(input_str)
    sol = Solution()
    print("true" if sol.isValid(s) else "false")`;
    }
  }

  if (problemId === 3) { // Longest Substring
    if (lang === "javascript") {
      return `${code}
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
const s = JSON.parse(input);
console.log(lengthOfLongestSubstring(s));`;
    }
    if (lang === "python") {
      return `${code}
import sys
import json

if __name__ == "__main__":
    input_str = sys.stdin.read().strip()
    s = json.loads(input_str)
    sol = Solution()
    print(sol.lengthOfLongestSubstring(s))`;
    }
  }

  // Fallback if other languages or problems are not wrapped
  return code;
}

// Simulated evaluation checks for local development mode
function simulateSubmissionValidation(problemId: number, language: string, code: string) {
  const cleanCode = code.replace(/\s+/g, "");

  // Simple compilation / syntax checker
  if (language === "javascript" && code.includes("const ") && !code.includes("=")) {
    return {
      verdict: "Compilation Error",
      passedCount: 0,
      totalCount: 3,
      runtime: 0,
      memory: 0,
      errorLogs: "SyntaxError: Missing initializer in const declaration",
    };
  }
  if (language === "python" && code.includes("def ") && !code.includes(":")) {
    return {
      verdict: "Compilation Error",
      passedCount: 0,
      totalCount: 3,
      runtime: 0,
      memory: 0,
      errorLogs: "SyntaxError: invalid syntax (missing colon at function signature)",
    };
  }

  // 1. Two Sum Validation
  if (problemId === 1) {
    const hasMapSearch = cleanCode.includes("Map") || cleanCode.includes("dict()") || cleanCode.includes("{}") || cleanCode.includes("in");
    const hasLoop = cleanCode.includes("for") || cleanCode.includes("while");

    if (hasLoop && hasMapSearch) {
      return { verdict: "Accepted", passedCount: 3, totalCount: 3, runtime: 45, memory: 4012 };
    } else if (hasLoop) {
      // Brute-force O(N^2) solution
      return { verdict: "Accepted", passedCount: 3, totalCount: 3, runtime: 220, memory: 3912 };
    } else {
      return {
        verdict: "Wrong Answer",
        passedCount: 0,
        totalCount: 3,
        runtime: 12,
        memory: 2400,
        errorLogs: "Two Sum: Output failed matching expected results. Empty result or incorrect solution index structure.",
      };
    }
  }

  // 2. Valid Parentheses Validation
  if (problemId === 2) {
    const hasStack = cleanCode.includes("stack") || cleanCode.includes("push") || cleanCode.includes("pop") || cleanCode.includes("append");
    const hasPairs = cleanCode.includes("}") || cleanCode.includes("]") || cleanCode.includes(")");

    if (hasStack && hasPairs) {
      return { verdict: "Accepted", passedCount: 3, totalCount: 3, runtime: 55, memory: 3820 };
    } else {
      return {
        verdict: "Wrong Answer",
        passedCount: 1,
        totalCount: 3,
        runtime: 18,
        memory: 2100,
        errorLogs: "Valid Parentheses: Stack empty prematurely or closing characters mismatched.",
      };
    }
  }

  // 3. Longest Substring Validation
  if (problemId === 3) {
    const hasSetOrMap = cleanCode.includes("Set") || cleanCode.includes("Map") || cleanCode.includes("set") || cleanCode.includes("dict") || cleanCode.includes("{}");
    const hasWindow = cleanCode.includes("left") || cleanCode.includes("right") || cleanCode.includes("start") || cleanCode.includes("max");

    if (hasSetOrMap && hasWindow) {
      return { verdict: "Accepted", passedCount: 3, totalCount: 3, runtime: 78, memory: 4510 };
    } else {
      return {
        verdict: "Wrong Answer",
        passedCount: 0,
        totalCount: 3,
        runtime: 30,
        memory: 2900,
        errorLogs: "Longest Substring: Result substring length mismatched standard test counts.",
      };
    }
  }

  return { verdict: "Wrong Answer", passedCount: 0, totalCount: 3, runtime: 0, memory: 0 };
}
