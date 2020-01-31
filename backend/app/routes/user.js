const express = require('express');
const router = express.Router();
const usercontroller = require("./../../app/controllers/usercontroller");
const appConfig = require("./../../config/appConfig");

const middleware = require('../middlewares/auth');

module.exports.setRouter = (app) => {

  // defining routes.
  app.post('/user', [usercontroller.createUser]);

  app.post('/user/login', [usercontroller.loginUser]);

  app.post('/user/createcontact', middleware.isAuthorize, [usercontroller.createcontact]);

  app.get('/user/contactbook/:userId', middleware.isAuthorize, [usercontroller.contactbook]);

  app.get('/user/chat/users/:userId', middleware.isAuthorize, [usercontroller.allUsers]);

};
