const path = require("path");
const multer = require("multer");
const multerS3 = require('multer-s3');
const AWS = require("aws-sdk");

import { User } from "../controller/user";

AWS.config.loadFromPath(__dirname + "/../config/awsconfig.json");
let s3 = new AWS.S3();
let upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "chime55",
    key: function (req: any, file: any, cb: any) {
      let extension = path.extname(file.originalname);
      cb(null, Date.now().toString() + extension)
    },
    acl: 'public-read-write',
  })
})

export class Users {
  public controller: User = new User();

  public routes(app: any): void {
    app
      .route("/user")
      .get(this.controller.tokenCheck)
      .delete(this.controller.token, this.controller.deleteUser);
    app.route("/user").put(this.controller.token, this.controller.userPut);
    app.route("/userImage").put(upload.single("image"), this.controller.userImage);
    app.route("/user/signup").post(this.controller.signup);
    app.route("/google").post(this.controller.google);
    app.route("/user/signin").post(this.controller.signin);
    app.route("/identify").all(this.controller.identifyUser);
    app.route("/*").all(this.controller.check);
  }
}
