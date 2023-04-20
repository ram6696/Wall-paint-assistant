const mongoose = require("mongoose");
require("dotenv").config();
mongoose.set("strictQuery", false);

mongoose
  .connect('mongodb+srv://somugowda:somugowda67@cluster0.nlpzbkn.mongodb.net/aiPainting', {
    usenewurlparser: true,
    useunifiedtopology: true,
  })
  .then(() => {
    console.log("Successfully db connected ");
  })
  .catch((error) => {
    console.log(`can not connect to database, ${error}`);
  });

module.exports = mongoose;
