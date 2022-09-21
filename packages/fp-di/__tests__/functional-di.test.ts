import { def, run } from '../src'

interface ServiceA {
  foo(): number
}

interface ServiceB {
  foo: string
  bar: string
}

const ServiceA = def<ServiceA, number>('ServiceA')
const ServiceB = def<ServiceB>('ServiceB')

const serviceAImpl = ServiceA.impl((n) => {
  return {
    foo() {
      return 111 + n
    },
  }
})

const serviceBImpl = ServiceB.impl(() => {
  return {
    foo: ServiceA(1).foo().toFixed(2),
    bar: ServiceA(2).foo().toFixed(2),
  }
})

const serviceBDirectImpl = ServiceB.impl(() => {
  return {
    foo: '666',
    bar: '777',
  }
})

const serverBNestImpl = ServiceB.impl(() => {
  const { foo } = run(() => ServiceB(), [serviceAImpl, serviceBImpl])
  const { bar } = run(() => ServiceB(), [serviceBDirectImpl])
  return {
    foo,
    bar,
  }
})

describe('functional-di', () => {
  it('support inject handler', () => {
    const value0 = run(() => ServiceA(1), [serviceAImpl]).foo()
    const value1 = run(() => ServiceA(2), [serviceAImpl]).foo()

    expect(value0).toEqual(112)
    expect(value1).toEqual(113)
  })

  it('support using callable in handler', () => {
    const value = run(() => ServiceB(), [serviceAImpl, serviceBImpl])

    expect(value).toEqual({ foo: '112.00', bar: '113.00' })
  })

  it('support nested', () => {
    const value = run(() => ServiceB(), [serverBNestImpl])

    expect(value).toEqual({ foo: '112.00', bar: '777' })
  })

  it('support reusing injected value by the same arg', () => {
    const [left, right] = run(() => {
      return [ServiceA(1), ServiceA(1)] as const
    }, [serviceAImpl])

    expect(left === right).toBe(true)
  })

  it('support default handler', () => {
    const test = def<number>('test', () => 0)

    const value0 = test()
    const value1 = run(() => test(), [test.impl(() => 1)])

    expect(value0).toBe(0)
    expect(value1).toBe(1)
  })
})
