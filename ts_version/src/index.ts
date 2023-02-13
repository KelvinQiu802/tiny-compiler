/**
 * (add 10 (subtract 20 100))  ←输入, 我们的原创语言
 *             ↓
 * add(10, subtract(20, 100));  ←输出, javascript 代码
 *
 * --- 关于如何快速阅读源码的建议 ---
 * 如果你使用 vscode 等编辑器, 你可以先把所有函数等全部折叠起来
 * 然后, 首先去看每个函数的入口在哪里, 进入函数之后第一个执行的动作的是什么
 * 之后再在看程序一定会运行的代码
 * 最后再去看别的一些处理例外的代码
 *
 * --- 关于与 js 版本的一些差异 ---
 * 1. js 版本的 ast 这里命名为 preAst, newAst 命名为 ast
 *
 * 2. js 版本中的 _context 这里根据储存类型不一样分别命名为
 *    _argumentsContext 和 _astContext
 *
 */

import {
  AllExpression,
  AllExpressionDict,
  AST,
  IdentifierNode,
  NameToken,
  ParenToken,
  PreAllExpression,
  PreAst,
  PreCallExpression,
  Tokens,
} from "./type";
import {
  isNames,
  isNumberLiteral,
  isPreCallExpression,
  isStringLiteral,
} from "./utils";

type Tokenizer = (input: string) => Tokens;
export const tokenizer: Tokenizer = (input) => {
  const tokens: Tokens = [];

  // 原本的 tokenizer 用的是 while 循环, 这里故意用 for 循环写了个别的版本
  for (let i = 0; i < input.length; i++) {
    let char = input[i];

    if (char === "(") {
      const token: ParenToken = { type: "paren", value: "(" };
      tokens.push(token);
      continue;
    }

    if (char === ")") {
      const token: ParenToken = { type: "paren", value: ")" };
      tokens.push(token);
      continue;
    }

    if (char === " ") {
      continue;
    }

    const NUMBER_REG = /[0-9]/;
    if (NUMBER_REG.test(char)) {
      let value = "";
      while (NUMBER_REG.test(char)) {
        value += char;
        char = input[++i];
      }
      i--; // 因为 for 循环会自动再 +1 导致跳过数字之后的1个文字所以这里要减回来
      tokens.push({ type: "number", value: value });
      continue;
    }

    if (char === `"`) {
      let value = "";
      while (true) {
        char = input[++i];
        if (char === `"`) {
          break;
        }
        value += char;
      }
      tokens.push({ type: "string", value: value });
      continue;
    }

    const LETTER_REG = /[a-z]/i;
    if (LETTER_REG.test(char)) {
      let value = "";
      while (LETTER_REG.test(char)) {
        value += char;
        char = input[++i];
      }
      if (isNames(value)) {
        tokens.push({ type: "name", value: value });
      } else {
        throw new TypeError(`${value} is undefined.`);
      }
      continue;
    }

    throw new Error("Syntax Error");
  }
  return tokens;
};

type Parser = (tokens: Tokens) => PreAst;
export const parser: Parser = (tokens) => {
  /**
   * @notice 注: 原本的 ast 这里写作 preAst, newAst 写作 ast
   */
  const preAst: PreAst = { type: "Program", body: [] };
  let currentPosition = 0;

  type Walker = () => PreAllExpression;
  const walker: Walker = () => {
    const token = tokens[currentPosition];

    // 关于下面 (大概150行左右) 为什么要手动更新 nextToken 的注释
    // 可以继续往下看
    // console.log("enter", token, currentPosition);

    if (token.type === "number") {
      const node: AllExpressionDict["NumberLiteral"] = {
        type: "NumberLiteral",
        value: token.value,
      };
      currentPosition++;
      return node;
    }

    if (token.type === "string") {
      const node: AllExpressionDict["StringLiteral"] = {
        type: "StringLiteral",
        value: token.value,
      };
      currentPosition++;
      return node;
    }

    // name 一定被 paren 所包围并且以 ( 开始
    if (token.type === "paren" && token.value === "(") {
      const nameToken = tokens[++currentPosition] as NameToken;

      // console.log("parse name", nameToken, currentPosition);

      const node: PreCallExpression = {
        type: "CallExpression",
        name: nameToken.value,
        params: [],
      };
      let nextToken = tokens[++currentPosition];
      // console.log("--next--", nextToken, currentPosition);
      while (nextToken.value !== ")") {
        node.params.push(walker());
        // 因为这里 call 了 walker 所以会导致 currentPosition 变化
        // 但不会进到这个 if, 所以 let nextToken 不会被触发
        // 即 nextToken 的值不会更新
        // 如果看不懂我在说什么, 可以把 console.log 的注释取消掉然后运行一次代码

        // console.log("next while", nextToken, currentPosition);

        // 所以需要手动更新用于判定的 nextToken, 不然就还会是上次赋值时的值
        nextToken = tokens[currentPosition];

        // console.log("next current", nextToken, currentPosition);
        // 并且因为是递归操作, 所以会留下上一次的(或者上上次)的循环还未结束, 即最后一个循环结算之后会结算上一个循环, 如果不在这里赋值值会因为上个循环的结算被变为"过去"的值
      }
      currentPosition++;
      return node;
    }

    throw new TypeError(`Undefined token ${token.type}:${token.value}`);
  };

  while (currentPosition < tokens.length) {
    preAst.body.push(walker());
  }

  return preAst;
};

