rootRoute.get("/predict-macha", async (req, res) => {
    try {
      // Load pre-trained image classification model
      const model = await imageClassification.load();
  
      // Detect the type of room in the photo
      const image = tf.node.decodeImage(fs.readFileSync(path.resolve(__dirname + '/istockphoto-1373329869-170667a.jpg')));
      const predictions = await model.classify(image);
      console.log(predictions);
      const roomType = predictions[0].className; 
      console.log('roomType', roomType);
  
      const image1 = fs.readFileSync(path.resolve(__dirname + '/istockphoto-1373329869-170667a.jpg'));
      const tensor = tf.node.decodeImage(image1);
      const resized = tf.image.resizeBilinear(tensor, [224, 224]);
      const expanded = resized.expandDims(0);
      const preprocessed = tf.div(tf.sub(expanded.toFloat(), 127.5), 127.5);
  
      // Run image through MobileNet model and get top predictions
      const predictions1 = model.infer(preprocessed, 'global_average_pooling2d');
      console.log(predictions1);
      const top5 = Array.from(predictions1)
          .map((p, i) => ({ probability: p, className: model.getClassName(i) }))
          .sort((a, b) => b.probability - a.probability)
          .slice(0, 5);
  
      // Infer room type based on top predicted classes
      const objects = top5.map(p => p.className);
      console.log(objects);
      const roomType1 = inferRoomType(objects);
  
      console.log(`Detected objects: ${objects.join(', ')}`);
      console.log(`Inferred room type: ${roomType1}`);
  
      const [result] = await client.imageProperties(path.resolve(__dirname + '/istockphoto-1373329869-170667a.jpg'));
  
      console.log(JSON.stringify(result.imagePropertiesAnnotation));
  
      console.log(JSON.stringify(result.cropHintsAnnotation));
  
      const color = result.imagePropertiesAnnotation.dominantColors.colors[0].color;
      const wallColor = {red: color.red, green: color.green, blue: color.blue};
      const colorToReplace = {red: 0, green: 0, blue: 0};
      const inputFile = path.resolve(__dirname + '/istockphoto-1373329869-170667a.jpg');
      const outputFile = path.resolve(__dirname + '/new/istockphoto-1373329869-170667a.jpg')
      const imageRequest =
          {
            image: {
              content: fs.readFileSync(inputFile).toString('base64')
            },
            features: [
              {
                type: 'IMAGE_PROPERTIES'
              },
              {
                type: 'COLOR_REPLACE',
                maxResults: 1,
                params: {
                  color: wallColor,
                  newColor: colorToReplace,
                  score: 0.6 // adjust this value to change the sensitivity of the color detection
                }
              }
            ]
          }
  
          const outputConfig = {
            outputFolder: outputFile,
            batchSize: 2, // The max number of responses to output in each JSON file
          }
  
        const request = {
          requests: [
            imageRequest, // add additional request objects here
          ]
        };
        const [result2] = await client.batchAnnotateImages(request);
        console.log(JSON.stringify(result2.responses));
        const outputContent = result2.responses[0].image;
        console.log(outputContent);
        console.log(JSON.stringify(result2.responses[0].error));
        fs.writeFileSync('output-file.jpg', JSON.stringify(result2.responses[0].error));
      console.log(`Image color replaced: ${result2}`);
  
    } catch (error) {
      console.log(error); 
    }
  
  
  });
  
  function inferRoomType(objects) {
      const objectToRoom = {
        bed: 'bedroom',
        dresser: 'bedroom',
        nightstand: 'bedroom',
        sofa: 'living room',
        armchair: 'living room',
        coffee_table: 'living room',
        dining_table: 'dining room',
        chair: 'dining room',
        refrigerator: 'kitchen',
        stove: 'kitchen',
        sink: 'kitchen',
        bathtub: 'bathroom',
        toilet: 'bathroom',
        shower: 'bathroom'
      };
      const rooms = objects.map(obj => objectToRoom[obj]).filter(room => room);
      if (rooms.length === 0) {
        return 'unknown';
      }
      const roomCounts = rooms.reduce((counts, room) => {
        counts[room] = counts[room] ? counts[room] + 1 : 1;
        return counts;
      }, {});
      const mostCommonRoom = Object.keys(roomCounts).reduce((a, b) => roomCounts[a] > roomCounts[b] ? a : b);
      return mostCommonRoom;
  }