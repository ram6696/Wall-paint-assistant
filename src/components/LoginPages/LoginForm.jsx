import React, { Fragment, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  FormControl,
  FormGroup,
  FormLabel,
  Row,
} from "react-bootstrap";
import CardHeader from "react-bootstrap/esm/CardHeader";
import { Form, useNavigate } from "react-router-dom";
import WebCookies from "../../components/common/Cookies/cookies";
import LoginApi from "./LoginApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import backgroundImg from '../LoginPages/background_image.jpg';


const LoginForm = () => {
  // state
  let [state, setState] = useState({
    user: {
      email: "",
      password: "",
    },
  });

  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Navigation hook
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate(`/dashboard`, { state: { page: "dashboard" } });
  };

  // handle submit
  const handleSubmit = (event) => {
    event.preventDefault();
    LoginApi.LoginApi(state, (res) => {
      if (res && res.status === 409) {
        toast("Enter valid username or password");
        setError(true);
      } else if (res && res.status === "SUCCESS") {
        console.log(res.data);
        handleCookies(res.data.user);
      } else {
        let message =
          res && res.data ? res.data.error.message : res && res.message;
        toast(message);
        setErrorMessage(res && res.data.error.message);
        setError(true);
      }
    });
  };

  // Handle input fields
  let changeInput = (event) => {
    setState((state) => ({
      user: {
        ...state.user,
        [event.target.name]: event.target.value,
      },
    }));
  };

  // loggin uers the cookies
  const handleCookies = (data) => {
    let userData = data;
    WebCookies.RemoveCookie("userin");
    WebCookies.SetCookie("userin", JSON.stringify(userData));
    handleNavigation();
  };

  return (
    <div style={{
      backgroundImage: `url(${backgroundImg})`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
    <Fragment>
      <ToastContainer />
      {/* <Row className="bg-success text-center text-white p-3 border rounded">
        <Col className="d-flex align-items-center justify-content-left">
          <h3>Digital Colour Assistant</h3>
        </Col>
        <Col className="d-flex align-items-center justify-content-end">
          <button
            type="button"
            className="btn btn-link"
            onClick={() => navigate(`/aboutUs`, { state: { page: "dashboard" } })}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ccc',
              borderRadius: '0.25rem',
              backgroundColor: '#fff',
              color: '#007bff',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
            }}
          >
          About Us
          </button>
        </Col>
      </Row> */}
        <Container className="mt-5">
          <Row className="justify-content-center">
            <Col sm md={8} lg={6}>
              <Form onSubmit={handleSubmit}>
                <Card className="card">
                  <CardHeader className="text-center text-white bg-success">
                    <h4>Login Here</h4>
                  </CardHeader>
                  <Card.Body className="justify-content-center">
                    <FormGroup controlId="email" className="mb-3">
                      <FormLabel>Email *</FormLabel>
                      <FormControl
                        name="email"
                        type="email"
                        placeholder="User name"
                        required
                        pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}"
                        onChange={changeInput}
                      />
                    </FormGroup>
                    <FormGroup className="mb-3" controlId="password">
                      <FormLabel>Password *</FormLabel>
                      <FormControl
                        name="password"
                        type="password"
                        placeholder="Password"
                        required
                        onChange={changeInput}
                      />
                      <span className="text-danger">
                        {error ? errorMessage : ""}
                      </span>
                    </FormGroup>
                  </Card.Body>
                  <Card.Footer className="d-flex justify-content-evenly text-center">
                    <Button size="sm" type="submit" variant="success">
                      Login
                    </Button>
                    <span className="ml-6">
                      Don't have an account? <a href="/signup"> Signup</a>
                    </span>
                  </Card.Footer>
                </Card>
              </Form>
            </Col>
          </Row>
        </Container>
    </Fragment>
    </div>
  );
};

export default LoginForm;
