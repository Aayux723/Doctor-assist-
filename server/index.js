import dotenv from "dotenv"; 
import app from "./app.js";
//start the server

dotenv.config(); // reads and configures data from env 

const PORT = process.env.PORT || 5000; //localhost5000 is decided from this 

app.listen(PORT, () => { //boots up the server 
  console.log(`Server running on port ${PORT}`);
});