type TransformNodeType = PreAst | PreAllExpression;
type TransformParentType = null | PreAst | PreAllExpression;
type Traverser = (preAst: PreAst, visitor: Visitor) => void;
/**
 * traverser 会由 transformer 调用, 可以先去看 transformer
 * {@link transformer}
 */
export const traverser: Traverser = (preAst, visitor) => {
  const traversArray = (
    array: PreAllExpression[],
    parent: TransformParentType
  ) => {
    array.forEach((elem) => {
      traversNode(elem, parent);
    });
  };

  type TraversNode = (
    node: TransformNodeType,
    parent: TransformParentType
  ) => void;
  const traversNode: TraversNode = (node, parent) => {
    if (node.type === "Program") {
      traversArray(node.body, node);
      return;
    }

    visitor[node.type].enter(node, parent);

    if (node.type === "CallExpression") {
      traversArray(node.params, node);
      return;
    }
  };

  traversNode(preAst, null);
};

// 如果可以的话想给不同的 visitor 定义不同的 ndoe 和 parent
// 例如 CallExpression 的 parent 永远不可能是 null
// 但这样就会丢失单一来源, 必须手写 key, 需要想个更好的办法
type Visitor = {
  [k in keyof Omit<AllExpressionDict, "ExpressionStatement">]: {
    enter: (node: TransformNodeType, parent: TransformParentType) => void;
    // 虽然本项目只会使用 enter, 但顺便就连 exit 一起写了
    exit: (node: TransformNodeType, parent: TransformParentType) => void;
  };
};
/**
 * visitor 作为 traverser 的第二个参数在 transformer 中被调用
 * 你应该先去看 transformer {@link transformer}
 *
 * 原代码把 visitor 写在了调用 traverser 的第二个参数里面
 * 这里为了方便阅读单独提出来
 */
export const visitor: Visitor = {
  CallExpression: {
    enter(node, parent) {
      if (!isPreCallExpression(node)) {
        throw new TypeError("Not a CallExpression.");
      }
      if (!parent) {
        throw new Error("CallExpression must be inside a Program.");
      }
      if (parent.type === "NumberLiteral" || parent.type === "StringLiteral") {
        throw new TypeError(
          `Unexpected parent when enter CallExpression. ${parent.type}`
        );
      }

      const callExp: AllExpressionDict["CallExpression"] = {
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: node.name,
        },
        arguments: [],
      };
      if ((parent.type as any) === "ExpressionStatement") {
        // 传过来的 parent 永远是 preAst, 本就不应该有 ExpressionStatment 在里面
        // 这里只是为了保险
        throw new TypeError("Unexpected ExpressionStatement.");
      }
      if (node.type === "CallExpression") {
        node._argumentsContext = callExp.arguments;
      }
      if (parent.type === "Program") {
        const sentence: AllExpressionDict["ExpressionStatement"] = {
          type: "ExpressionStatement",
          expression: callExp,
        };
        parent._astContext?.push(sentence);
        return;
      }
      if (!parent._argumentsContext) {
        throw new Error("Un linked AST by use _context.");
      }
      parent._argumentsContext.push(callExp);
    },
    exit(node, parent) {},
  },
  NumberLiteral: {
    enter(node, parent) {
      if (!isNumberLiteral(node)) {
        throw TypeError("Not a NumberLiteral.");
      }
      if (!parent) {
        throw new Error("NumberLiteral must be inside a Program.");
      }
      if (parent.type === "NumberLiteral" || parent.type === "StringLiteral") {
        throw new TypeError(
          `Unexpected parent when enter CallExpression. ${parent.type}`
        );
      }

      if (parent.type === "CallExpression") {
        if (!parent._argumentsContext) {
          throw new Error(
            "Un linked parent CallExpression arguments by _argumentsContext."
          );
        }
        parent._argumentsContext.push(node);
      } else if (parent.type === "Program") {
        if (!parent._astContext) {
          throw new Error("Un linked AST by use _astContext.");
        }
        parent._astContext.push(node);
      } else {
        throw new TypeError("Unexpected parent.");
      }
    },
    exit(node, parent) {},
  },
  StringLiteral: {
    enter(node, parent) {
      if (!isStringLiteral(node)) {
        throw new Error("Not a StringLiteral.");
      }
      if (!parent) {
        throw new Error("StringLiteral must be inside a Program.");
      }
      if (parent.type === "NumberLiteral" || parent.type === "StringLiteral") {
        throw new TypeError(
          `Unexpected parent when enter CallExpression. ${parent.type}`
        );
      }

      if (parent.type === "CallExpression") {
        if (!parent._argumentsContext) {
          throw new Error(
            "Un linked parent CallExpression arguments by _argumentsContext."
          );
        }
        parent._argumentsContext.push(node);
      } else if (parent.type === "Program") {
        if (!parent._astContext) {
          throw new Error("Un linked AST by use _astContext.");
        }
        parent._astContext.push(node);
      } else {
        throw new TypeError("Unexpected parent.");
      }
    },
    exit(node, parent) {},
  },
};

