const compiler = require('./compiler');

// TEST
console.log(compiler('(add 10 (subtract 20 100)) (connect "Hello" "World")'));
// add(10, subtract(20, 100));
// connect("Hello", "World");
