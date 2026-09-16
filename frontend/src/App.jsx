import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

function App() {
  return (
      <BrowserRouter>
        <Navbar />
        <div style={{ padding: '2rem' }}>
          <Routes>
            <Route path="/" element={<h2>Welcome to VoltFlow: Reserve EV Charging Slots</h2>} />
            <Route path="/stations" element={<h2>Station Map Placeholder</h2>} />
            <Route path="/login" element={<h2>Login Form Placeholder</h2>} />
            <Route path="/register" element={<h2>Registration Form Placeholder</h2>} />
          </Routes>
        </div>
      </BrowserRouter>
  );
}

export default App;