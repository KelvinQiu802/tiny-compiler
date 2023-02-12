import { names } from "./type";
import type {
  AllExpressionDict,
  Names,
  PreAllExpression,
  PreCallExpression,
} from "./type";

export const isNames = (v: any): v is Names => {
  if (names.indexOf(v) === -1) {
    return false;
  }
  return true;
};
export const isPreCallExpression = (obj: object): obj is PreCallExpression => {
  const _obj = obj as PreAllExpression;
  if (
    _obj.type === "CallExpression" &&
    isNames(_obj.name) &&
    Array.isArray(_obj.params)
  ) {
    return true;
  }
  return false;
};
export const isNumberLiteral = (
  obj: object
): obj is AllExpressionDict["NumberLiteral"] => {
  const _obj = obj as AllExpressionDict["NumberLiteral"];
  if (_obj.type === "NumberLiteral" && !isNaN(Number(_obj.value))) {
    return true;
  }
  return false;
};
export const isStringLiteral = (
  obj: object
): obj is AllExpressionDict["StringLiteral"] => {
  const _obj = obj as AllExpressionDict["StringLiteral"];
  if (_obj.type === "StringLiteral" && typeof _obj.value === "string") {
    return true;
  }
  return false;
};