/**
 * transformer 中我们需要把原本的 ast 转换为更容易解释的 ast
 *
 * ----------------------------------------------------------------------------
 *   Original AST                     |   Transformed AST
 * ----------------------------------------------------------------------------
 *   {                                |   {
 *     type: 'Program',               |     type: 'Program',
 *     body: [{                       |     body: [{
 *       type: 'CallExpression',      |       type: 'ExpressionStatement',
 *       name: 'add',                 |       expression: {
 *       params: [{                   |         type: 'CallExpression',
 *         type: 'NumberLiteral',     |         callee: {
 *         value: '2'                 |           type: 'Identifier',
 *       }, {                         |           name: 'add'
 *         type: 'CallExpression',    |         },
 *         name: 'subtract',          |         arguments: [{
 *         params: [{                 |           type: 'NumberLiteral',
 *           type: 'NumberLiteral',   |           value: '2'
 *           value: '4'               |         }, {
 *         }, {                       |           type: 'CallExpression',
 *           type: 'NumberLiteral',   |           callee: {
 *           value: '2'               |             type: 'Identifier',
 *         }]                         |             name: 'subtract'
 *       }]                           |           },
 *     }]                             |           arguments: [{
 *   }                                |             type: 'NumberLiteral',
 *                                    |             value: '4'
 * ---------------------------------- |           }, {
 *                                    |             type: 'NumberLiteral',
 *                                    |             value: '2'
 *                                    |           }]
 *                                    |         }
 *                                    |       }
 *                                    |     }]
 *                                    |   }
 * ----------------------------------------------------------------------------
 */
type Transformer = (preAst: PreAst) => AST;
export const transformer: Transformer = (preAst) => {
  const ast: AST = {
    type: "Program",
    body: [],
  };

  // 最重要的一个部分, 将 ast 的引用带入 preAst
  // 并且在遇到递归时继续把新的引用带入 _context
  // 例如在遇到 CallExpression 的时候就会把 arguments 带入
  // 这样就能直接从 旧ast 来直接更新 新ast, 并且递归也会在同一阶层, 不需要重新解决 depth 的问题
  // 如果你听不懂我在说什么, 你可能需要试一试不用这个方法怎么解决
  // 试试不建立连接直接把 ast 当作第三个引数交给 traverser, 会麻烦很多
  preAst._astContext = ast.body;
  traverser(preAst, visitor);

  return ast;
};

type CodeGenerator = (node: AST | AllExpression | IdentifierNode) => string;
export const codeGenerator: CodeGenerator = (node) => {
  switch (node.type) {
    case "Program": {
      return node.body.map((exp) => codeGenerator(exp)).join("\n");
    }
    case "ExpressionStatement": {
      return codeGenerator(node.expression) + ";";
    }
    case "CallExpression": {
      return (
        codeGenerator(node.callee) +
        "(" +
        node.arguments.map((arg) => codeGenerator(arg)).join(", ") +
        ")"
      );
    }
    case "Identifier": {
      return node.name;
    }
    case "NumberLiteral": {
      return node.value;
    }
    case "StringLiteral": {
      return `"` + node.value + `"`;
    }
    default:
      throw new TypeError(`Unexpected type ${node}`);
  }
};

export const compiler = (input: string) => {
  const tokens = tokenizer(input);
  const preAst = parser(tokens);
  const ast = transformer(preAst);
  const result = codeGenerator(ast);
  return result;
};

console.log(compiler(`(add 10 (subtract 20 100)) (connect "Hello" "World")`));
