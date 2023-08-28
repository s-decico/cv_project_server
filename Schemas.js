const mongoose = require("mongoose");

const BasicDetailsSchema = new mongoose.Schema({
  fullname: String,
  email: String,
  phno: String,
  address: String,
  github: String,
  linkedin: String,
});

const workExperienceSchema = new mongoose.Schema({
  companyname: String,
  designation: String,
  details: [String],
  startdate: String,
  enddate: String,
});

const educationSchema = new mongoose.Schema({
  qualification: String,
  school: String,
  doj: String,
});

const projectSchema = new mongoose.Schema({
  projectname: String,
  projectyear: String,
  details: [String],
  projectlink: String,
});

const achievementSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
});

const userSchema = new mongoose.Schema({
  BasicDetails: BasicDetailsSchema,
  WorkExperience: [workExperienceSchema],
  Education: [educationSchema],
  Project: [projectSchema],
  Achievement: [achievementSchema],
  Language: [String],
  Interest: [String],
  Skills: [String],
  UserID: String,
});

const UserDetails = mongoose.model("UserDetails", userSchema);

const userCredSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const UserCred = mongoose.model("UserCred", userCredSchema);
module.exports = { UserCred, UserDetails };
