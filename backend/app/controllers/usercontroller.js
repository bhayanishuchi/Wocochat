const shortid = require('shortid');
const mongoose = require('mongoose');
const response = require('./../libs/responseLib');
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib');
const tokenLib = require('../libs/tokenLib');
const Promise = require('bluebird');

const User = mongoose.model('User');
const ChatMessages = mongoose.model('ChatMessages');
const tokenCol = mongoose.model('tokenCollection');
const ContactBook = mongoose.model('ContactBook');

let createUser = (req, res) => {

  let validatingInputs = () => {
    console.log("validatingInputs");
    return new Promise((resolve, reject) => {
      if (req.body.firstName && req.body.lastName && req.body.userName && req.body.phoneNumber && req.body.password) {
        resolve();
      } else {
        let apiResponse = response.generate(true, "Required Parameter firstName, lastName, phoneNumber, userName or password is missing", 400, null);
        reject(apiResponse);
      }
    });
  }; // end of validatingInputs

  let checkUser = () => {
    console.log("checkUser");
    return new Promise((resolve, reject) => {
      User.find({userName: req.body.userName}, function (err, userDetail) {
        if (err) {
          logger.error("Internal Server error while fetching user", "createUser => checkUser()", 5);
          let apiResponse = response.generate(true, err, 500, null);
          reject(apiResponse);
        } else if (check.isEmpty(userDetail)) {
          resolve();
        } else {
          logger.error("User Already Exists", "createUser => checkUser()", 5);
          let apiResponse = response.generate(true, "User Already Exists with this userName", 401, null);
          reject(apiResponse);
        }
      })
    });
  }; // end of checkUser

  let addUser = (customerDetail) => {
    console.log("addUser");
    return new Promise((resolve, reject) => {
      let body = {
        user_id: shortid.generate(),
        userName: req.body.userName,
        phoneNumber: req.body.phoneNumber,
        firstName: (req.body.firstName) ? (req.body.firstName) : '',
        lastName: (req.body.lastName) ? (req.body.lastName) : '',
      };
      if (req.body.password) {
        body['password'] = req.body.password;
      }
      User.create(body, function (err, user) {
        if (err) {
          logger.error("Internal Server error while create User", "createUser => addUser()", 5);
          let apiResponse = response.generate(true, err, 500, null);
          reject(apiResponse);
        } else {
          resolve(user);
        }
      })
    });
  }; // end of addUser

  validatingInputs()
    .then(checkUser)
    .then(addUser)
    .then((resolve) => {
      res.status(200).send(resolve);
    })
    .catch((err) => {
      console.log(err);
      res.status(err.status).send(err);
    });
};

