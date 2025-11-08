export enum Routes {
  Home = "/",
  Login = "/",
  SignUp = "/signup",
  ForgotPassword = "/forgot-password",
  ResetPassword = "/reset-password",
  Boards = "/boards",
  MyBoards = "/my-boards",
  MyPlayedBoards = "/played",
  BoardGame = "/boards/:id/play",
}

export enum ProtectedRoutes {
  BOARDS = Routes.Boards,
  MY_BOARDS = Routes.MyBoards,
  MY_PLAYED_BOARDS = Routes.MyPlayedBoards,
  BOARD_GAME = Routes.BoardGame,
}