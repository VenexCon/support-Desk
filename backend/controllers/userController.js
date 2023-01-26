const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

//@desc   Register a new user
//@route  /api/users/
//@access Public

//generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  //validation for request
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("please include all fields");
  }

  //find is users is not unique in DB
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  //Hash password - Check mongoose docs for clarity
  //never send plain text passwords via TCP.
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  //create user
  const user = await User.create({
    name: name.trim(),
    email: email.trim(),
    password: hashedPassword, //do not forget this
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid User Data");
  }
});

//@desc   Login a new user
//@route  /api/users/Login
//@access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  //Check if user and passwords match
  if (user && (await bcrypt.compare(password, user.password))) {
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid Credentials");
  }
});

//@desc   Get current User
//@route  /api/users/me
//@access Private
const getMe = asyncHandler(async (req, res) => {
  const user = {
    id: req.user._id,
    email: req.user.email,
    name: req.user.name,
  };
  res.status(200).json(user);
});

module.exports = {
  loginUser,
  registerUser,
  getMe,
};
