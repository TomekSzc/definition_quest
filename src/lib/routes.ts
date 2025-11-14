export enum Routes {
  Home = "/home",
  Login = "/",
  SignUp = "/signup",
  ForgotPassword = "/forgot-password",
  ResetPassword = "/reset-password",
  Boards = "/boards",
  MyBoards = "/my-boards",
  MyPlayedBoards = "/played",
  BoardGame = "/boards/:id",
}

export const ProtectedRoutes = {
  BOARDS: Routes.Boards,
  MY_BOARDS: Routes.MyBoards,
  MY_PLAYED_BOARDS: Routes.MyPlayedBoards,
} as const;
