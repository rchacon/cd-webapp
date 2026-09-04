import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { navigate } from '../lib/router'

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

// An <a> that does a client-side transition on a plain left-click while
// leaving modified clicks (new tab/window, download) and middle-click to
// the browser's real navigation -- so links stay copy/pasteable,
// bookmarkable, and open-in-new-tab-able.
export function RouterLink({ href, onClick, ...rest }: Props) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e)
    if (e.defaultPrevented) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    navigate(href)
  }
  return <a href={href} onClick={handleClick} {...rest} />
}
