const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const UserModel = require("./UserModel");
const otpModel = require("./OtpModel");
const nodemailer = require("nodemailer");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const ChildModel = require("./childModels/ChildModel");
const cloudinary = require("./utils/cloudinary");
const RegisterVerification = require("./Gmail");

const RegisterUser = async (req, res) => {
  try {
    const { email, password, firstname, lastname } = req.body;
    const user = await UserModel.findOne({ email });
    if (user) {
      res.status(400).json({ message: "Email Already Used" });
    } else {
      const OTP = otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });

      RegisterVerification(email, OTP);

      console.log(OTP);

      const otp = new otpModel({
        otp: OTP,
        email: req.body.email,
      });

      const salt = await bcrypt.genSalt(10);
      otp.otp = await bcrypt.hash(otp.otp, salt);

      const result = await otp.save();

      res.status(201).json({ message: "Check your Mail for Verification" });
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const VerifyOTP = async (req, res) => {
  try {
    const { email, password, firstname, lastname, otp } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const otpHolder = await otpModel.find({ email });
    if (otpHolder.length === 0) {
      res.status(400).send("You use an expired OTP");
    } else {
      const rightOtpFind = otpHolder[otpHolder.length - 1];
      const validUser = await bcrypt.compare(otp, rightOtpFind.otp);
      if (validUser) {
        const user = await UserModel.create({
          email,
          password: hash,
          firstname,
          lastname,
        });
        const token = user.generateJWT();
        const result = await user.save();
        const OTPDelete = await otpModel.deleteMany({
          email: rightOtpFind.email,
        });
        return res.status(200).json({
          message: "User Regisered successfully",
          data: { token: token, data: result },
        });
      } else {
        res.status(400).send("Invalid OTP");
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const LoginUsers = async (req, res) => {
  try {
    const { email, password } = req.body;
    const findUser = await UserModel.findOne({ email: email });
    if (!findUser) {
      res.status(400).json({ message: "User Does not Exist" });
    } else {
      const checkPassword = await bcrypt.compare(password, findUser.password);
      if (!checkPassword) {
        res.status(400).json({ message: "Incorrect Password" });
      } else {
        const OTP = otpGenerator.generate(6, {
          digits: true,
          lowerCaseAlphabets: false,
          upperCaseAlphabets: false,
          specialChars: false,
        });

        RegisterVerification(email, OTP);

        console.log(OTP);

        const otp = new otpModel({
          otp: OTP,
          email: req.body.email,
        });

        const salt = await bcrypt.genSalt(10);
        otp.otp = await bcrypt.hash(otp.otp, salt);

        const result = await otp.save();

        res.status(201).send("Check your mail for verification");
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const VerifyOTPForLogin = async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    const otpHolder = await otpModel.find({ email });
    if (otpHolder.length === 0) {
      res.status(400).send("You use an expired OTP");
    } else {
      const rightOtpFind = otpHolder[otpHolder.length - 1];
      const validUser = await bcrypt.compare(otp, rightOtpFind.otp);
      if (validUser) {
        const findUser = await UserModel.findOne({ email: email });
        if (!findUser) {
          res.status(404).json({ message: "Invalid User" });
        } else {
          const { password, ...doc } = findUser._doc;
          const token = jwt.sign(
            {
              _id: findUser._id,
              firstname: findUser.firstname,
              lastname: findUser.lastname,
              email: findUser.email,
            },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "2d" }
          );

          await otpModel.deleteMany({
            email: rightOtpFind.email,
          });

          return res.status(200).json({
            message: `Welcome back ${findUser.firstname}`,
            data: { token: token, data: { ...doc } },
          });
        }
      } else {
        res.status(400).send("Invalid OTP");
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const getAll = await UserModel.find();
    res.status(201).json({ message: "All Users", data: getAll });
  } catch (error) {}
};

const createChildAccount = async (req, res) => {
  try {
    const { firstname, lastname, dob, relationship } = req.body;

    const findUser = await UserModel.findById(req.params.id);
    if (!findUser) {
      res.status(400).json({ message: "User not found" });
    }

    const imageLink = req.file.path;
    if (!imageLink) {
      res.status(400).json({ message: "Please input your image" });
    }

    const image = await cloudinary.uploader.upload(req.file.path);

    const createChild = new ChildModel({
      firstname,
      lastname,
      dob,
      relationship,
      imageId: image.public_id,
      image: image.secure_url,
    });

    createChild.user = findUser;
    createChild.save();

    findUser.children.push(createChild);
    findUser.save();

    res.status(201).json({
      message: "Child Account Created Successfully",
      data: createChild,
    });
  } catch (error) {}
};

const populateChildInParents = async (req, res) => {
  try {
    const getSingleParent = await UserModel.findById(req.params.id)
      .populate({ path: "children", populate: { path: "transactions" } })
      .populate({ path: "children", populate: { path: "savings" } });
    res.status(201).json({ message: "Parent data", data: getSingleParent });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
//populate savings
const populateSavingsInChild = async (req, res) => {
  try {
    const getSingleChild = await ChildModel.findById(req.params.childid)
      .populate("savings")
      .populate("investments");
    res.status(201).json({ message: "Child Data", data: getSingleChild });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getOneChild = async (req, res) => {
  try {
    const childid = req.params.id;
    if (!childid) {
      res.status(400).json({ message: "User not Found, Check ID" });
    }
    const getChild = await ChildModel.findById(childid);
    res.status(201).json({ message: "One User Data", data: getChild });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const forgetPassword = async () => {
  try {
        const {email} = req.body
        const findUser = await UserModel.findOne({email})
        if(findUser){

        }else{
          res.status(400).json({message: "U"})
        }
  } catch (error) {
        res.status(400).json({ message: error.message });

  }
}

module.exports = {
  RegisterUser,
  VerifyOTP,
  LoginUsers,
  VerifyOTPForLogin,
  getAllUsers,
  createChildAccount,
  populateChildInParents,
  getOneChild,
  populateSavingsInChild,
};
