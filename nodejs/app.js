const express = require('express');
const Jimp = require('jimp');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const axios = require('axios');
const chroma = require("chroma-js");
const sharp = require("sharp");
const Vibrant = require("node-vibrant");
const namer = require("color-namer");
const UserModel = require("./models/Users");

const app = express();
app.use(cors());
app.use(bodyParser.json({limit: '50mb'}))
app.use(cors({ origin: '*' }));

const modifyImage = async (image, wallBoundingBoxes, excludedBoundingBoxes, color) => {
    try {
        const {r, g, b, a} = color;
        console.log(color);
        const imageBuffer = Buffer.from(image.data);

        const imageRead = await Jimp.read(imageBuffer);
    
        function isWithinExcludedBoundingBoxes(col, row) {
          return excludedBoundingBoxes.some(({ x, y, w, h }) => {
            return col >= x && col < x + w && row >= y && row < y + h;
          });
        }
    
        wallBoundingBoxes.forEach(({ x, y, w, h }) => {
          const x2 = x + w;
          const y2 = y + h;
      
          for (let row = y; row < y2; row++) {
            for (let col = x; col < x2; col++) {
              if(!isWithinExcludedBoundingBoxes(col, row)){
                imageRead.setPixelColor(Jimp.rgbaToInt(r, g, b, a), col, row);
              }
            }
          }
        });
      
        const modifiedImageBuffer = await imageRead.getBufferAsync(Jimp.AUTO);
        console.log('modifiedImageBuffer', modifiedImageBuffer);
        // fs.writeFileSync('../public/output.jpg', modifiedImageBuffer);
        return modifiedImageBuffer;
      } catch (error) {
        console.log(error, 'changeWallColor');
      }
};

app.post('/upload', async (req, res) => {
  try {
    console.log(req.body);
    const { wallBoundingBoxes, excludedBoundingBoxes, color, image} = req.body;
    const modifiedImageBuffer = await modifyImage(image, wallBoundingBoxes, excludedBoundingBoxes, color);
    res.send({
        modifiedImageBuffer
    });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).send('Error processing image');
  }
});

app.post('/get-image-info', async (req, res) => {
    try {
      const image = req.body.image;
      const body = {
        image: {
          base64: image.base64.split('data:image/jpeg;base64,')[1]
        }
      };
      const darwinConfig = {
        url: 'https://darwin.v7labs.com/ai/models/fbf57212-1945-43d0-8bd9-ea0a95130d7d/infer',
        headers: {
          Authorization: `ApiKey fCnVhGG.av8ENqYZDpsEagzSsXWAufrnmVx3QyvI`,
          'Content-Type': 'application/json'
        },
        data: JSON.stringify(body),
        method: 'POST'
      }
      // get the predictions from the new model
      const newImageProcessResponse = await axios.request(darwinConfig);
      const annotations = newImageProcessResponse.data.result;
      const walls = annotations.filter(annotation => annotation.label === 'walls');
      const wallBoundingBoxes = walls.map(wall => wall.bounding_box);
      const otherItems =  annotations.filter(annotation => annotation.label !== 'walls');
      const excludeBoundingBoxes = otherItems.map(wall => wall.bounding_box);
      const itemsInRoom = annotations.filter((value, index, self) => {
        return self.findIndex(v => v.label === value.label) === index;
      }).map(item => item.label);

      // get the recommended colors according to the colors in the room

      const finalColors = []
      // get the room type according to the items in the room
      const recommendedColors = await recommendColorPalettes(image.base64.split('data:image/jpeg;base64,')[1]);
      res.status(200).send({
        itemsInRoom,
        wallBoundingBoxes,
        excludeBoundingBoxes,
        recommendedColors
      })
    } catch (error) {
        console.log(error);
        res.status(500).send('Error processing image');
    }
})

app.post("/users", async (req, res) => {
  try {
    const payload = req.body.user;
    const user = await UserModel.create(payload);
    return AppResponse.success(res, user);
  } catch (error) {
    if(error.message.includes('E11000 duplicate key error collection')) {
      return AppResponse.conflict(
        res,
        'User with email already exists',
        error.message
      )
    } else if (error.name = 'ValidationError') {
      return AppResponse.badRequest(
        res,
        'Invalid Payload',
        error.message
      )
    } else {
      return AppResponse.error(
        res,
        'INTERNAL SERVER ERROR',
        error.message
      )
    }
  }
});

app.post("/login", async (req, res) => {
  try {
    const user = req.body.user;
    if(!user.email || !user.password) {
      return AppResponse.badRequest(
        res,
        'MISSING_REQUIRED_FIELDS',
        'MISSING_REQUIRED_FIELDS' 
      )
    }
    // check if the user present and compare the password
    const userDetails = await UserModel.findOne({email: user.email});
    if(!userDetails) {
      return AppResponse.notFound(
        res,
        'USER NOT FOUND',
        'USER NOT FOUND' 
      )
    } else if (userDetails.password !== user.password) {
      return AppResponse.badRequest(
        res,
        'INVALID_PASSWORD',
        'INVALID_PASSWORD' 
      )
    }
    return AppResponse.success(res, {user: userDetails});
  } catch (error) {
    return AppResponse.error(
      res,
      'INTERNAL SERVER ERROR',
      error.message
    )
  }
});


const getImageColors = async (base64Image, numColors = 5) => {
  const buffer = Buffer.from(base64Image, "base64");

  const palette = await Vibrant.from(buffer).maxColorCount(numColors).getPalette();
  return Object.values(palette).map((color) => color.getRgb());
};

const rgbaToObject = (rgbaArray) => {
  return {
    r: rgbaArray[0],
    g: rgbaArray[1],
    b: rgbaArray[2],
    a: rgbaArray[3],
  };
};

const generateColorPalette = (color) => {
  const baseColor = chroma(color);
  const colors = [baseColor];

  for (let i = 1; i <= 4; i++) {
    colors.push(baseColor.brighten(i));
    colors.push(baseColor.darken(i));
  }

  return colors.map((color) => ({
    hex: color.hex(),
    name: getColorName(color),
    ...rgbaToObject(color.rgba()),
  }));;
};

const getColorName = (color) => {
  const hexColor = chroma(color).hex();
  const names = namer(hexColor);
  return names.ntc[0].name;
};

const recommendColorPalettes = async (base64Image) => {
  const imageColors = await getImageColors(base64Image);

  return imageColors.map((color) => {
    const baseColor = chroma(color);
    return {
      baseColor: {
        hex: baseColor.hex(),
        name: getColorName(baseColor),
        ...rgbaToObject(baseColor.rgba())
      },
      palette: generateColorPalette(color),
    };
  });
};



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});