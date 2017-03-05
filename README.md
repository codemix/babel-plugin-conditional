# babel-plugin-conditional

[![Build Status](https://travis-ci.org/codemix/babel-plugin-conditional.svg?branch=master)](https://travis-ci.org/codemix/babel-plugin-conditional)

Conditionally applies a set of babel plugins based on the result of an expression evaluated at runtime.

# What?

Yes, an explanation _would_ be nice. See https://github.com/codemix/flow-runtime/issues/64 for some background for what and why.

# Installation

```js
yarn add --dev babel-plugin-conditional
```

Add the following to your `.babelrc` or babel configuration:

```js
{
  "plugins": [
    ["conditional", {
      "test": "process.env.NODE_ENV === 'development'",
      "consequent": [["some-plugin-you-want-to-run-only-in-dev"]],
      "alternate": [["some-plugin-you-want-to-run-only-in-prod"]]
    }]
  ]
}

```

Now given an input like this:

```js
export const add = (a, b) => a + b;
```

it will produce output like this:

```js
export let add;
if (process.env.NODE_ENV === 'development') {
  const _add = (a, b) => {
    return a + b;
  };
  add = _add;
}
else {
  const _add = (a, b) => a + b;
  add = _add;
}
```

The condition can then be stripped by tools such as webpack or rollup, so you only get one of the branches in production, but library authors can ship a one set of file that covers both debug and production use cases.

# Licence

MIT.


# Licence