const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { UserDetails, UserCred } = require("./Schemas");
const cookieParser = require("cookie-parser");
var jwt = require("jsonwebtoken");
var cors = require("cors");
require("dotenv").config();
const app = express();
// const request = require("request");
// const https = require("https");
// const querystring = require("querystring");

//app.use(cors());
app.use("/public", express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
app.use((err, req, res, next) => {
  console.log("Error:" + err);
});
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://resumatebys.netlify.app",
    "https://resumatebys.vercel.app",
    "https://cv-project-server.vercel.app",
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept,Authorization"
  );
  // res.setHeader("Access-Control-Expose-Headers", "set-cookie");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});
mongoose.set("debug", true);
//Database connections
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const dbConnectionURI =
  "mongodb+srv://" +
  username +
  ":" +
  password +
  "@cvdetails.igloppb.mongodb.net/Details?retryWrites=true&w=majority";

mongoose
  .connect(dbConnectionURI, { useNewUrlParser: true })
  .then(() => {
    console.log("Connected to Database");
  })
  .catch((err) => {
    console.log("Error:" + err);
  });

//Token handler functions
const secretKey = process.env.JWT_SECRET_KEY;

function generateToken(email, id) {
  const userData = {
    id: id,
    email: email,
  };
  const token = jwt.sign(userData, secretKey);
  return token;
}

const verifyToken = (token, secret) => {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    // Token verification failed
    return null;
  }
};

//Test
app.route("/").get((req, res) => {
  res.send("Hellooooo");
});
//

//API endpoints
app.route("/validatetoken").post((req, res) => {
  if (req) {
    if (req.headers.authorization?.split(" ")[1]) {
      const receivedToken = req.headers.authorization?.split(" ")[1];
      decodedToken = verifyToken(receivedToken, process.env.JWT_SECRET_KEY);
    }
    if (decodedToken) {
      res.sendStatus(200);
    } else res.sendStatus(403);
  }
});

app.route("/cvinput").post((req, res) => {
  let decodedToken = "";
  console.log("Headers:", req);
  try {
    if (req) {
      if (req.headers.authorization?.split(" ")[1]) {
        const receivedToken = req.headers.authorization?.split(" ")[1];
        console.log("Received Token:", receivedToken);
        decodedToken = verifyToken(receivedToken, process.env.JWT_SECRET_KEY);
      }
      console.log("Decoded Token", decodedToken);
      const parsedObject = req.body;
      parsedObject["UserID"] =
        decodedToken.email != null ? decodedToken.email : "";
      console.log("Updated Parsed object", parsedObject);
      if (decodedToken) {
        console.log("Inside update1:", decodedToken);
        UserDetails.findOne({ UserID: decodedToken.email })
          .then((response) => {
            // console.log(response);
            if (response) {
              console.log("Inside update");
              UserDetails.updateOne(
                { UserID: decodedToken.email },
                parsedObject
              )
                .then((result) => {
                  res.status(200).send("Okay");
                  console.log("Successfully updated existing data");
                })
                .catch((err) => {
                  console.log("Error in updateOne function:" + err);
                  res.status(500).send("Server error");
                });
            } else if (!response) {
              UserDetails.insertMany(parsedObject)
                .then(() => {
                  console.log("Data inserted successfully");
                  res.sendStatus(200);
                })
                .catch((err) => {
                  console.log("Error while inserting:" + err);
                  res.sendStatus(500);
                });
            }
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        UserDetails.insertMany(parsedObject)
          .then(() => {
            console.log("Data inserted successfully");
            res.sendStatus(200);
          })
          .catch((err) => {
            console.log("Error while inserting:" + err);
            res.sendStatus(500);
          });
      }
    } else res.send("Success");
  } catch (err) {
    console.log(err);
  }
});

app.route("/register").post((req, res) => {
  const credObj = req.body;
  UserCred.insertMany(credObj)
    .then(() => {
      console.log("Credentials stored successfully");
      res.sendStatus(200);
    })
    .catch((err) => {
      console.log("Error while inserting:" + err);
      res.sendStatus(500);
    });
});

app.route("/login").post((req, res) => {
  const { email, password } = req.body;
  UserCred.findOne({ email: email })
    .then((result) => {
      if (result) {
        if (result.password === password) {
          const token = generateToken(result.email, result._id);
          res.status(200).json({ token: token, isAuthenticated: true });
          console.log("Cookies set");
          console.log("Response sent with cookies");
        } else {
          res.status(401).json({ error: "Incorrect password" });
        }
      } else {
        res.status(404).json({ error: "User not found" });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.route("/fetchform").get((req, res) => {
  // console.log("Fetching details of form triggered...");
  // const token = req.headers.authorization?.split(" ")[1];;
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    decodedToken = verifyToken(token, process.env.JWT_SECRET_KEY);
    // console.log("Decoded Token:", decodedToken);
    UserDetails.findOne({ UserID: decodedToken.email })
      .then((result) => {
        console.log("Found User");
        res.json(result);
      })
      .catch((err) => {
        console.log("No details found:" + err);
      });
  }
});

const port =
  process.env.REACT_APP_ENVIRONMENT == "PRODUCTION" ? process.env.PORT : 3001;
app.listen(3001, () => {
  console.log("Server started at port:", port);
});
