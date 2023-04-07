import React, { useState } from 'react';
import * as Jimp from 'jimp/browser/lib/jimp.js';
import { loadImage, createCanvas } from 'browser-image-manipulation';
import axios from 'axios';
import ImageRenderer from './ImageRender';
const FormData = require('form-data');


function RoomColorChanger() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modifiedImage, setModifiedImage] = useState(null);
  const [recommendedColors, setRecommendedColors] = useState([]);
  const [roomType, setRoomType] = useState(null);
  const [roomItems, setRoomItems] = useState(null);
  const [dominantColors, setDominantColors] = useState([{}]);
  const [wallBoundingBoxesState, setWallBoundingBoxes] = useState([{}]);
  const [otherItemsBoundingBoxes, setOtherItemsBoudingBoxes] = useState([{}]);
  const [] = useState([]);
  const [] = useState({})


  const handleFileInputChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      console.log(e.target.files[0]);

      const reader = new FileReader();
      reader.onloadend = async () => {
        setSelectedImage(reader.result);
        const body = {
          image: {
            base64: reader.result,
          }
        };
        const imageInfoPayload = {
          url: 'https://e607-36-255-87-126.ap.ngrok.io/get-image-info',
          headers: {
            Authorization: `ApiKey fCnVhGG.av8ENqYZDpsEagzSsXWAufrnmVx3QyvI`,
            'Content-Type': 'application/json'
          },
          body,
          data: body,
          method: 'POST'
        }
        const newImageProcessResponse = await axios.request(imageInfoPayload);
        const completeImageData = newImageProcessResponse.data;
        setWallBoundingBoxes(completeImageData.wallBoundingBoxes)  
        setOtherItemsBoudingBoxes(completeImageData.excludeBoundingBoxes)
        const itemsInRoom = completeImageData.itemsInRoom.map(item => item).join(' ,');
        setRoomItems(itemsInRoom);
        const recommendedColors = completeImageData.recommendedColors;
        console.log(recommendedColors);
        const colors = [
          { name: 'Whisper', r: 237, g: 240, b: 243, a: 1 },
          { name: 'Sea Foam', r: 203, g: 221, b: 212, a: 1 },
          { name: 'Pale Lilac', r: 225, g: 213, b: 231, a: 1 },
          { name: 'Buttercream', r: 252, g: 234, b: 187, a: 1 },
          { name: 'Apricot', r: 255, g: 203, b: 164, a: 1 },
          { name: 'Sandstone', r: 236, g: 214, b: 171, a: 1 },
          { name: 'Misty Blue', r: 186, g: 208, b: 221, a: 1 },
          { name: 'Sage', r: 183, g: 206, b: 186, a: 1 },
          { name: 'Lavender', r: 199, g: 183, b: 206, a: 1 },
          { name: 'Crimson', r: 220, g: 20, b: 60, a: 1 },
          { name: 'Emerald', r: 80, g: 200, b: 120, a: 1 },
          { name: 'Cobalt', r: 44, g: 117, b: 255, a: 1 },
        ]
        // console.log(colors);
        // setDominantColors(colors);
        setRecommendedColors(recommendedColors);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };


  const setModifiedImageUsingJimp = async (palette) => {
    console.log(palette, 'palette');
    // console.log(selectedFile.buffer);
    // Read the file as an ArrayBuffer
    const arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(selectedFile);
   });

  // Convert the ArrayBuffer to a Buffer
    const buffer = Buffer.from(arrayBuffer);

    const response = await axios('https://e607-36-255-87-126.ap.ngrok.io/upload', {
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
  
    // setModifiedImage(`../public/output.jpg`);
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

  const ColorPalette = ({ baseColor, palette }) => (
    <div style={{ marginBottom: '20px' }}>
      <h3>Base Color: {baseColor.name}</h3>
      <ColorBox color={baseColor.hex} name={baseColor.name} />
      <h4>Palette:</h4>
      <div>
        {palette.map((color, index) => (
          <ColorBox key={index} color={color.hex} name={color.name} r={color.r} g={color.g} b={color.b} a={color.a} />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <input
        type="file"
        name="file"
        accept="image/*"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        id="file-input"
      />
      <button onClick={() => document.getElementById('file-input').click()} className='upload-btn'>Select Image</button>

      {selectedImage && recommendedColors?.length && (
        <div class="parent">
          <div className='image-container'>
            <img src={selectedImage} alt="Selected room" style={{ maxWidth: '50%', height: 'auto' }} />
            {modifiedImage && (
              <ImageRenderer data={modifiedImage} />
            )}
          </div>
          <div/>
          <p>Items in the scene: {roomItems || 'Unknown'}</p>
          <p>scene predicted: {roomType || 'Unknown'}</p>
          <div>
            {recommendedColors.length && recommendedColors.map((palette, index) => (
              <ColorPalette key={index} baseColor={palette.baseColor} palette={palette.palette} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomColorChanger;