let loginUser = (req, res) => {

  let validatingInputs = () => {
    console.log("validatingInputs");
    return new Promise((resolve, reject) => {
      if (req.body.userName && req.body.password) {
        resolve();
      } else {
        let apiResponse = response.generate(true, "Required Parameter userName or customername or password is missing", 400, null);
        reject(apiResponse);
      }
    });
  }; // end of validatingInputs

  let checkUser = (customerData) => {
    console.log("checkUser");
    return new Promise((resolve, reject) => {
      User.findOne({userName: req.body.userName}, function (err, userDetail) {
        if (err) {
          logger.error("Internal Server error while fetching user", "loginUser => checkUser()", 5);
          let apiResponse = response.generate(true, err, 500, null);
          reject(apiResponse);
        } else if (check.isEmpty(userDetail)) {
          logger.error("User does not Exists", "loginUser => checkUser()", 5);
          let apiResponse = response.generate(true, "User does not Exists", 401, null);
          reject(apiResponse);
        } else {
          if (userDetail.password && userDetail.password !== '' && userDetail.password !== null) {
            Promise.all([pwdMatch(userDetail)])
              .then((data) => {
                resolve({user: userDetail, password: true, tokens: data[0]});
              })
              .catch((e) => {
                reject(e);
              })
          } else {
            console.log('else data');
            resolve({user: userDetail, customer: customerData, password: false, tokens: {}});
          }
        }
      })
    });
  }; // end of checkUser

  let pwdMatch = (userDetails) => {
    console.log("pwdMatch");
    return new Promise((resolve, reject) => {
      let password = req.body.password
      userDetails.comparePassword(password, function (err, match) {
        if (err) {
          logger.error("Internal Server Error while compare password", "loginUser => pwdMatch()", 5);
          let apiResponse = response.generate(true, "Internal Server Error while compare password", 500, null);
          reject(apiResponse);
        } else {
          if (match === true) {
            generateToken(userDetails)
              .then((finaltokens) => {
                resolve(finaltokens);
              })
              .catch((e) => {
                reject(e)
              })

          } else {
            logger.error("Wrong Password", "loginUser => pwdMatch()", 5);
            let apiResponse = response.generate(true, "Wrong Password", 401, null);
            reject(apiResponse);
          }
        }
      });
    });
  }; // end of pwdMatch function

  let generateToken = (user) => {
    console.log("generateToken");
    return new Promise((resolve, reject) => {
      tokenLib.generateToken(user, (err, tokenDetails) => {
        if (err) {
          logger.error("Failed to generate token", "userController => generateToken()", 10);
          let apiResponse = response.generate(true, "Failed to generate token", 500, null);
          reject(apiResponse);
        } else {
          let finalObject = user.toObject();
          delete finalObject.__v;
          tokenDetails.userId = user._id
          tokenDetails.userDetails = finalObject;
          saveToken(tokenDetails)
            .then((savetokenres) => {
              resolve(savetokenres);
            })
            .catch((e) => {
              reject(e)
            })
        }
      });
    });
  }; // end of generateToken

  let saveToken = (tokenDetails) => {
    console.log("saveToken");
    return new Promise((resolve, reject) => {
      tokenCol.findOne({userId: tokenDetails.userId})
        .exec((err, retrieveTokenDetails) => {
          if (err) {
            let apiResponse = response.generate(true, "Failed to save token", 500, null);
            reject(apiResponse);
          } else if (check.isEmpty(retrieveTokenDetails)) {
            let newAuthToken = new tokenCol({
              userId: tokenDetails.userId,
              authToken: tokenDetails.token,
              // we are storing this is due to we might change this from 15 days
              tokenSecret: tokenDetails.tokenSecret,
              tokenGenerationTime: new Date().getTime()
            });

            newAuthToken.save((err, newTokenDetails) => {
              if (err) {
                let apiResponse = response.generate(true, "Failed to save token", 500, null);
                reject(apiResponse);
              } else {
                let responseBody = {
                  authToken: newTokenDetails.authToken,
                };
                resolve(responseBody);
              }
            });
          } else {
            retrieveTokenDetails.authToken = tokenDetails.token;
            retrieveTokenDetails.tokenSecret = tokenDetails.tokenSecret;
            retrieveTokenDetails.tokenGenerationTime = new Date().getTime();
            retrieveTokenDetails.save((err, newTokenDetails) => {
              if (err) {
                let apiResponse = response.generate(true, "Failed to save token", 500, null);
                reject(apiResponse);
              } else {
                delete tokenDetails._id;
                delete tokenDetails.__v;
                let responseBody = {
                  authToken: newTokenDetails.authToken,
                };
                resolve(responseBody);
              }
            });
          }
        });
    });

  }; // end of saveToken

  validatingInputs()
    .then(checkUser)
    .then((resolve) => {
      res.status(200).send(resolve);
    })
    .catch((err) => {
      console.log(err);
      res.status(err.status).send(err);
    });
};

let createcontact = (req, res) => {

  let validatingInputs = () => {
    console.log("validatingInputs");
    return new Promise((resolve, reject) => {
      if (req.body.userId && req.body.phoneNumber) {
        resolve();
      } else {
        let apiResponse = response.generate(true, "Required Parameter phoneNumber, userId is missing", 400, null);
        reject(apiResponse);
      }
    });
  }; // end of validatingInputs

  let checkUser = () => {
    console.log("checkUser");
    return new Promise((resolve, reject) => {
      User.find({user_id: req.body.userId}, function (err, userDetail) {
        if (err) {
          logger.error("Internal Server error while fetching user", "createcontact => checkUser()", 5);
          let apiResponse = response.generate(true, err, 500, null);
          reject(apiResponse);
        } else if (check.isEmpty(userDetail)) {
          logger.error("User does not Exists", "createcontact => checkUser()", 5);
          let apiResponse = response.generate(true, "User does not Exists with this userName", 401, null);
          reject(apiResponse);
        } else {
          resolve();
        }
      })
    });
  }; // end of checkUser

  let addContact = () => {
    console.log("addContact");
    return new Promise((resolve, reject) => {
      let body = {
        contact_id: shortid.generate(),
        user_id: req.body.userId,
        phoneNumber: req.body.phoneNumber,
        firstName: (req.body.firstName) ? (req.body.firstName) : '',
        lastName: (req.body.lastName) ? (req.body.lastName) : '',
      };
      if (req.body.password) {
        body['password'] = req.body.password;
      }
      ContactBook.find({userId: req.body.userId}, function (err, ContactBookData) {
        if (err) {
          logger.error("Internal Server error while create User", "createcontact => addContact()", 5);
          let apiResponse = response.generate(true, err, 500, null);
          reject(apiResponse);
        } else if (check.isEmpty(ContactBookData)) {
          let body = {
            contact_id: shortid.generate(),
            userId: req.body.userId,
            numbers: [req.body.phoneNumber]
          };
          ContactBook.create(body, function (err, ContactBookData) {
            if (err) {
              logger.error("Internal Server error while create contact", "createcontact => addContact()", 5);
              let apiResponse = response.generate(true, err, 500, null);
              reject(apiResponse);
            } else {
              resolve(ContactBookData);
            }
          })
        } else {
          if (ContactBookData[0].numbers.includes(req.body.phoneNumber)) {
            let apiResponse = response.generate(true, "This number already register under you", 400, null);
            reject(apiResponse);
          } else {
            ContactBookData[0].numbers.push(req.body.phoneNumber);
            resolve(ContactBookData[0].save());
          }
        }
      })
    });
  }; // end of addUser

  validatingInputs()
    .then(checkUser)
    .then(addContact)
    .then((resolve) => {
      res.status(200).send(resolve);
    })
    .catch((err) => {
      res.status(err.status).send(err);
    });
};

