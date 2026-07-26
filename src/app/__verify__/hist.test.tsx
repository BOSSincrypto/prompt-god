// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { render, act } from '@testing-library/react'
import { RouterProvider, useNavigate, useRouter } from '../router.tsx'

let nav: (to: string, o?: { replace?: boolean }) => void
function Probe() {
  nav = useNavigate()
  const { path, search } = useRouter()
  return <div data-testid="loc">{path + (search.toString() ? '?' + search.toString() : '')}</div>
}

describe('history churn', () => {
  it('open/close pushes two entries', async () => {
    window.history.replaceState(null, '', '/patterns')
    const start = window.history.length
    const { getByTestId } = render(
      <RouterProvider patterns={['/patterns']}><Probe /></RouterProvider>,
    )
    await act(async () => nav('/patterns?p=a'))
    expect(getByTestId('loc').textContent).toBe('/patterns?p=a')
    await act(async () => nav('/patterns'))
    expect(getByTestId('loc').textContent).toBe('/patterns')
    await act(async () => nav('/patterns?p=b'))
    await act(async () => nav('/patterns'))
    console.log('history delta =', window.history.length - start)
    expect(window.history.length - start).toBe(4)

    // back should land on ?p=b (drawer re-open)
    await act(async () => { window.history.back(); await new Promise(r => setTimeout(r, 30)) })
    console.log('after back:', window.location.pathname + window.location.search, '| rendered:', getByTestId('loc').textContent)
  })
})
