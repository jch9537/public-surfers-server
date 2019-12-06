import { Request, Response } from "express";
import { Users, UsersInterface } from "../models/Users";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../config";
import serveStatic from "serve-static";
import { Participants } from "../models/Paticipants";
import { Chats } from "../models/Chats";
import { Posts } from "../models/Posts";
import { read } from "fs";

interface Token {
  user_id: number;
  email: string;
}

function tokenVerify(token: string): Boolean {
  try {
    jwt.verify(token, config.secret);
    return true;
  } catch (err) {
    return false;
  }
}
function tokenSign(user: Token): string {
  try {
    return jwt.sign(user, config.secret);
  } catch (err) {
    return err;
  }
}

export class User {
  signup(req: Request, res: Response) {
    let array: string[] = Object.keys(req.body);
    if (
      array.indexOf("name") === -1 ||
      array.indexOf("password") === -1 ||
      array.indexOf("oAuth") === -1 ||
      array.indexOf("email") === -1
    ) {
      return res.status(400).send({
        error: {
          status: 400,
          message:
            "body를 다음과 같이 수정해주세요,{email, oAuth, name, password }"
        }
      });
    }
    console.log(req.body);
    let name: string = req.body.name;
    let email: string = req.body.email;
    let oAuth: number = +req.body.oAuth;
    let phone: string = req.body.phone;
    let img_url: string = req.body.img_url;
    if (oAuth === 0) {
      console.log("oAuth = 0");
      console.log("email: ", email);
      let password: string = req.body.password;
      Users.findOne<Users>({ where: { email: email } })
        .then(user => {
          if (user) {
            return res.status(409).send({
              error: {
                status: 409,
                message: "이미 사용 중인 email 입니다"
              }
            });
          } else {
            let hash = crypto
              .createHmac("sha256", config.secret)
              .update(password)
              .digest("hex");
            let user1: UsersInterface = {
              name,
              email,
              password: hash,
              oAuth: 0,
              phone,
              img_url
            };
            Users.create<Users>(user1)
              .then(() => {
                return res.status(201).send({ message: "회원가입 성공" });
              })
              .catch((err: Error) => {
                return res.status(500).send({
                  error: {
                    status: 500,
                    message: "회원가입 실패 2"
                  }
                });
              });
          }
        })
        .catch((err: Error) => {
          return res.status(500).send({
            error: {
              status: 500,
              message: "회원가입 실패 1"
            }
          });
        });
    } else {
      //oAuth token 처리
      res.send("oAuth");
    }
  }
  // google oAuth 
  google(req: Request, res: Response) {
    let array: string[] = Object.keys(req.body);
    if (
      array.indexOf("name") === -1 ||
      array.indexOf("photoUrl") === -1 ||
      array.indexOf("oAuth") === -1 ||
      array.indexOf("email") === -1
    ) {
      return res.status(400).send({
        error: {
          status: 400,
          message:
            "body를 다음과 같이 수정해주세요,{email, oAuth, name, photoUrl }"
        }
      });
    }
    let name: string = req.body.name;
    let email: string = req.body.email;
    let oAuth: number = +req.body.oAuth;
    let img_url: string = req.body.photoUrl;
    if (oAuth === 1) {
      Users.findOrCreate<Users>({ where: { email }, defaults: { name, email, oAuth, img_url } })
        .then(arr => {
          let user_id: number = arr[0].id;
          res.status(201).send({
            message: "로그인 완료",
            token: tokenSign({ user_id, email })
          })
        })
        .catch((err: Error) => {
          res.status(500).send({
            error: {
              status: 500,
              message: "db쪽 문제"
            }
          })
        })
    }
  }
  //로그인 
  signin(req: Request, res: Response) {

    let array: string[] = Object.keys(req.body);
    if (array.indexOf("email") === -1 || array.indexOf("password") === -1) {
      return res.status(400).send({
        error: {
          status: 400,
          message: "body를 다음과 같이 수정해주세요,{email, password }"
        }
      });
    }
    let email: string = req.body.email;
    let password: string = req.body.password;
    let hash = crypto
      .createHmac("sha256", config.secret)
      .update(password)
      .digest("hex");
    Users.findOne<Users>({ where: { email, password: hash } })
      .then(user => {
        if (user) {
          let user_id: number = +user.id;
          return res.status(200).send({
            message: "로그인 완료",
            token: tokenSign({ user_id, email })
          });
        } else {
          return res.status(406).send({
            error: {
              status: 406,
              message: "회원 정보가 없습니다"
            }
          });
        }
      })
      .catch(err => {
        return res.status(500).send({
          error: {
            status: 500,
            message: "로그인 실패"
          }
        });
      });
  }

