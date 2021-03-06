import { Request, Response } from "express";
import { PostsController } from "../controller/Post";
import { User } from "../controller/user";

export class PostsRoutes {
  public postsController: PostsController = new PostsController();
  public controller: User = new User();
  public routes(app: any): void {
    //모임 생성 혹은 쿼리에 따라 내 리스트에 추가
    app
      .route("/posts")
      .post(this.controller.token, this.postsController.makeRoomOrAddMyList);

    //전체 모음목록 데이터 get
    app
      .route("/posts")
      .get(this.controller.token, this.postsController.getRoomList);

    //유저 모임목록 데이터 get
    app
      .route("/posts/my_list")
      .get(this.controller.token, this.postsController.getMyList);

    //유저 모임 나가기
    // app
    //   .route("/posts") //example = /posts?user_id=15&room_id=20
    //   .delete(this.controller.token, this.postsController.deleteFromList);


    // 룸 내용 불러오기
    app
      .route("/post")
      .get(this.controller.token, this.postsController.getRoomInfo);

    app
      .route("/post")
      .post(this.controller.token, this.postsController.joinInRoom);

    app
      .route("/post")
      .delete(this.controller.token, this.postsController.deleteFromList);

    app
      .route("/location")
      .get(this.controller.token, this.postsController.getLocationList);
    app
      .route("/spot")
      .get(this.controller.token, this.postsController.getSpotInfo);

    app.route("/delete").delete(this.controller.token, this.postsController.deleteRoom);
    app.route("/edit").put(this.controller.token, this.postsController.putRoomInfo);

  }
}
