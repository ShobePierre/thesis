/**
 * Code Block Parser
 * Converts source code into draggable code blocks with syntax awareness
 * Supports: Python, JavaScript, Java, C++
 */

export class CodeBlockParser {
  constructor(language = 'python') {
    this.language = language.toLowerCase();
    this.blockTypes = {
      VARIABLE: 'variable',
      FUNCTION: 'function',
      KEYWORD: 'keyword',
      OPERATOR: 'operator',
      LITERAL: 'literal',
      STATEMENT: 'statement',
      CONDITION: 'condition',
      LOOP: 'loop',
    };
  }

  /**
   * Parse code and extract blocks (one block per line)
   * @param {string} code - Source code to parse
   * @param {object} config - Parsing configuration
   * @returns {array} Array of code blocks
   */
  parseCode(code, config = {}) {
    const blocks = [];
    let blockIndex = 0;

    const lines = code.split('\n');

    lines.forEach((line, lineIndex) => {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
        return;
      }

      // Create one block per logical line
      blocks.push(this.createBlock(trimmed, this.getLineType(trimmed), lineIndex, 0));
      blockIndex++;
    });

    return this.assignBlockIds(blocks);
  }

  /**
   * Determine the type of a code line
   */
  getLineType(line) {
    if (line.startsWith('def ') || line.startsWith('function ')) return 'FUNCTION';
    if (line.startsWith('if ') || line.startsWith('else')) return 'CONDITION';
    if (line.startsWith('for ') || line.startsWith('while ')) return 'LOOP';
    if (line.startsWith('import ') || line.startsWith('require(')) return 'STATEMENT';
    if (line.includes('=') && !line.includes('==')) return 'VARIABLE';
    if (line.startsWith('print') || line.startsWith('console.log')) return 'STATEMENT';
    if (line.startsWith('return ')) return 'KEYWORD';
    return 'STATEMENT';
  }
  parseJavaScriptLine(line, lineIndex) {
    const blocks = [];

    // Variable declaration
    if (line.match(/^(let|const|var)\s+/)) {
      const match = line.match(/^(let|const|var)\s+(\w+)\s*=\s*(.+?);?$/);
      if (match) {
        blocks.push(this.createBlock(match[1], 'KEYWORD', lineIndex, 0));
        blocks.push(this.createBlock(match[2], 'VARIABLE', lineIndex, 1));
        blocks.push(this.createBlock('=', 'OPERATOR', lineIndex, 2));
        blocks.push(this.createBlock(match[3], 'LITERAL', lineIndex, 3));
      }
    }
    // If statement
    else if (line.startsWith('if ')) {
      const condition = line.substring(3).match(/\((.*)\)/)?.[1] || '';
      blocks.push(this.createBlock('if', 'KEYWORD', lineIndex, 0));
      blocks.push(this.createBlock('(', 'OPERATOR', lineIndex, 1));
      blocks.push(this.createBlock(condition, 'CONDITION', lineIndex, 2));
      blocks.push(this.createBlock(')', 'OPERATOR', lineIndex, 3));
      blocks.push(this.createBlock('{', 'OPERATOR', lineIndex, 4));
    }
    // For loop
    else if (line.startsWith('for ')) {
      const condition = line.substring(4).match(/\((.*)\)/)?.[1] || '';
      blocks.push(this.createBlock('for', 'KEYWORD', lineIndex, 0));
      blocks.push(this.createBlock('(', 'OPERATOR', lineIndex, 1));
      blocks.push(this.createBlock(condition, 'CONDITION', lineIndex, 2));
      blocks.push(this.createBlock(')', 'OPERATOR', lineIndex, 3));
      blocks.push(this.createBlock('{', 'OPERATOR', lineIndex, 4));
    }
    // Function call
    else if (line.includes('(') && line.includes(')')) {
      const match = line.match(/(\w+)\s*\((.*)\)/);
      if (match) {
        blocks.push(this.createBlock(match[1], 'FUNCTION', lineIndex, 0));
        blocks.push(this.createBlock('(', 'OPERATOR', lineIndex, 1));
        blocks.push(this.createBlock(match[2], 'LITERAL', lineIndex, 2));
        blocks.push(this.createBlock(')', 'OPERATOR', lineIndex, 3));
      }
    }
    // Simple statement
    else {
      blocks.push(this.createBlock(line, 'STATEMENT', lineIndex, 0));
    }

    return blocks;
  }

  /**
   * Create a block object
   */
  createBlock(content, type, lineIndex, position) {
    return {
      id: null, // Assigned later
      content: content.trim(),
      type: type,
      lineIndex: lineIndex,
      position: position,
      isHidden: false,
      hint: null,
      difficulty: 'easy',
    };
  }

  /**
   * Assign unique IDs to blocks
   */
  assignBlockIds(blocks) {
    return blocks.map((block, index) => ({
      ...block,
      id: `block_${index}`,
    }));
  }

  /**
   * Mark blocks as hidden based on block IDs
   * @param {array} blocks - Code blocks
   * @param {array} hiddenBlockIds - IDs of blocks to hide
   * @returns {array} Blocks with hidden flags set
   */
  markHiddenBlocks(blocks, hiddenBlockIds = []) {
    return blocks.map(block => ({
      ...block,
      isHidden: hiddenBlockIds.includes(block.id),
    }));
  }

  /**
   * Get blocks by type
   */
  getBlocksByType(blocks, type) {
    return blocks.filter(block => block.type === type);
  }

  /**
   * Validate student solution
   * @param {array} blocks - Original code blocks
   * @param {array} studentSolution - Student's arranged blocks
   * @returns {object} Validation result
   */
  validateSolution(blocks, studentSolution) {
    const result = {
      correct: false,
      errors: [],
      feedback: '',
      score: 0,
    };

    if (!studentSolution || studentSolution.length !== blocks.length) {
      result.errors.push('Missing or extra blocks');
      return result;
    }

    // Check if blocks are in correct order
    let allCorrect = true;
    blocks.forEach((original, index) => {
      const student = studentSolution[index];
      if (!student) {
        result.errors.push(`Missing block at position ${index}`);
        allCorrect = false;
        return;
      }

      if (student.id !== original.id) {
        result.errors.push(`Wrong block at position ${index}: expected "${original.content}", got "${student.content}"`);
        allCorrect = false;
      }
    });

    result.correct = allCorrect;
    result.score = allCorrect ? 100 : Math.max(0, 100 - result.errors.length * 10);
    result.feedback = allCorrect 
      ? '✓ Correct! Code is complete and syntactically valid.'
      : `✗ Incorrect. ${result.errors.join(' ')}`;

    return result;
  }

  /**
   * Generate hints for a block
   */
  generateHint(block) {
    const hints = {
      VARIABLE: `This is a variable. It stores a value.`,
      FUNCTION: `This is a function. It performs an action.`,
      KEYWORD: `This is a keyword. It defines code structure.`,
      OPERATOR: `This is an operator. It performs operations.`,
      LITERAL: `This is a value or literal.`,
      CONDITION: `This is a condition to check.`,
      LOOP: `This is a loop statement.`,
    };

    return hints[block.type] || 'Drag this block to the correct position.';
  }
}

/**
 * Easy syntax for creating test code blocks
 */
export function createSampleCodeBlocks(language = 'python') {
  const parser = new CodeBlockParser(language);

  if (language === 'python') {
    const code = `
x = 10
y = 20
z = x + y
print(z)
    `;
    return parser.parseCode(code);
  } else if (language === 'javascript') {
    const code = `
let x = 10;
let y = 20;
let z = x + y;
console.log(z);
    `;
    return parser.parseCode(code);
  }

  return [];
}
