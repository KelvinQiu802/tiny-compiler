// TOKENIZER
function tokenizer(input) {
  // 记录当前便利到的位置，也就是当前的index
  let current = 0;

  // 储存所有tokens的数组
  const tokens = [];

  // 遍历input的所有字符
  while (current < input.length) {
    // 当前的字符
    let char = input[current];

    // 匹配开括号 "("
    if (char === '(') {
      tokens.push({ type: 'paren', value: '(' });
      current++;
      continue;
    }

    // 匹配闭括号 ")"
    if (char === ')') {
      tokens.push({ type: 'paren', value: ')' });
      current++;
      continue;
    }

    // 匹配空格
    if (char === ' ') {
      // 空格不需要被记录在tokens中，直接跳过即可
      current++;
      continue;
    }

    // 匹配数字, 使用正则表达式
    const NUMBERS = /[0-9]/;
    if (NUMBERS.test(char)) {
      // 数字可以不止一位，需要继续向下查找到完整的数字
      // 使用一个变量记录最终得到的数字，当然这里是用字符串表示
      let value = '';
      while (NUMBERS.test(char)) {
        value += char;
        char = input[++current]; // 先自增，再返回
      }

      tokens.push({ type: 'number', value });
      continue;
    }

    // 匹配字符串 '"'
    if (char == '"') {
      // 因为真正的字符串被包裹在引号之间，所以要像上面的数字那样，向后查找完整的字符串
      let value = '';
      char = input[++current]; // 跳过第一个双引号

      while (char !== '"') {
        value += char;
        char = input[++current];
      }

      char = input[++current]; // 跳过第二个双引号

      tokens.push({ type: 'string', value });
      continue;
    }

    // 匹配函数名，使用正则表达式
    const LETTERS = /[a-z]/i;
    if (LETTERS.test(char)) {
      // 同样函数名也不止有一个字母，所以要向后查找完整的单词
      let value = '';
      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }

      tokens.push({ type: 'name', value });
      continue;
    }

    // 如果上面这些都没有匹配成功，则抛出错误
    throw new Error('I dont know what this character is: ' + char);
  }

  // 返回tokens数组
  return tokens;
}

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

// COMPILER
function compiler(input) {
  const tokens = tokenizer(input);
  const ast = parser(tokens);
  const newAst = transformer(ast);
  return codeGenerator(newAst);
}
