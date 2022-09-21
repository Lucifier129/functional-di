# functional-di

<p align="center">
  <img width="400" src="./assets/logo.png">
</p>

[![npm version](https://img.shields.io/npm/v/functional-di.svg?style=flat)](https://www.npmjs.com/package/functional-di)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](https://github.com/Lucifier129/functional-di#readme)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/Lucifier129/functional-di/graphs/commit-activity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/Lucifier129/functional-di/blob/master/LICENSE)
[![Twitter: guyingjie129](https://img.shields.io/twitter/follow/guyingjie129.svg?style=social)](https://twitter.com/guyingjie129)

> Dependency injection in functional style

### Installation

```sh
npm install --save functional-di

yarn add functional-di
```

### Usage

- `def` for creating injectable function
- `run` for injecting function

```typescript
import { def, run } from 'functional-di'

// define some interfaces
interface ServiceA {
  foo(): number
}

interface ServiceB {
  foo: string
  bar: string
}

// use def to create injectable & callable function
const ServiceA = def<ServiceA, number>('ServiceA')
const ServiceB = def<ServiceB>('ServiceB')

// use #impl(handler) to handle request for injected
const serviceAImpl = ServiceA.impl((n) => {
  return {
    foo() {
      return 111 + n
    },
  }
})

const serviceBImpl = ServiceB.impl(() => {
  return {
    // call function with argument to make a request
    foo: ServiceA(1).foo().toFixed(2),
    // different argument is supported
    bar: ServiceA(2).foo().toFixed(2),
  }
})

const serviceBDirectImpl = ServiceB.impl(() => {
  return {
    foo: '666',
    bar: '777',
  }
})

{
  const value0 = run(() => ServiceA(1), [serviceAImpl]).foo()
  const value1 = run(() => ServiceA(2), [serviceAImpl]).foo()

  expect(value0).toEqual(112)
  expect(value1).toEqual(113)
}

{
  const value = run(() => ServiceB(), [serviceAImpl, serviceBImpl])

  expect(value).toEqual({ foo: '112.00', bar: '113.00' })
}

// supports nested
const serverBNestImpl = ServiceB.impl(() => {
  const { foo } = run(() => ServiceB(), [serviceAImpl, serviceBImpl])
  const { bar } = run(() => ServiceB(), [serviceBDirectImpl])
  return {
    foo,
    bar,
  }
})

{
  const value = run(() => ServiceB(), [serverBNestImpl])

  expect(value).toEqual({ foo: '112.00', bar: '777' })
}
```

## Apis

### def<value, arg = void>(name?, defaultHandler?): (arg => value)

`def` is used for define injectable function

- if `default-handler` was given, getValue formed like a normal function which can be called directly
- otherwise it should not be called without `run(fn)`

```typescript
const getValue = def<number>(
  // the name used for improving readability of the error message
  'getValue',
  // default-handler when no injected handler found.
  () => 0,
)

/**
 * if default-handler was given, getValue formed like a normal function which can be called directly
 * otherwise it should not be called without `run(fn)`
 */
console.log(getValue()) // 0

/**
 * the first type variable is for return type
 * the second type variable is for arg type
 */
const getValueWithArg = def<string, number>('getValueWithArg', (input: number) => `input is : ${input}`)

/**
 * give another impl for getValue
 * it can be used to inject, replacing the default handler
 */
const getValueImpl = getValue.impl(() => 100)

const getValueWithArgImpl = getValueWithArg.impl((input: number) => {
  return `another-impl: input is : ${input}`
})
```

### run(fn, injectedList?): ReturnType<typeof fn>

`run` is used for injecting value consumed by the consumers in `fn()`

```typescript
const getValue = def<number>(
  // the name used for improving readability of the error message
  'getValue',
  // default-handler when no injected handler found.
  () => 0,
)

console.log(run(() => getValue(), [getValue.impl(() => 1)])) // 1
```

# PRs are welcome
