// admin-frontend/src/App.js
import { BrowserRouter } from 'react-router-dom';
import AdminRoutes from './routes/AdminRoutes';
import './styles/Global.css';

function App() {
  return (
    <BrowserRouter>
      <AdminRoutes />
    </BrowserRouter>
  );
}

export default App;