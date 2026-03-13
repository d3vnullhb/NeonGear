import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function RouteScrollTop() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname])
  return null
}
