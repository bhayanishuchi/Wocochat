const express = require('express');
const router = express.Router();
const usercontroller = require("./../../app/controllers/usercontroller");
const appConfig = require("./../../config/appConfig");

const middleware = require('../middlewares/auth');

module.exports.setRouter = (app) => {

  // defining routes.
  app.post('/user', [usercontroller.createUser]);

  app.post('/user/login', [usercontroller.loginUser]);

  app.get('/user/logout/:userName', [usercontroller.logout]);

  app.post('/user/createcontact', middleware.isAuthorize, [usercontroller.createcontact]);

  app.get('/user/contactbook/:userId', middleware.isAuthorize, middleware.joinRoom, [usercontroller.contactbook]);

  app.get('/user/chat/users/:userId', middleware.isAuthorize, [usercontroller.allUsers]);

  app.get('/user/chat/messages/:userName/:toName', middleware.isAuthorize, [usercontroller.userMessage]);

  app.post('/user/chat/sendmessages', middleware.isAuthorize, [usercontroller.sendMessage]);

};
