import * as React from "react";
import { FaSignOutAlt } from "react-icons/fa";
import LogOutModal from "../modal/LogoutModal";
import WebCookies from "../../components/common/Cookies/cookies";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import {Nav, Navbar} from "react-bootstrap";
import "./NavBar.css"


const NavBar = (props) => {
  const { getCurrentUser } = props;
  // state
  const [openLogoutModal, setLogoutModal] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState("");

  // toggle logout modal
  const handleLogoutClose = () => setLogoutModal(false);
  const handleLogoutopen = () => setLogoutModal(true);

  // handle loggout modal
  const logoutToggle = (data) => {
    if (data === "logout") {
      handleLogoutopen();
    } 
  };

  // Navigation hook
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate(`/`);
  };

  React.useEffect(() => {
    getUserInCookie();
  }, []);


  // get user cookies
  const getUserInCookie = () => {
    let cookie = WebCookies.GetCookie("userin");
    getCurrentUser && getCurrentUser(JSON.parse(cookie));
    setCurrentUser(JSON.parse(cookie));
  };

  // logout function
  const logOutFun = () => {
    WebCookies.RemoveCookie("userin");
    WebCookies.RemoveCookie("bidId");
    handleNavigation();
  };

  const logoutModal = (data, callBack) => {
    callBack(data);
  };

  return (
    <React.Fragment>
      <ToastContainer />
      <LogOutModal
        open={openLogoutModal}
        handleClose={handleLogoutClose}
        logOutFun={logOutFun}
      />
      <Navbar collapseOnSelect expand="lg" bg="success" variant="dark">
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav">
        <Nav className="mr-auto">
          <span style={{ color: "white", marginLeft: "50px" }}>
            Welcome, {currentUser.email}!
          </span>
        </Nav>
        <Nav className="ml-auto">
          <Nav.Link eventKey={2}>
            <span onClick={() => logoutModal("logout", logoutToggle)}>
              <abbr title="logout">
              <FaSignOutAlt
                style={{
                  color: "white",
                  width: "35px",
                  height: "25px",
                  margin: "5px",
                  cursor: "pointer",
                }}
              />
              </abbr>
            </span>
          </Nav.Link>
        </Nav>
      </Navbar.Collapse>
      </Navbar>
    </React.Fragment>
  );
   
};
export default NavBar;
