import { Fragment } from "react";
import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import 'react-toastify/dist/ReactToastify.css';

// components
import LoginForm from "./components/LoginPages/LoginForm";
import Registration from "./components/LoginPages/Registration";
import Dashboard from './components/dashboard/Dashboard';
import AboutUs from "./components/AboutUs";

// Page roots
const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginForm />,
  },
  {
    path: "/signup",
    element: <Registration />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />
  },
  {
    path: "/aboutUs",
    element: <AboutUs/>
  }
]);

function App() {
  return (
    <Fragment>
      <RouterProvider router={router} />
    </Fragment>
  );
}

export default App;
