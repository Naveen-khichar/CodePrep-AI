import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { action, problemTitle, problemDescription, code, language } = await request.json();

    if (!action || !problemTitle || !code || !language) {
      return NextResponse.json(
        { error: "Action, Problem Title, Code, and Language are required parameters" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("No GEMINI_API_KEY configured. Returning a simulated mentorship feedback.");
      return NextResponse.json({
        response: simulateAiMentorship(action, problemTitle, code, language),
      });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use gemini-2.5-flash for rapid, cost-effective coding analysis
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.2, // low temperature for precise, non-hallucinatory code reviews
      }
    });

    const systemInstruction = `You are an elite Senior Full Stack Engineer, Software Architect, and Socratic Technical Mentor.
Your goal is to guide the user in solving their coding problem.
CRITICAL RULE: Never generate the full copy-pasteable solved solution code. You must guide, hint, explain, and write pseudocode or small line modifications, but do NOT give the entire solution code.
Help the user learn the underlying computer science concepts (time complexity, space complexity, trade-offs).
Format your response using clean, clear Markdown with code blocks where helpful.`;

    const prompts: Record<string, string> = {
      explain: `Problem: "${problemTitle}"
Description:
${problemDescription}

Language: ${language}
Current Code:
\`\`\`${language}
${code}
\`\`\`

Task: Explain how this code works, outline the current logical flow, and identify where the logic succeeds or falls short.`,
      
      hint: `Problem: "${problemTitle}"
Description:
${problemDescription}

Language: ${language}
Current Code:
\`\`\`${language}
${code}
\`\`\`

Task: The candidate is stuck and needs a Socratic hint. Do not give the code solution. Suggest the next data structure choice, mathematical relation, or algorithmic step to take.`,
      
      optimize: `Problem: "${problemTitle}"
Description:
${problemDescription}

Language: ${language}
Current Code:
\`\`\`${language}
${code}
\`\`\`

Task: Review this code for time and space complexities. Suggest a more optimal approach (e.g., hash map lookup instead of nested loops, or bit manipulation) and write the conceptual pseudo-code or algorithm steps for it.`,
      
      complexity: `Problem: "${problemTitle}"
Language: ${language}
Current Code:
\`\`\`${language}
${code}
\`\`\`

Task: Provide a detailed analysis of the Time Complexity and Space Complexity of this code using Big-O notation. Explain why each loop, memory allocation, or recursion contributes to the complexity.`,
      
      bug: `Problem: "${problemTitle}"
Language: ${language}
Current Code:
\`\`\`${language}
${code}
\`\`\`

Task: Scan this code for logical syntax errors, off-by-one errors, infinite loops, memory leaks, or unhandled edge cases (e.g., null arrays, negative integers). Explain where the bug is and how to resolve it conceptually.`,
      
      dryrun: `Problem: "${problemTitle}"
Language: ${language}
Current Code:
\`\`\`${language}
${code}
\`\`\`

Task: Perform a line-by-line dry run of this code using a sample test case. Show the state of variables (pointers, loops, arrays) at each state step to show how the logic executes.`,
    };

    const targetPrompt = prompts[action] || prompts.explain;
    const finalPrompt = `${systemInstruction}\n\nUser Request:\n${targetPrompt}`;

    const result = await model.generateContent(finalPrompt);
    const text = result.response.text();

    return NextResponse.json({ response: text });
  } catch (error: any) {
    console.error("Gemini AI API failure:", error);
    return NextResponse.json(
      { error: "AI Mentor service error", details: error.message },
      { status: 500 }
    );
  }
}

// Fallback simulation generator for local testing
function simulateAiMentorship(action: string, problemTitle: string, code: string, language: string): string {
  const isTwoSum = problemTitle.toLowerCase().includes("two sum");
  
  if (action === "hint") {
    return `### 💡 Socratic Hint:
${isTwoSum 
  ? "Have you considered using a **Hash Map (Dictionary)**? Instead of looping twice to find a pair, you can iterate once. For each element \`x\`, calculate its target complement \`target - x\`. Can you check if this complement is already in your Hash Map in O(1) time? If not, insert the current number and its index."
  : "Think about using a **Stack**. A stack is a Last-In, First-Out (LIFO) structure, which is ideal for matching brackets. When you encounter a starting bracket, push it. When you see a closing bracket, does it match the bracket at the top of your stack?"
}

*Review the next step and write the corresponding block in your Monaco workspace!*`;
  }
  
  if (action === "complexity") {
    const isBruteForce = code.includes("for") && (code.match(/for/g) || []).length >= 2;
    return `### 📊 Complexity Analysis

For your current solution to **${problemTitle}**:

- **Time Complexity:** ${isBruteForce ? "$O(N^2)$" : "$O(N)$"}
  - *Explanation:* ${isBruteForce ? "You have nested loops iterating through the list, meaning for each element you scan the rest of the array." : "You iterate through the inputs in a single pass using a hash collection, leading to linear execution steps."}
- **Space Complexity:** ${isBruteForce ? "$O(1)$" : "$O(N)$"}
  - *Explanation:* ${isBruteForce ? "No additional memory scale structures are allocated." : "A map structure is populated to index elements, growing proportionally to the input size."}`;
  }

  if (action === "optimize") {
    return `### 🚀 Optimization Recommendations

Your solution can be optimized to run in **$O(N)$ time complexity**:

1. **Trade Space for Time:** By storing elements in a dictionary, you search in $O(1)$ instead of $O(N)$.
2. **Pseudo-code Algorithm:**
   \`\`\`text
   Initialize empty map
   For each element and index:
       complement = target - element
       if complement in map:
           return [map[complement], current_index]
       add current_element to map with index
   \`\`\`

*Try refactoring your loops with this dictionary index logic!*`;
  }

  if (action === "bug") {
    const hasTemplate = code.includes("// Write your") || code.includes("pass");
    return `### 🔍 Bug Finder Report

- **Detected Issues:** ${hasTemplate ? "Your editor currently contains starter templates. Write your logic first." : "Your code logic is clean! However, make sure you handle boundary checks (e.g. empty inputs or length less than required)."}
- **Edge Cases to Watch:**
  - Empty or null inputs.
  - Numbers that are negative or target fits overflow parameters.
  - Making sure you don't use the same array index twice.`;
  }

  return `### 🧠 AI Socratic Review - ${problemTitle}

Here is a review of your current **${language}** solution:

- **Algorithmic Structure:** You are using standard iteration statements.
- **Recommendations:** Ensure that you lift variables outside loops where applicable and structure logic to handle empty boundaries.
- **Interview Highlight:** Be prepared to explain the Big-O difference between brute-force search and hashing optimizations to your interviewer.`;
}
