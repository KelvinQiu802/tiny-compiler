const traverser = require('./traverser');

// TRANSFORMER
function transformer(ast) {
  // 新建一个AST，用于储存转换后的AST
  const newAst = {
    type: 'Program',
    body: [],
  };

  // 因为visitor的内部并没有和newAst建立链接，但和旧的AST的node和parent node都有链接
  // 所以这里可以偷懒，用旧AST的一个字段储存newAst的一个引用，这样就可以通过旧AST来访问和修改newAst了
  ast._context = newAst.body;

  // 调用TRAVERSER
  traverser(ast, {
    // 定义visitor

    // CallExpression
    CallExpression: {
      enter(node, parent) {
        // 创建新的节点
        let expression = {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: node.name,
          },
          arguments: [],
        };

        // 像上面一样，因为CallExpression节点会作为parent节点
        // 为了能修改newAst，需要在当前节点上添加一个_context字段来储存expression.arguments的引用
        // 这样子节点就可以通过旧AST访问和修改newAst了
        node._context = expression.arguments;

        // 观察我们转换的目标，需要在最外面一层的CallExpression之外再包裹一层ExpressionStatement
        if (parent.type !== 'CallExpression') {
          expression = {
            type: 'ExpressionStatement',
            expression: expression,
          };
        }

        // 最终将创建好的新节点添加到newAst中
        parent._context.push(expression);
      },
    },

    // NumberLiteral
    NumberLiteral: {
      enter(node, parent) {
        // parent一定是CallExpression
        parent._context.push({
          type: 'NumberLiteral',
          value: node.value,
        });
      },
    },

    // StringLiteral
    StringLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: 'StringLiteral',
          value: node.value,
        });
      },
    },
  });

  // 返回构建好的newAst
  return newAst;
}

module.exports = transformer;
