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
const AppResponse = require("./services/AppResponse");
const FormData = require('form-data');


const app = express();
app.use(cors());
app.use(bodyParser.json({limit: '50mb'}))
app.use(cors({ origin: '*' }));
require("./configs/mongoDB");

const modifyImage = async (image, wallBoundingBoxes, excludedBoundingBoxes, color) => {
    try {
        const {r, g, b, a} = color;
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

const base64ToBuffer = (base64, contentType = '') => {
  const binaryString = Buffer.from(base64, 'base64');
  return binaryString;
};

app.post('/get-image-info', async (req, res) => {
    try {
      const image = req.body.image;
      const body = {
        image: {
          base64: image.base64.split('data:image/jpeg;base64,')[1]
        }
      };
      const darwinConfig = {
        url: 'https://darwin.v7labs.com/ai/models/e59b93fa-27df-4f29-b2ad-b46ce8cf5312/infer',
        headers: {
          Authorization: `ApiKey jpb9cqv.T5HDUo7NCal04gPZ46QOyJxk_zTEirH0`,
          'Content-Type': 'application/json'
        },
        data: JSON.stringify(body),
        method: 'POST'
      }

      const itemsToIgnoreForColoring = ['sofa', 'window', 'bed', 'bedlamp', 'chair', 'tv']

      const roboFlowImageProcessResponse = await axios.request(darwinConfig);
      const roboFlowAnnotations = roboFlowImageProcessResponse.data.result;
      const walls = roboFlowAnnotations.filter(annotation => annotation.label === 'wall');
      const wallBoundingBoxes = walls.map(wall => wall.bounding_box);
      const otherItems =  roboFlowAnnotations.filter(annotation => itemsToIgnoreForColoring.includes(annotation.label));
      const excludeBoundingBoxes = otherItems.map(wall => wall.bounding_box);
      const itemsInRoom = roboFlowAnnotations.filter((value, index, self) => {
        return self.findIndex(v => v.label === value.label) === index;
      }).map(item => item.label);

      // const formData = new FormData();
      // const imageBuffer = base64ToBuffer(body.image.base64, 'image/jpeg'); // Replace 'image/jpeg' with the correct MIME type for your image
      // formData.append('file', imageBuffer, 'image_filename.ext');
      // const roboFlowConfig = {
      //   maxBodyLength: Infinity,
      //   url: 'https://detect.roboflow.com/digital-colour-assistant/4?api_key=Yf2HiibluB4exKtFbhsG&confidence=40&overlap=30&format=json',
      //   headers: {
      //     ...formData.getHeaders(),
      //   },
      //   data: formData,
      //   method: 'POST',
      // // }
      // // get the predictions from the new model
      // const newImageProcessResponse = await axios.request(roboFlowConfig);
      // // console.log(JSON.stringify(newImageProcessResponse.data));
      // const annotations = newImageProcessResponse.data.predictions;
      // const walls = annotations.filter(annotation => annotation.class === 'wall');
      // const wallBoundingBoxes = walls.map(wall => {return {x: wall.x, y: wall.y, w: wall.width, h: wall.height }});
      // const otherItems =  annotations.filter(annotation => annotation.class !== 'wall');
      // const excludeBoundingBoxes = otherItems.map(wall => {return {x: wall.x, y: wall.y, w: wall.width, h: wall.height }});
      // const itemsInRoom = annotations.filter((value, index, self) => {
      //   return self.findIndex(v => v.class === value.class) === index;
      // }).map(item => item.class);

      const roomType = getRoomType(itemsInRoom);

      // get the room type according to the items in the room
      const recommendedColors = await recommendColorPalettes(image.base64.split('data:image/jpeg;base64,')[1]);
      res.status(200).send({
        itemsInRoom,
        wallBoundingBoxes,
        excludeBoundingBoxes,
        recommendedColors,
        roomType,
      })
    } catch (error) {
        console.log(error);
        res.status(500).send('Error processing image');
    }
});

function getRoomType(itemsInRoom) {
  const roomType = {
    'living room': ["sofa", "tv", "chairs", "wallframe"],
    'kitchen': ["chimney", "stove", "cupboards", "kitchencubboard"],
    'bedroom': ['bed light', 'bed', "wallframe"],
    'bathroom': ['sink', 'bathtub']
  };

  let maxScore = 0;
  let bestMatch = 'unknown';

  for (const [type, items] of Object.entries(roomType)) {
    const score = items.reduce((acc, item) => acc + (itemsInRoom.includes(item) ? 1 : 0), 0);
    
    if (score > maxScore) {
      maxScore = score;
      bestMatch = type;
    }
  }

  return bestMatch;
}

app.post("/send-email", async (req, res) => {
  try {
    const payload = req.body;
    console.log(payload.to, 'to email address');
    const base64 = Buffer.from(payload.image).toString('base64');

    const url = 'https://api.sendgrid.com/v3/mail/send';
        const options = {
            headers: {
                'content-type': 'application/json',
                'authorization': 'Bearer' + ' ' + process.env.SENDGRID_KEY,
            },
        };

        const data = {
            personalizations: [
                {
                    to: [
                        {
                            email: payload.to,
                        },
                    ],
                    subject: "AI Painting download Image",
                },
            ],
            from: {
                email: 'noreply@wfglobal.org',
                name: 'AI painting',
            },
            content: [
              {
                type: 'text/html',
                value: '<p>Hello </p><p>Attaching your ai painting image in this email</p>'
              },
            ],
            attachments: [
              {
                content: base64,
                filename: 'ai-paint-recommended.jpeg',
                type: 'image/jpeg',
                disposition: 'attachment'
              }
            ]
        };
        return axios.post(url, data, options);
  } catch (error) {
    //  console.log(error);
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

// accept image in base64 format -> gives back what color are ther in image
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
    console.log(baseColor, 'baseColor');
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
