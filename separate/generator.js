// CODE GENERATOR
// 递归调用，每一次都会在屏幕上打印当前节点生成的字符，最后链接起来就是结果
function codeGenerator(node) {
  // 下面只需要针对所有type进行输出即可
  switch (node.type) {
    // 一个Program里面可能有很多条语句，所以这里要遍历所有语句，并且换行输出
    case 'Program':
      return node.body.map((statement) => codeGenerator(statement)).join('\n');

    // 一个ExpressionStatement由语句的内容和一个;组成
    case 'ExpressionStatement':
      return codeGenerator(node.expression) + ';';

    // 一个CallExpression，应先打印callee中的identifier，然后再一对括号内递归params内的节点
    case 'CallExpression':
      return (
        codeGenerator(node.callee) +
        '(' +
        node.arguments.map((n) => codeGenerator(n)).join(', ') +
        ')'
      );

    // callee中的identifier
    case 'Identifier':
      return node.name;

    case 'NumberLiteral':
      return node.value;

    // 字符串需要用双引号包裹
    case 'StringLiteral':
      return '"' + node.value + '"';

    default:
      throw new TypeError(node.type);
  }
}

module.exports = codeGenerator;
