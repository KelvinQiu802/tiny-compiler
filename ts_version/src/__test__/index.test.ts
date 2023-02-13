/**
 * 如果你是第一次看 jest 的文件, 或者你是第一次为程序写测试
 * 也不用担心, 都是一些很简单的测试, 跟着注释就能看懂
 * 如果你想深入了解 jest, 那么你可以去看看他们的官网
 * @see https://jestjs.io/zh-Hans/
 */

import { describe, test, expect } from "@jest/globals";
import { codeGenerator, compiler, parser, tokenizer, transformer } from "..";
import type { Tokens, AST, PreAst } from "../type";

// describe 只是单纯的把单独的测试集合到一起而已
describe("Test compiler start...", () => {
  // jest 等一些的用于编写测试的库都遵循一个思路
  // 先定义我们最终的目标, 然后写程序去匹配这个目标
  // 所以这里我们先定义最终的答案, 即我们期望程序输出什么
  const input = `(add 10 (subtract 20 100)) (connect "Hello" "World")`;
  const tokens: Tokens = [
    { type: "paren", value: "(" },
    { type: "name", value: "add" },
    { type: "number", value: "10" },
    { type: "paren", value: "(" },
    { type: "name", value: "subtract" },
    { type: "number", value: "20" },
    { type: "number", value: "100" },
    { type: "paren", value: ")" },
    { type: "paren", value: ")" },
    { type: "paren", value: "(" },
    { type: "name", value: "connect" },
    { type: "string", value: "Hello" },
    { type: "string", value: "World" },
    { type: "paren", value: ")" },
  ];
  /**
   * @notice 注: 原本的 ast 这里写作 preAst, newAst 写作 ast
   */
  const preAst: PreAst = {
    type: "Program",
    body: [
      {
        type: "CallExpression",
        name: "add",
        params: [
          { type: "NumberLiteral", value: "10" },
          {
            type: "CallExpression",
            name: "subtract",
            params: [
              { type: "NumberLiteral", value: "20" },
              { type: "NumberLiteral", value: "100" },
            ],
          },
        ],
      },
      {
        type: "CallExpression",
        name: "connect",
        params: [
          { type: "StringLiteral", value: "Hello" },
          { type: "StringLiteral", value: "World" },
        ],
      },
    ],
  };
  const ast: AST = {
    type: "Program",
    body: [
      {
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression",
          callee: { type: "Identifier", name: "add" },
          arguments: [
            { type: "NumberLiteral", value: "10" },
            {
              type: "CallExpression",
              callee: { type: "Identifier", name: "subtract" },
              arguments: [
                { type: "NumberLiteral", value: "20" },
                { type: "NumberLiteral", value: "100" },
              ],
            },
          ],
        },
      },
      {
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression",
          callee: { type: "Identifier", name: "connect" },
          arguments: [
            { type: "StringLiteral", value: "Hello" },
            { type: "StringLiteral", value: "World" },
          ],
        },
      },
    ],
  };

  // test 函数是一个一个的测试单元
  test("Test tokenizer", () => {
    // 回调函数里写我们实际要测试的东西
    // 这里我们引入我们在别处写好的 tokenizer 函数并调用它
    const actual = tokenizer(input);

    // 调用函数之后我们希望它匹配我们最初定义好的答案
    // 下面这行代码为: 如果 actual 等于 tokens, 那么测试通过, 反之不通过
    expect(actual).toStrictEqual(tokens);
    // 其他所有的测试单元都是这样, 很简单对吧
  });

  test("Test parser", () => {
    const actual = parser(tokens);
    expect(actual).toStrictEqual(preAst);
  });

  test("Test transformer", () => {
    const actual = transformer(preAst);
    expect(actual).toStrictEqual(ast);
  });

  test("Test code generator", () => {
    const actual = codeGenerator(ast);
    // 唯一需要注意的是匹配 object 等构造的时候我们用的是 toSrictEqual
    // 但匹配文字列等需要用 toBe
    expect(actual).toBe(
      `add(10, subtract(20, 100));\nconnect("Hello", "World");`
    );
    // 关于什么测试应该用什么规则匹配, 如果你感兴趣那就去看 jest 的官网吧～
    // 在文件最上方
  });

  test("Test compiler", () => {
    const actual = compiler(input);
    expect(actual).toBe(
      `add(10, subtract(20, 100));\nconnect("Hello", "World");`
    );
  });
});
