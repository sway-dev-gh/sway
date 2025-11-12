import Sidebar from './Sidebar'
import './Layout.css'

export default function Layout({ children }) {
  return <Sidebar>{children}</Sidebar>
}
