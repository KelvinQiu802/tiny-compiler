// PARSER
function parser(tokens) {
  // 同样用一个current变量来记录当前token的位置
  let current = 0;

  // walk函数用于给每一个token生成AST(Abstract Syntax Tree 抽象语法树)
  function walk() {
    // walk内部也与tokenizer类似，根据不同的token，生成对应的AST
    let token = tokens[current];

    // 处理 数字token
    if (token.type === 'number') {
      current++; // 下一个token
      return {
        type: 'NumberLiteral',
        value: token.value,
      };
    }

    // 处理 字符串token
    if (token.type === 'string') {
      current++;
      return {
        type: 'StringLiteral',
        value: token.value,
      };
    }

    // 处理 表达式token 难点 递归
    // 表达式以开括号开始
    if (token.type === 'paren' && token.value === '(') {
      token = tokens[++current]; // 跳过开括号

      // node是表达式的最外层AST，params参数代表表达式的参数
      // params内可能是数字，也可能是其他表达式，所以这里必须递归，完成整颗树的构建
      let node = {
        type: 'CallExpression',
        name: token.value,
        params: [],
      };

      token = tokens[++current]; // 跳过表达式的name

      // 表达式以闭括号结束，所以在闭括号之前的token都应该被添加到params中，都属于表达式的参数
      while (token.value !== ')') {
        node.params.push(walk()); // 开始递归
        token = tokens[current]; // 递归后current变化，所以也要更新一下token
      }

      current++; // 跳过闭括号

      // 返回构建完成的 node AST
      return node;
    }

    // 同样，如果遇到没有匹配成功的token，直接报错
    throw new TypeError(token.type);
  }

  // 最外层的AST
  const ast = {
    type: 'Program',
    body: [],
  };

  // 因为传入的表达式可能不止一个，所以这里要用一个循环遍历所有表达式
  while (current < tokens.length) {
    ast.body.push(walk());
  }

  // 返回构建完成的 AST
  return ast;
}

module.exports = parser;
