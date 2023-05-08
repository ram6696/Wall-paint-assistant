import React, { Fragment, useState } from 'react';
import axios from 'axios';
import ImageRenderer from './ImageRender';
import {Buffer} from 'buffer';
import NavBar from "../Layouts/NavBar";
import WebCookies from "../common/Cookies/cookies";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../common/Loder";

function RoomColorChanger() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modifiedImage, setModifiedImage] = useState(null);
  const [recommendedColors, setRecommendedColors] = useState([]);
  const [roomType, setRoomType] = useState(null);
  const [roomItems, setRoomItems] = useState(null);
  const [wallBoundingBoxesState, setWallBoundingBoxes] = useState([{}]);
  const [otherItemsBoundingBoxes, setOtherItemsBoudingBoxes] = useState([{}]);
  const [showRecommendedColors, setShowRecommendedColors] = useState(false);
  const [loading, setLoading] = useState(false);
  const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png'];
  const [paletteDropDown, setPaletteDropDown] = useState({});


  const handleShowRecommendedColors = () => {
    setShowRecommendedColors(true);
  };

  const handleFileInputChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(null);
      setModifiedImage(null);
      setRecommendedColors([]);
      setRoomType(null);
      setRoomItems(null)
      setSelectedFile(e.target.files[0]);
      setShowRecommendedColors(false);
      console.log(e.target.files[0]);

      const reader = new FileReader();
      reader.onloadend = async () => {      
        setLoading(true);
        setSelectedImage(reader.result);
        const body = {
          image: {
            base64: reader.result,
          }
        };
        const imageInfoPayload = {
          url: 'http://localhost:3001/get-image-info',
          headers: {
            Authorization: `ApiKey fCnVhGG.av8ENqYZDpsEagzSsXWAufrnmVx3QyvI`,
            'Content-Type': 'application/json'
          },
          body,
          data: body,
          method: 'POST'
        }
        const newImageProcessResponse = await axios.request(imageInfoPayload);
        setLoading(false);
        const completeImageData = newImageProcessResponse.data;
        setWallBoundingBoxes(completeImageData.wallBoundingBoxes)  
        setOtherItemsBoudingBoxes(completeImageData.excludeBoundingBoxes)
        const itemsInRoom = completeImageData.itemsInRoom.map(item => item).join(' ,');
        setRoomItems(itemsInRoom);
        setRoomType(completeImageData.roomType);
        const recommendedColors = completeImageData.recommendedColors;
        setRecommendedColors(recommendedColors);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };


  const setModifiedImageUsingJimp = async (palette) => {
    console.log(palette, 'palette');
    // Read the file as an ArrayBuffer
    const arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(selectedFile);
   });

    // Convert the ArrayBuffer to a Buffer
    const buffer = Buffer.from(arrayBuffer);

    const response = await axios('http://localhost:3001/upload', {
      method: 'POST',
      data: {
        image: buffer,
        wallBoundingBoxes: wallBoundingBoxesState,
        excludedBoundingBoxes: otherItemsBoundingBoxes,
        color: palette
      },
    });

    if (response.status !== 200) {
      throw new Error('Error uploading and processing image');
    }

    setModifiedImage(response?.data?.modifiedImageBuffer?.data);
  }


  const ColorBox = ({ color, name ,r, g, b, a}) => (
    <div
      style={{
        backgroundColor: color,
        width: '50px',
        height: '50px',
        display: 'inline-block',
        border: '1px solid black',
      }}
      title={name}
      onClick={() => setModifiedImageUsingJimp({
        r,
        g,
        b,
        a,
      })}
    />
  );

  const downloadImage = () => {
    const base = Buffer.from(new Uint8Array(modifiedImage)).toString('base64');
    console.log(base, 'base buffer');
    const base64Image = modifiedImage ? `data:image/jpeg;base64,${base}` : '';
    const link = document.createElement('a');
    link.href = base64Image;
    link.download = 'downloaded_image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const emailImage = async () => {
    
    // Convert the ArrayBuffer to a Buffer
    const buffer = Buffer.from(modifiedImage, 'base64');
    let cookie = WebCookies.GetCookie("userin");
    cookie = JSON.parse(cookie);
    console.log(cookie.email, 'cookie');
    toast('Image has been successfully sent to your email address');
    await axios('http://localhost:3001/send-email', {
      method: 'POST',
      data: {
        image: buffer,
        to: cookie.email
      },
    });
  }

  const ColorPalette = ({ baseColor, palette }) => {
    return (
      <div className="color-palette">
        <h3 onClick={() => handlePaletteDropdown(baseColor.name)}>
          Base Color: {baseColor.name}
          {paletteDropDown[baseColor.name] ? '▲' : '▼'}
        </h3>
        <ColorBox color={baseColor.hex} name={baseColor.name} />
        {paletteDropDown[baseColor.name] && (
          <div>
            <h4>Palette:</h4>
            <div>
              {palette.map((color, index) => (
                <ColorBox key={index} color={color.hex} name={color.name} r={color.r} g={color.g} b={color.b} a={color.a} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  function Banner({ text }) {
    return (
      <div style={{ background: 'orange' }}>
        <p>{text}</p>
      </div>
    );
  }

  const handlePaletteDropdown = (baseColorName) => {
    setPaletteDropDown({
        ...paletteDropDown,
        [baseColorName]: !paletteDropDown[baseColorName]
    });
  };

  return (
    <>
        <NavBar />
        <div className="main-container">
            <input
                type="file"
                name="file"
                accept={allowedFormats.join(',')}
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
                id="file-input"
            />
            <Banner text={`NOTE: Allowed file types: ${allowedFormats.join(', ')}`} />
            <button onClick={() => document.getElementById('file-input').click()} className="upload-btn">
                Select Image
            </button>

            {loading && <Loader />} 

            {selectedImage && recommendedColors?.length && (
                <div className="parent">
                    <div className="image-container">
                        <img src={selectedImage} alt="Selected room" className="preview-image" />
                        {modifiedImage && <ImageRenderer data={modifiedImage} />}
                    </div>
                    {modifiedImage && (
                        <div className="button-container">
                            <button onClick={downloadImage} className="upload-btn">
                                Download Image
                            </button>
                            <button onClick={emailImage} className="upload-btn">
                                Email Image
                            </button>
                        </div>
                    )}
                <div />
                    <p style={{ fontWeight: "800" }}><strong>ITEMS IN THE SCENE: </strong>{roomItems || 'Unknown'}</p>
                    <p><strong>SCENE PREDICTED: </strong>{roomType || 'Unknown'}</p>
                    <div className="color-palettes-container">
                        {showRecommendedColors && recommendedColors.length &&
                            recommendedColors.map((palette, index) => (
                                <ColorPalette key={index} baseColor={palette.baseColor} palette={palette.palette} />
                            ))}
                    </div>
                    <button onClick={handleShowRecommendedColors} className="upload-btn">Show Recommended Colors</button>
                </div>
            )}
        </div>
    </>
  );
}

export default RoomColorChanger;
