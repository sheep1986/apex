import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Campaigns } from './pages/Campaigns'
import { PhoneNumbers } from './pages/PhoneNumbers'
import { Login } from './pages/Login'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-950 text-white">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="phone-numbers" element={<PhoneNumbers />} />
          </Route>
        </Routes>
      </div>
    </Router>
  )
}

export default App
