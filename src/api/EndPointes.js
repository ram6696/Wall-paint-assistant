const REACT_APP_API_URL = "http://localhost:3001";

const appApi = (path) => `${REACT_APP_API_URL}/${path}`;

// API call routes
export const endpoints = () => ({
  // User API Routes
  userAPI: appApi("users"),
  userLogin: appApi("login"),
  productAPI: appApi("v1/products"),
  walletAPI: appApi("v1/users"),
  bidAPI: appApi("v2/userProductBidding"),
  resetPasswordAPI: appApi("v1/users/reset-password"),
  userComplaintAPI: appApi("v1/users/random/complaints"),
});
