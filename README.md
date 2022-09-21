# fp-di

Dependency injection in functional style

### Installation

```sh
npm install --save fp-di

yarn add fp-di
```

### Usage

- `def` for creating injectable function
- `run` for injecting function

```typescript
import { def, run } from 'fp-di'

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

# PRs are welcome
