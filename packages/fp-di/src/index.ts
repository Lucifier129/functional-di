export type SerializablePrimitives = void | undefined | number | string | boolean | null

export type SerializableArray = Serializable[]

export type SerializableObject = { [key: string]: Serializable }

export type Serializable = SerializablePrimitives | SerializableArray | SerializableObject | Serializable[]

export type InjectableHandler<value, arg extends Serializable> = (arg: arg) => value

export type Injectable<value, arg extends Serializable> = {
  type: 'Injectable'
  injectableName: string
  defaultHandler?: InjectableHandler<value, arg>
  impl: (handler: InjectableHandler<value, arg>) => Injected<value, arg>
  (arg: arg): RequestForInjected<value, arg>
}

export type RequestForInjected<value, arg extends Serializable> = {
  type: 'RequestForInjected'
  injectable: Injectable<value, arg>
  arg: arg
}

export type Injected<value, arg extends Serializable> = {
  type: 'Injected'
  injectable: Injectable<value, arg>
  (arg: arg): value
}

export type AnyInjectable = Injectable<any, any>

export type AnyInjected = Injected<any, any>

export type Container = {
  get: <value, arg extends Serializable>(request: RequestForInjected<value, arg>) => value
  run: <T>(fn: () => T, injectedList?: AnyInjected[]) => T
  use: (injectedList: AnyInjected[]) => void
}

export const Injectable = <value, arg extends Serializable>(
  name?: string,
  defaultHandler?: Injectable<value, arg>['defaultHandler'],
): Injectable<value, arg> => {
  const injectable = ((arg: arg): RequestForInjected<value, arg> => {
    return {
      type: 'RequestForInjected',
      injectable,
      arg,
    }
  }) as unknown as Injectable<value, arg>

  injectable.type = 'Injectable'
  injectable.injectableName = name ?? ''
  injectable.defaultHandler = defaultHandler
  injectable.impl = (handler) => {
    const injected = handler.bind(null) as unknown as AnyInjected

    injected.type = 'Injected'
    injected.injectable = injectable

    return injected
  }

  return injectable
}

type InjectableConfig = {
  injected: AnyInjected
  valueMap: Map<string, unknown>
}

type Storage = Map<AnyInjectable, InjectableConfig>

let currentContainer: Container | null = null

export const Container = (parentContainer?: Container | null) => {
  let storage: Storage = new Map()

  const get: Container['get'] = (request) => {
    let injectableConfig = storage.get(request.injectable)

    if (!injectableConfig) {
      if (parentContainer) {
        return parentContainer.get(request)
      }

      if (request.injectable.defaultHandler) {
        const injected = request.injectable.impl(request.injectable.defaultHandler)
        useInjected(injected)
        return get(request)
      }

      throw new Error(`Injected value for ${request.injectable.injectableName ?? 'unknown'} not found.`)
    }

    const key = JSON.stringify(request.arg) ?? ''

    if (injectableConfig.valueMap.has(key)) {
      return injectableConfig.valueMap.get(key)!
    }

    const value = injectableConfig.injected(request.arg)

    injectableConfig.valueMap.set(key, value)

    return value
  }

  const useInjected = <value, arg extends Serializable>(injected: Injected<value, arg>) => {
    storage.set(injected.injectable, {
      injected,
      valueMap: new Map(),
    })
  }

  const use: Container['use'] = (injectedList) => {
    for (const injected of injectedList) {
      useInjected(injected)
    }
  }

  const run: Container['run'] = (fn, injectedList) => {
    const prevContainer = currentContainer

    if (injectedList) {
      use(injectedList)
    }

    try {
      currentContainer = container
      return fn()
    } finally {
      currentContainer = prevContainer
    }
  }

  const container: Container = {
    get,
    use: use,
    run,
  }

  return container
}

export const run = <T>(fn: () => T, injectedList?: AnyInjected[]): T => {
  const container = Container(currentContainer)

  return container.run(fn, injectedList)
}

export type Callable<value, arg extends Serializable> = {
  type: 'Callable'
  injectable: Injectable<value, arg>
  impl: Injectable<value, arg>['impl']
  (arg: arg): value
}

export function def<value, arg extends Serializable = void>(
  name?: string,
  defaultHandler?: Injectable<value, arg>['defaultHandler'],
): Callable<value, arg> {
  const injectable = Injectable<value, arg>(name, defaultHandler)

  const callable = ((arg: arg) => {
    if (!currentContainer) {
      if (injectable.defaultHandler) {
        return injectable.defaultHandler(arg)
      }
      throw new Error(`Injectable ${injectable.injectableName} can't be called without container`)
    }

    const request = injectable(arg)
    return currentContainer.get(request) as value
  }) as unknown as Callable<value, arg>

  callable.type = 'Callable'
  callable.injectable = injectable
  callable.impl = injectable.impl

  return callable
}
