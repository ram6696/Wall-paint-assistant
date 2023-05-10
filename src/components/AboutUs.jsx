import React from 'react';
import backgroundImg from './LoginPages/background_image.jpg';
import { useNavigate } from "react-router-dom";

const AboutUs = () => {
  const navigate = useNavigate();

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

      <div style={{ 
        "max-width": "40%",
        "text-align": "-webkit-match-parent",
        "margin-right": "auto",
        "margin-left": "5%"
      }}>
        <h1> Welcome to Digital Painting Assistant </h1>
        <p></p>
        <br/>
        <h1>About Us</h1>
        <p>
          Digital Colour Assistance is a web application built by final year Computer Science Engineering students of Jyothy Institute of Technology.
          This application can be used by any laymen to get colour recommendation for their wall in a room. Our application, has the ability to analyze the image and also tell the room type and items present in the image.
        </p>
        <p>
          Steps you can follow:
        </p>
        <ol>
          <li>You can click an image using the camera option provided or give an input image to the application.</li>
          <li>The analyzed image will detect the wall and also provides all the items present in it.</li>
          <li>Based on the input image given, our application will recommend a colour palatte and you can plug and play with colour you wish.</li>
          <li>You have an option to download the reference image or send the image through mail.</li>
          <li>You can plug and play with how many recommended colours you want and you can download the reference images.</li>
        </ol>
        <div>
          <button className='upload-btn' onClick={() => navigate(`/login`, { state: { page: "login" } })}>Login</button>
          <button className='upload-btn' onClick={() => navigate(`/signup`, { state: { page: "signup" } })}>Signup</button>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
