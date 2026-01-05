import { BrowserRouter, Routes, Route } from "react-router-dom";//for multi-page behaviour in single-page react app
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
//protected route checks authentication of the tokens (if the current one is used)


function App() {
  //BrowserRouter->connects React app to browser's address bar 
  return (
    <BrowserRouter> 
      <Routes>
        <Route path="/login" element={<Login />} /> //Login is the react element formed 
        //A route that does not require authentication 
        //failure will lead to this path
        //A user cannot directly access Dashboard ,protected route checks it first

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />  
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