  userPut(req: Request, res: Response) {
    let arr: string[] = Object.keys(req.body);
    if (
      arr.indexOf("name") === -1 ||
      arr.indexOf("currPassword") === -1 ||
      arr.indexOf("newPassword") === -1
    ) {
      return res.status(400).send({
        error: {
          status: 400,
          message: "body를 다음과 같이 수정해주세요,{ name, currPassword, newPassword }"
        }
      });
    }
    let email: string = req.body.info.email; // api
    let name1: string = req.body.name;
    let currPassword: string = req.body.currPassword;
    let newPassword: string = req.body.newPassword;
    if ((!currPassword && !newPassword) && name1) {
      Users.update<Users>({ name: name1 }, { where: { email } })
        .then(() => {
          return res.status(200).send({ message: "회원정보 수정완료" });
        })
        .catch((err: Error) => {
          return res.status(500).send({
            error: {
              status: 500,
              message: "수정 실패"
            }
          });
        })
      return
    }
    Users.findOne<Users>({ where: { email } })
      .then(user => {
        let password1 = crypto
          .createHmac("sha256", config.secret)
          .update(currPassword)
          .digest("hex");
        if ((<Users>user).password !== password1) {
          return res.status(400).send({
            error: {
              status: 409,
              message: "잘못된 비밀번호 입니다"
            }
          });
        } else {
          if (newPassword.trim().length !== 0 && newPassword) {
            newPassword = crypto
              .createHmac("sha256", config.secret)
              .update(newPassword)
              .digest("hex");
          }
        }
        let name2: string = (<Users>user).name;
        let password2: string | undefined = (<Users>user).password;
        name2 = name1 || name2;
        password2 = newPassword || password2;
        Users.update<Users>(
          { name: name2, password: password2 },
          { where: { email } }
        )
          .then(() => {
            return res.status(200).send({ message: "회원정보 수정완료" });
          })
          .catch((err: Error) => {
            return res.status(500).send({
              error: {
                status: 500,
                message: "수정 실패"
              }
            });
          });
      })
      .catch((err: Error) => {
        return res.status(500).send({
          error: {
            status: 500,
            message: "수정 실패"
          }
        });
      });
  }
  userImage(req: any, res: Response) {
    let bearerToken: string | undefined = req.headers.authorization;
    if (!bearerToken) {
      return res.send("token 없음");
    }
    try {
      if (tokenVerify(bearerToken)) {
        req.body.info = jwt.verify(bearerToken, config.secret);
        Users.update<Users>({ img_url: req.file.location }, { where: { email: req.body.info.email } })
          .then(() => {
            res.status(201).send({ message: "이미지 수정 완료" })
          })
          .catch((err: Error) => {
            res.status(500).send({
              error: {
                status: 500,
                message: "이미지 수정 실패"
              }
            })
          })
      } else {
        return res.status(401).send({
          error: {
            status: 401,
            message: "로그인 상태가 아닙니다"
          }
        });
      }
    } catch (err) {
      return res.status(401).send({
        message: "로그인 상태가 아닙니다."
      });
    }
  }
  token(req: Request, res: Response, next: any) {
    let bearerToken: string | undefined = req.headers.authorization;
    if (!bearerToken) {
      return res.send("token 없음");
    }
    try {
      if (tokenVerify(bearerToken)) {
        req.body.info = jwt.verify(bearerToken, config.secret);
        // console.log(req);
        next();
      } else {
        return res.status(401).send({
          error: {
            status: 401,
            message: "로그인 상태가 아닙니다"
          }
        });
      }
    } catch (err) {
      return res.status(401).send({
        message: "등록 상태가 아닙니다."
      });
    }
  }
  tokenCheck(req: Request, res: Response) {
    let bearerToken: string | undefined = req.headers.authorization;
    console.log("bearerToken: ", bearerToken);
    if (!bearerToken) {
      return res.send("token 없음");
    }
    if (tokenVerify(bearerToken)) {
      console.log("tokencheck true");
      return res.status(200).send({ message: true });
    } else {
      console.log("tokencheck false");
      return res.status(400).send({ message: false });
    }
  }
  deleteUser(req: Request, res: Response) {
    let id: number = req.body.info.user_id;
    Users.destroy({ where: { id } })
      .then(() => {
        Participants.destroy({ where: { user_id: id } })
          .then(() => {
            Chats.destroy({ where: { user_id: id } })
              .then(() => {
                Posts.destroy({ where: { host_id: id } })
                  .then(() => {
                    res.status(201).send({ message: "회원 탈퇴" });
                  })
                  .catch((err: Error) => {
                    res.status(500).send({
                      error: {
                        status: 500,
                        message: "회원 탈퇴 실패"
                      }
                    });
                  });
              })
              .catch((err: Error) => {
                res.status(500).send({
                  error: {
                    status: 500,
                    message: "회원 탈퇴 실패3"
                  }
                });
              });
          })
          .catch((err: Error) => {
            res.status(500).send({
              error: {
                status: 500,
                message: "회원 탈퇴 실패2"
              }
            });
          });
      })
      .catch((err: Error) => {
        res.status(500).send({
          error: {
            status: 500,
            message: "회원 탈퇴 실패1"
          }
        });
      });
  }
  check(req: Request, res: Response) {
    res.send("url 확인 부탁드립니다");
  }

  async identifyUser(req: Request, res: Response) {
    let authorization: any = req.headers.authorization;
    console.log("usertoken: ", authorization);
    let decoded: any = jwt.decode(authorization, { complete: true });
    let user_id = decoded.payload.user_id;

    let user_info: any = await Users.findOne({ where: { id: user_id } });

    let data = {
      id: user_info.id,
      email: user_info.email,
      img_url: user_info.img_url,
      name: user_info.name
    };

    await res.status(200).send(data);
  }
}
