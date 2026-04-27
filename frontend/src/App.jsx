import {BrowserRouter as Router, Routes, Route  } from "react-router-dom";
import Homepage from './pages/Homepage'
import Loginpage from './pages/LoginPage'
import adminDashboard from './pages/adminDashboard'

const App = () => {
  return (
    <>
  <Router>
    <Routes>
      <Route path="/" element={<Homepage />} />
       <Route path="/login" element={<Loginpage />} />
       <Route path="/admin-dashboard" element={<adminDashboard />} />
    </Routes>
  </Router>
    </>
  )
}

export default App