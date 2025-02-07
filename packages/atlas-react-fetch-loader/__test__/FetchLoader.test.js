import { shallow } from 'enzyme'

import '@babel/polyfill'
import fetchMock from 'fetch-mock'

import CalloutAlert from '../src/CalloutAlert'
import withFetchLoader, { AnimatedLoadingMessage } from '../src/FetchLoader'

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
const getRandomInt = (min, max) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min //The maximum is exclusive and the minimum is inclusive
}
const getRandomHttpErrorCode = () => getRandomInt(400, 600)

const MyComponent = () => <div></div>
const ComponentWithFetchLoader = withFetchLoader(MyComponent)

describe(`FetchLoader`, () => {
  beforeEach(() => {
    fetchMock.restore()
  })

  const props = {
    host: `foo/`,
    resource: `bar`
  }

  test(`until the fetch promise is not resolved a loading message is displayed, then goes away`, async () => {
    fetchMock.get(`*`, `[]`)
    const wrapper = shallow(<ComponentWithFetchLoader {...props} />)

    expect(wrapper.find(AnimatedLoadingMessage)).toHaveLength(1)
    expect(wrapper.find(CalloutAlert)).toHaveLength(0)

    await wrapper.instance().componentDidMount()
    expect(wrapper.find(AnimatedLoadingMessage)).toHaveLength(0)
    expect(wrapper.find(CalloutAlert)).toHaveLength(0)
  })

  test(`renders an error message if the child receives invalid JSON (and the error boundary kicks in)`, async () => {
    fetchMock.get(`*`, `[]`)
    const wrapper = shallow(<ComponentWithFetchLoader {...props} />)

    const e = new Error(`They’re inside you building a monument to compromise!`)
    wrapper.instance().componentDidCatch(e, `Ruben’s seen some rough years, Morty.`)
    expect(wrapper.find(CalloutAlert)).toHaveLength(1)
  })

  test(`renders an error message if request to the server returns 4xx or 5xx`, async () => {
    fetchMock.get(`*`, getRandomHttpErrorCode)
    const wrapper = shallow(<ComponentWithFetchLoader {...props} />)

    await wrapper.instance().componentDidMount()
    expect(wrapper.find(CalloutAlert)).toHaveLength(1)
  })

  test(`renders an error message if the component does not receive JSON`, async () => {
    fetchMock.get(`*`, `Break the cycle, Morty. Rise above. Focus on the science`)
    const wrapper = shallow(<ComponentWithFetchLoader {...props} />)

    await wrapper.instance().componentDidMount()
    expect(wrapper.find(CalloutAlert)).toHaveLength(1)
  })

  test(`re-fetches on props change and recovers from error if new fetch succeeds`, async () => {
    fetchMock.get(`/foo/bar`, getRandomHttpErrorCode)
    const wrapper = shallow(<ComponentWithFetchLoader {...props} />)

    await wrapper.instance().componentDidMount()
    expect(wrapper.find(CalloutAlert)).toHaveLength(1)

    fetchMock.get(`/pea/lentil`, `{"results":[]}`)
    wrapper.setProps({
      host: `pea/`,
      resource: `lentil`
    })

    await wrapper.instance().componentDidUpdate()
    expect(wrapper.find(CalloutAlert)).toHaveLength(0)
  })

  test(`additional pass-through are added to the JSON payload`, async () => {
    fetchMock.get(`/foo/bar`, `{"results":[]}`)
    const wrapper = shallow(<ComponentWithFetchLoader {...props} />)

    await wrapper.instance().componentDidMount()
    expect(wrapper.find(MyComponent)).toHaveProp(props)
    expect(wrapper.find(MyComponent)).toHaveProp(`results`, [])
  })

  test(`can inject a loading payload provided instead of rendering the loading message`, () => {
    // We need to return a callback from the request to simulate a pending promise
    fetchMock.get(`/foo/bar`, () => {})
    const wrapper =
     shallow(
       <ComponentWithFetchLoader
         {...props}
         loadingPayloadProvider={() => ({foo: `bar`})} />)

    expect(wrapper.find(AnimatedLoadingMessage)).toHaveLength(0)
    expect(wrapper.find(MyComponent)).toHaveProp(props)
    expect(wrapper.find(MyComponent)).toHaveProp(`foo`, `bar`)
  })

  test(`can inject an error payload provider instead of rendering the callout alert component`, async () => {
    fetchMock.get(`/foo/bar`, getRandomHttpErrorCode)
    const wrapper =
     shallow(
       <ComponentWithFetchLoader
         {...props}
         errorPayloadProvider={(error) => ({...error, foo: `bar`})} />)

    await wrapper.instance().componentDidMount()
    expect(wrapper.find(CalloutAlert)).toHaveLength(0)
    expect(wrapper.find(MyComponent)).toHaveProp(props)
    expect(wrapper.find(MyComponent)).toHaveProp(`foo`, `bar`)
    // Props after destructuring the error object
    expect(wrapper.find(MyComponent)).toHaveProp(`description`)
    expect(wrapper.find(MyComponent)).toHaveProp(`name`)
    expect(wrapper.find(MyComponent)).toHaveProp(`message`)
  })

  test(`can rename data keys before injecting the payload to the wrapped component`, async () => {
    fetchMock.get(`/foo/bar`, `{"results":[]}`)
    const wrapper = shallow(<ComponentWithFetchLoader {...props} renameDataKeys={{ results: `foobarius` }}/>)

    await wrapper.instance().componentDidMount()
    expect(wrapper.find(MyComponent)).toHaveProp(props)
    expect(wrapper.find(MyComponent)).not.toHaveProp(`results`)
    expect(wrapper.find(MyComponent)).toHaveProp(`foobarius`, [])
  })

  test(`can gracefully handle non-existing renamed data keys`, async () => {
    fetchMock.get(`/foo/bar`, `{"results":[]}`)
    const wrapper = shallow(<ComponentWithFetchLoader {...props} renameDataKeys={{ foo: `bar` }}/>)

    await wrapper.instance().componentDidMount()
    expect(wrapper.find(MyComponent)).toHaveProp(props)
    expect(wrapper.find(MyComponent)).toHaveProp(`results`, [])
    expect(wrapper.find(MyComponent)).not.toHaveProp(`foo`)
    expect(wrapper.find(MyComponent)).not.toHaveProp(`bar`)
  })

  test(`handles same name data keys as a pass-through props`, async () => {
    fetchMock.get(`/foo/bar`, `{"results":[]}`)
    const wrapper = shallow(<ComponentWithFetchLoader {...props} renameDataKeys={{ results: `results` }}/>)

    await wrapper.instance().componentDidMount()
    expect(wrapper.find(MyComponent)).toHaveProp(props)
    expect(wrapper.find(MyComponent)).toHaveProp(`results`, [])
  })

  test(`can add new props via callbacks over the data payload`, async () => {
    const payload = {
      results: []
    }

    fetchMock.get(`/foo/bar`, JSON.stringify(payload))
    const wrapper =
      shallow(
        <ComponentWithFetchLoader
          {...props}
          fulfilledPayloadProvider={ data => ({ resultsLength: data.results.length }) }
        />)

    await wrapper.instance().componentDidMount()
    expect(wrapper.find(MyComponent)).toHaveProp(props)
    expect(wrapper.find(MyComponent)).toHaveProp(`results`, payload.results)
    expect(wrapper.find(MyComponent)).toHaveProp(`resultsLength`, payload.results.length)
  })

  test(`when host/resource change, the component is reset and reloads`, async () => {
    const firstPayload = {
      results: [{ title: `Foobar` }]
    }
    const secondPayload = {
      results: [{ title: `Barfoo`}]
    }

    fetchMock.get(`/foo/bar`, JSON.stringify(firstPayload))
    fetchMock.get(`/bar/foo`, JSON.stringify(secondPayload))

    const wrapper =
      shallow(
        <ComponentWithFetchLoader
          host={`foo/`}
          resource={`bar`}
        />)

    expect(wrapper).toHaveState({ isLoading: true, data: null })
    await wrapper.instance().componentDidMount()
    expect(wrapper).toHaveState({ isLoading: false, data: firstPayload })

    wrapper.setProps({ host:`bar/`, resource: `foo`})
    expect(wrapper).toHaveState({ isLoading: true, data: null })
    await wrapper.instance().componentDidMount()
    expect(wrapper).toHaveState({ isLoading: false, data: secondPayload })
  })
})
