## 1. Difference between var, let, and const?

## Answer:

| ver | let | const |
|------------------------------|-------------------------------|---------------------------|
| Function-scoped              | Block-scoped `{}`             | Block-scoped `{}` |
| It can be redeclared         | It cannot be redeclared       | It cannot be redeclared |
| **It can be updated**        | It can be updated             | It cannot be updated |
| It hoisted with `undefined`	 | It hoisted but not initialized| HIt hoisted but not initialized |

## 2. What is the spread operator (...)?

## Answer:

The spread operator `...` allows an iterable (like an array or object) to be expanded into individual elements. It's used to copy, combine, or pass elements.

## 3. Difference between map`()`, filter`()`, and forEach`()` ?

Answer: 

| map`()`                              | filter`()`                                      | forEach`()`                                       |
| ---------------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| It returns a **new array**         | It returns a **new array**                     | It returns **undefined (nothing)**                 |
| It is used to **transform each element** | It is used to **filter elements based on condition** | It is used to **execute a function for each element** |
| **Chainable**                      | **Chainable**                                  | **Not chainable**                               |

## 4.  What is an arrow function?

Answer:

Arrow functions are a shorter syntax for writing function expressions. They were introduced in ES6 and have a few key differences from regular functions.

## 5. What are template literals?

Answer:

Template literals are string literals that allow embedded expressions and multi-line strings. They use backticks ` instead of quotes.