let contactbook = (req, res) => {

  let validatingInputs = () => {
    console.log("validatingInputs");
    return new Promise((resolve, reject) => {
      if (req.params.userId) {
        resolve();
      } else {
        let apiResponse = response.generate(true, "Required Parameter userId is missing", 400, null);
        reject(apiResponse);
      }
    });
  }; // end of validatingInputs

  let checkUser = () => {
    console.log("checkUser");
    return new Promise((resolve, reject) => {
      User.find({user_id: req.params.userId}, function (err, userDetail) {
        if (err) {
          logger.error("Internal Server error while fetching user", "createcontact => checkUser()", 5);
          let apiResponse = response.generate(true, err, 500, null);
          reject(apiResponse);
        } else if (check.isEmpty(userDetail)) {
          logger.error("User does not Exists", "createcontact => checkUser()", 5);
          let apiResponse = response.generate(true, "User does not Exists with this userName", 401, null);
          reject(apiResponse);
        } else {
          resolve();
        }
      })
    });
  }; // end of checkUser

  let getContact = () => {
    console.log("getContact");
    return new Promise((resolve, reject) => {
      ContactBook.findOne({userId: req.params.userId}, function (err, ContactBookData) {
        if (err) {
          logger.error("Internal Server error while create User", "createcontact => getContact()", 5);
          let apiResponse = response.generate(true, err, 500, null);
          reject(apiResponse);
        } else if (check.isEmpty(ContactBookData)) {
          logger.error("User does not Exists", "contackbook => getContact()", 5);
          let apiResponse = response.generate(true, "User does not Exists with this user id", 401, null);
          reject(apiResponse);
        } else {
          resolve(ContactBookData);
        }
      })
    });
  }; // end of addUser

  validatingInputs()
    .then(checkUser)
    .then(getContact)
    .then((resolve) => {
      res.status(200).send(resolve);
    })
    .catch((err) => {
      res.status(err.status).send(err);
    });
};

let allUsers = (req, res) => {

  let validatingInputs = () => {
    console.log("validatingInputs");
    return new Promise((resolve, reject) => {
      if (req.params.userId) {
        resolve();
      } else {
        let apiResponse = response.generate(true, "Required Parameter userId is missing", 400, null);
        reject(apiResponse);
      }
    });
  }; // end of validatingInputs

  let checkUser = () => {
    console.log("checkUser");
    return new Promise((resolve, reject) => {
      User.find({user_id: req.params.userId}, function (err, userDetail) {
        if (err) {
          logger.error("Internal Server error while fetching user", "createcontact => checkUser()", 5);
          let apiResponse = response.generate(true, err, 500, null);
          reject(apiResponse);
        } else if (check.isEmpty(userDetail)) {
          logger.error("User does not Exists", "createcontact => checkUser()", 5);
          let apiResponse = response.generate(true, "User does not Exists with this userName", 401, null);
          reject(apiResponse);
        } else {
          resolve();
        }
      })
    });
  }; // end of checkUser

  let getAllUsers = () => {
    console.log("getAllUsers");
    return new Promise((resolve, reject) => {
      User.find({user_id: {$ne: req.params.userId}}, function (err, userData) {
        if (err) {
          logger.error("Internal Server error while create User", "createcontact => getContact()", 5);
          let apiResponse = response.generate(true, err, 500, null);
          reject(apiResponse);
        } else if (check.isEmpty(userData)) {
          logger.error("User does not Exists", "contackbook => getContact()", 5);
          let apiResponse = response.generate(true, "User does not Exists with this user id", 401, null);
          reject(apiResponse);
        } else {
          resolve(userData);
        }
      })
    });
  }; // end of addUser

  validatingInputs()
    .then(checkUser)
    .then(getAllUsers)
    .then((resolve) => {
      res.status(200).send(resolve);
    })
    .catch((err) => {
      res.status(err.status).send(err);
    });
};

