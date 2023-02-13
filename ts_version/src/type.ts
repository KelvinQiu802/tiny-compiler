export const paren = ["(", ")"] as const;
export type Paren = typeof paren[number];
export type ParenToken = { type: "paren"; value: Paren };

export const names = ["add", "subtract", "connect"] as const;
export type Names = typeof names[number];
export type NameToken = { type: "name"; value: Names };

export type Token =
  | ParenToken
  | NameToken
  | { type: "number" | "string"; value: string };
export type Tokens = Token[];

export type IdentifierNode = {
  type: "Identifier";
  name: string;
};
export type AllExpressionDict = {
  CallExpression: {
    type: "CallExpression";
    callee: IdentifierNode;
    arguments: AllExpression[];
  };
  NumberLiteral: {
    type: "NumberLiteral";
    value: string;
  };
  StringLiteral: {
    type: "StringLiteral";
    value: string;
  };
  ExpressionStatement: {
    // 直接写出来才算句子, 即直属于 Program 下面
    // 嵌套在函数中的函数等不算句子
    type: "ExpressionStatement";
    expression: AllExpression;
  };
};

export type PreCallExpression = {
  type: "CallExpression";
  name: Names;
  params: PreAllExpression[];
  _argumentsContext?: AllExpressionDict["CallExpression"]["arguments"];
};
export type PreAst = {
  type: "Program";
  body: PreAllExpression[];
  _astContext?: AST["body"];
};
export type PreAllExpression =
  | Exclude<
      AllExpression,
      | AllExpressionDict["CallExpression"]
      | AllExpressionDict["ExpressionStatement"]
    >
  | PreCallExpression;

export type AllExpression = AllExpressionDict[keyof AllExpressionDict];

export type AST = {
  type: "Program";
  body: AllExpression[];
};
