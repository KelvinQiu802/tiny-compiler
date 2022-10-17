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

module.exports = tokenizer;