let userMessage = (req, res) => {

  let validatingInputs = () => {
    console.log("validatingInputs");
    return new Promise((resolve, reject) => {
      if (req.params.userName && req.params.toName) {
        resolve();
      } else {
        let apiResponse = response.generate(true, "Required Parameter userName or toName is missing", 400, null);
        reject(apiResponse);
      }
    });
  }; // end of validatingInputs

  let checkUser = () => {
    console.log("checkUser");
    return new Promise((resolve, reject) => {
      User.find({userName: req.params.userName}, function (err, userDetail) {
        if (err) {
          logger.error("Internal Server error while fetching user", "createcontact => checkUser()", 5);
          let apiResponse = response.generate(true, err, 500, null);
          reject(apiResponse);
        } else if (check.isEmpty(userDetail)) {
          logger.error("User does not Exists", "createcontact => checkUser()", 5);
          let apiResponse = response.generate(true, "User does not Exists with this userName", 401, null);
          reject(apiResponse);
        } else {
          resolve();
        }
      })
    });
  }; // end of checkUser

  let getAllMessage = () => {
    console.log("getAllMessage");
    return new Promise((resolve, reject) => {
      ChatMessages.find({$or: [{$and: [{nick: req.params.userName}, {to: req.params.toName}]}, {$and: [{nick: req.params.toName}, {to: req.params.userName}]}]}, function (err, userMessage) {
        if (err) {
          logger.error("Internal Server error while create User", "createcontact => getContact()", 5);
          let apiResponse = response.generate(true, err, 500, null);
          reject(apiResponse);
        } else {
          resolve(userMessage);
        }
      })
    });
  }; // end of addUser

  validatingInputs()
    .then(checkUser)
    .then(getAllMessage)
    .then((resolve) => {
      res.status(200).send(resolve);
    })
    .catch((err) => {
      res.status(err.status).send(err);
    });
};

let sendMessage = (req, res) => {

  let validatingInputs = () => {
    console.log("validatingInputs");
    return new Promise((resolve, reject) => {
      if (req.body.msg && req.body.to && req.body.userName && req.body.currentDate && req.body.time && req.body.date) {
        resolve();
      } else {
        let apiResponse = response.generate(true, "Required Parameter msg or to or userName or currentDate or date or time is missing", 400, null);
        reject(apiResponse);
      }
    });
  }; // end of validatingInputs

  let checkUser = () => {
    console.log("checkUser");
    return new Promise((resolve, reject) => {
      User.find({userName: {"$in": [req.body.to, req.body.userName]}}, function (err, userDetail) {
        if (err) {
          logger.error("Internal Server error while fetching user", "createcontact => checkUser()", 5);
          let apiResponse = response.generate(true, err, 500, null);
          reject(apiResponse);
        } else if (check.isEmpty(userDetail)) {
          logger.error("User does not Exists", "createcontact => checkUser()", 5);
          let apiResponse = response.generate(true, "User does not Exists with this userName", 401, null);
          reject(apiResponse);
        } else {
          if (userDetail.length !== 2) {
            logger.error("User does not Exists", "createcontact => checkUser()", 5);
            let apiResponse = response.generate(true, "User does not Exists with this userName", 401, null);
            reject(apiResponse);
          } else {
            resolve();
          }
        }
      })
    });
  }; // end of checkUser

  let getAllMessage = () => {
    console.log("getAllMessage");
    return new Promise((resolve, reject) => {
      let body = {
        msg: req.body.msg,
        nick: req.body.userName,
        date: req.body.date,
        time: req.body.time,
        to: req.body.to,
        created: req.body.currentDate,
        offline: false,
        counter: 0
      }
      ChatMessages.create(body, function (err, messageResult) {
        if (err) {
          logger.error("Internal Server error while create User", "createcontact => getContact()", 5);
          let apiResponse = response.generate(true, err, 500, null);
          reject(apiResponse);
        } else {
          resolve(messageResult);
        }
      })
    });
  }; // end of addUser

  validatingInputs()
    .then(checkUser)
    .then(getAllMessage)
    .then((resolve) => {
      res.status(200).send(resolve);
    })
    .catch((err) => {
      res.status(err.status).send(err);
    });
};

module.exports = {
  createUser: createUser,
  loginUser: loginUser,
  createcontact: createcontact,
  contactbook: contactbook,
  allUsers: allUsers,
  userMessage: userMessage,
  sendMessage: sendMessage,
};
