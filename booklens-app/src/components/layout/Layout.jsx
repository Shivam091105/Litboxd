import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import PageIndicator from '../ui/PageIndicator'

export default function Layout() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)', minHeight: '100vh' }}>
        <Outlet />
      </main>
      <Footer />
      <PageIndicator />
    </>
  )
}
