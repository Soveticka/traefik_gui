import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Routers from './pages/Routers'
import Services from './pages/Services'
import Middlewares from './pages/Middlewares'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/routers" element={<Routers />} />
        <Route path="/services" element={<Services />} />
        <Route path="/middlewares" element={<Middlewares />} />
      </Routes>
    </Layout>
  )
}

export default App