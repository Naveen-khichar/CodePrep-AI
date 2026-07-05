export interface Problem {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  tags: string[];
  companies: string[];
  acceptanceRate: number;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  hints: string[];
  starterTemplates: Record<string, string>;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
}

export const problems: Problem[] = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have **exactly one solution**, and you may not use the *same* element twice.

You can return the answer in any order.`,
    tags: ["Array", "Hash Table"],
    companies: ["Google", "Amazon", "Meta", "Microsoft"],
    acceptanceRate: 49.5,
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
      },
      {
        input: "nums = [3,3], target = 6",
        output: "[0,1]",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    hints: [
      "Try to use a hash map to store the index of each number as you iterate through the list.",
      "For each number, check if its complement (target - number) is already present in the map.",
    ],
    starterTemplates: {
      javascript: `function twoSum(nums, target) {
    // Write your JavaScript solution here
    
};`,
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Write your Python solution here
        pass`,
      cpp: `#include <vector>
#include <unordered_map>

class Solution {
public:
    std::vector<int> twoSum(std::vector<int>& nums, int target) {
        // Write your C++ solution here
        
    }
};`,
      java: `import java.util.HashMap;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your Java solution here
        return new int[]{};
    }
}`,
    },
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", isHidden: false },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]", isHidden: false },
      { input: "[3,3]\n6", expectedOutput: "[0,1]", isHidden: true },
    ],
  },
  {
    id: 2,
    title: "Valid Parentheses",
    difficulty: "Easy",
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    tags: ["String", "Stack"],
    companies: ["Meta", "Microsoft", "Amazon", "Netflix"],
    acceptanceRate: 41.2,
    examples: [
      {
        input: 's = "()"',
        output: "true",
      },
      {
        input: 's = "()[]{}"',
        output: "true",
      },
      {
        input: 's = "(]"',
        output: "false",
      },
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'.",
    ],
    hints: [
      "Use a stack to keep track of opening brackets.",
      "When you encounter a closing bracket, check if it matches the bracket on top of the stack.",
    ],
    starterTemplates: {
      javascript: `function isValid(s) {
    // Write your JavaScript solution here
    
};`,
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        # Write your Python solution here
        pass`,
      cpp: `#include <string>
#include <stack>

class Solution {
public:
    bool isValid(std::string s) {
        // Write your C++ solution here
        
    }
};`,
      java: `import java.util.Stack;

class Solution {
    public boolean isValid(String s) {
        // Write your Java solution here
        return false;
    }
}`,
    },
    testCases: [
      { input: "\"()\"", expectedOutput: "true", isHidden: false },
      { input: "\"()[]{}\"", expectedOutput: "true", isHidden: false },
      { input: "\"(]\"", expectedOutput: "false", isHidden: true },
    ],
  },
  {
    id: 3,
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
    tags: ["Hash Table", "String", "Sliding Window"],
    companies: ["Google", "Amazon", "Uber", "Adobe"],
    acceptanceRate: 33.8,
    examples: [
      {
        input: 's = "abcabcbb"',
        output: "3",
        explanation: "The answer is \"abc\", with the length of 3.",
      },
      {
        input: 's = "bbbbb"',
        output: "1",
        explanation: "The answer is \"b\", with the length of 1.",
      },
      {
        input: 's = "pwwkew"',
        output: "3",
        explanation: "The answer is \"wke\", with the length of 3. Note that the answer must be a substring, \"pwke\" is a subsequence and not a substring.",
      },
    ],
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces.",
    ],
    hints: [
      "Keep a sliding window of characters without duplicates.",
      "Use a hash map or set to check for character occurrences in O(1) time.",
    ],
    starterTemplates: {
      javascript: `function lengthOfLongestSubstring(s) {
    // Write your JavaScript solution here
    
};`,
      python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Write your Python solution here
        pass`,
      cpp: `#include <string>
#include <unordered_set>
#include <algorithm>

class Solution {
public:
    int lengthOfLongestSubstring(std::string s) {
        // Write your C++ solution here
        
    }
};`,
      java: `import java.util.HashSet;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Write your Java solution here
        return 0;
    }
}`,
    },
    testCases: [
      { input: "\"abcabcbb\"", expectedOutput: "3", isHidden: false },
      { input: "\"bbbbb\"", expectedOutput: "1", isHidden: false },
      { input: "\"pwwkew\"", expectedOutput: "3", isHidden: true },
    ],
  },
];