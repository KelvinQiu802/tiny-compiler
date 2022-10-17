// TRAVERSER
function traverser(ast, visitor) {
  // 当遇到Program和CallExpression的AST时，进一步便利里面的数组
  // 定义函数专门用来遍历数组
  function traverseArray(array, parent) {
    array.forEach((child) => {
      traverseNode(child, parent);
    });
  }

  // 这个函数用于处理每个便利到的节点
  // 传入的当前node和parent node可以被visitor使用
  function traverseNode(node, parent) {
    // 从visitor中拿到对应type的方法
    const method = visitor[node.type];

    // 对于这个项目，只需要调用enter方法，不需要exit方法
    if (method && method.enter) {
      method.enter(node, parent);
    }

    // 接下来就要处理Program和CallExpression的情况，需要便利里面的数组
    switch (node.type) {
      case 'Program':
        traverseArray(node.body, node);
        break;

      case 'CallExpression':
        traverseArray(node.params, node);
        break;

      // 其他情况直接break
      case 'NumberLiteral':
      case 'StringLiteral':
        break;

      default:
        throw new TypeError(node.type);
    }
  }

  // 开启遍历
  traverseNode(ast, null);
}

module.exports = traverser;
