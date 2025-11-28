import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  LoginRequest,
  AuthResponse,
  SignUpRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  BoardSummaryDTO,
  PlayedBoardDTO,
  Paged,
  ListBoardsQuery,
  BoardViewDTO,
  CreateBoardCmd,
  BoardDetailDTO,
  GenerateBoardCmd,
  BoardGenerationResultDTO,
  PatchBoardCmd,
  PairDTO,
  PairUpdateCmd,
  PairCreateCmd,
} from "../../types";
import type { RootState } from "../index";
import { setCredentials, updateTokens } from "../slices/authSlice";
import { showToast } from "../slices/toastSlice";
import { handleClientLogout } from "./helpers";

const baseQuery = fetchBaseQuery({
  baseUrl: "/",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

const baseQueryWithReauth: typeof baseQuery = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Do not attempt token refresh for authentication endpoints themselves
    const requestUrl = typeof args === "string" ? args : args.url;
    if (requestUrl && (requestUrl.startsWith("/api/auth/login") || requestUrl.startsWith("/api/auth/signUp"))) {
      return result;
    }

    const refreshToken = (api.getState() as RootState).auth.refreshToken;
    if (!refreshToken) {
      // hit logout endpoint to invalidate any server-side session
      await baseQuery({ url: "/api/auth/logout", method: "POST" }, api, extraOptions);
      handleClientLogout(api.dispatch);
      return result;
    }

    const refreshResult = await baseQuery(
      {
        url: "/api/auth/refresh-token",
        method: "POST",
        body: { refreshToken } as RefreshTokenRequest,
      },
      api,
      extraOptions
    );

    const authResponse = refreshResult.data as AuthResponse | undefined;

    // If refresh token request failed (e.g., received 401) or no session returned, log out and exit
    if (refreshResult.error || !authResponse?.data?.session) {
      handleClientLogout(api.dispatch);
      return refreshResult;
    }

    const { accessToken, refreshToken: newRefreshToken } = authResponse.data.session;
    api.dispatch(updateTokens({ accessToken, refreshToken: newRefreshToken }));

    // retry original query with new token
    result = await baseQuery(args, api, extraOptions);
  }

  // Pokaż toast dla wszystkich innych błędów sieciowych
  if (result.error && result.error.status !== 401) {
    api.dispatch(
      showToast({
        type: "error",
        title: "Błąd",
        message: (result.error.data as { message?: string } | undefined)?.message || "Wystąpił błąd zapytania",
      })
    );
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Boards", "BoardsPlayed", "Auth"],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: "/api/auth/login",
        method: "POST",
        body,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.data) {
            dispatch(
              setCredentials({
                user: data.data.user,
                accessToken: data.data.session?.accessToken ?? "",
                refreshToken: data.data.session?.refreshToken ?? "",
              })
            );
            dispatch(
              showToast({
                type: "success",
                title: "Success",
                message: "Logged in successfully",
              })
            );
          }
        } catch (err: unknown) {
          const errorMessage =
            (err as { error?: { data?: { message?: string } } }).error?.data?.message ?? "Login failed";
          dispatch(showToast({ type: "error", title: "Error", message: errorMessage }));
        }
      },
    }),
    signUp: builder.mutation<AuthResponse, SignUpRequest>({
      query: (body) => ({
        url: "/api/auth/signUp",
        method: "POST",
        body,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            showToast({
              type: "success",
              title: "Success",
              message: data.message || "Account created",
            })
          );
        } catch (err: unknown) {
          const errorMessage =
            (err as { error?: { data?: { message?: string } } }).error?.data?.message ?? "Sign up failed";
          dispatch(showToast({ type: "error", title: "Error", message: errorMessage }));
        }
      },
    }),
    logout: builder.mutation<{ message: string }, undefined>({
      query: () => ({
        url: "/api/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          handleClientLogout(dispatch);
        }
      },
    }),
    forgotPassword: builder.mutation<AuthResponse, ForgotPasswordRequest>({
      query: (body) => ({
        url: "/api/auth/forgot-password",
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            showToast({
              type: "success",
              title: "Sprawdź skrzynkę",
              message: "Wysłaliśmy link resetujący hasło.",
            })
          );
        } catch (err: unknown) {
          const errorMessage =
            (err as { error?: { data?: { error?: string } } }).error?.data?.error ?? "Coś poszło nie tak";
          dispatch(showToast({ type: "error", title: "Błąd", message: errorMessage }));
        }
      },
    }),
    resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest>({
      query: (body) => ({
        url: "/api/auth/reset-password",
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            showToast({
              type: "success",
              title: "Sukces",
              message: data.message || "Hasło zostało zmienione.",
            })
          );
          // Redirect to login page after success
          window.location.href = "/";
        } catch (err: unknown) {
          const errorMessage =
            (err as { error?: { data?: { error?: string } } }).error?.data?.error ?? "Nie udało się zresetować hasła";
          dispatch(showToast({ type: "error", title: "Błąd", message: errorMessage }));
        }
      },
    }),
    getBoards: builder.query<BoardSummaryDTO[], undefined>({
      query: () => "/api/boards",
      providesTags: ["Boards"],
    }),
    listPublicBoards: builder.query<Paged<BoardSummaryDTO>, Partial<ListBoardsQuery>>({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params?.page) qs.set("page", params.page.toString());
        if (params?.pageSize) qs.set("pageSize", params.pageSize.toString());
        if (params?.q) qs.set("q", params.q);
        if (params?.tags?.length) qs.set("tags", params.tags.join(","));
        if (params?.ownerId) qs.set("ownerId", params.ownerId);
        if (params?.sort) qs.set("sort", params.sort);
        if (params?.direction) qs.set("direction", params.direction);
        const query = qs.toString();
        return `/api/boards${query ? `?${query}` : ""}`;
      },
    }),

    listPlayedBoards: builder.query<Paged<PlayedBoardDTO>, Partial<ListBoardsQuery>>({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params?.page) qs.set("page", params.page.toString());
        if (params?.pageSize) qs.set("pageSize", params.pageSize.toString());
        if (params?.q) qs.set("q", params.q);
        const query = qs.toString();
        return `/api/boards/played${query ? `?${query}` : ""}`;
      },
      providesTags: ["BoardsPlayed"],
    }),
    getBoardById: builder.query<BoardViewDTO, string>({
      query: (id) => `/api/boards/${id}`,
    }),
    submitScore: builder.mutation<{ id: string; elapsedMs: number }, { boardId: string; elapsedMs: number }>({
      query: ({ boardId, elapsedMs }) => ({
        url: `/api/boards/${boardId}/scores`,
        method: "POST",
        body: { elapsedMs },
      }),
    }),
    createBoard: builder.mutation<BoardDetailDTO[] | null, CreateBoardCmd>({
      query: (body) => ({
        url: "/api/boards",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Boards"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(showToast({ type: "success", title: "Sukces", message: "Tablica utworzona" }));
          if (data && data.length) {
            window.location.href = `/boards/${data[0].id}`;
          }
        } catch (err: unknown) {
          const errorMessage =
            (err as { error?: { data?: { message?: string } } }).error?.data?.message ??
            "Nie udało się utworzyć tablicy";
          dispatch(showToast({ type: "error", title: "Błąd", message: errorMessage }));
        }
      },
    }),
    generatePairs: builder.mutation<BoardGenerationResultDTO, GenerateBoardCmd>({
      query: (body) => ({
        url: "/api/boards/generate",
        method: "POST",
        body,
      }),
    }),
    updateBoardMeta: builder.mutation<BoardDetailDTO, { id: string; payload: PatchBoardCmd }>({
      query: ({ id, payload }) => ({
        url: `/api/boards/${id}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Boards", id }],
    }),
    updatePair: builder.mutation<PairDTO, { boardId: string; pairId: string; payload: PairUpdateCmd }>({
      query: ({ boardId, pairId, payload }) => ({
        url: `/api/boards/${boardId}/pairs/${pairId}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (result, error, { boardId }) => [{ type: "Boards", id: boardId }],
    }),
    addLevel: builder.mutation<BoardDetailDTO, { boardId: string; pairs: PairCreateCmd[] }>({
      query: (body) => ({
        url: "/api/boards/level",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { boardId }) => [{ type: "Boards", id: boardId }],
    }),
    addPair: builder.mutation<PairDTO, { boardId: string; pair: PairCreateCmd }>({
      query: ({ boardId, pair }) => ({
        url: `/api/boards/${boardId}/pairs`,
        method: "POST",
        body: pair,
      }),
      invalidatesTags: (result, error, { boardId }) => [{ type: "Boards", id: boardId }],
    }),
    deletePair: builder.mutation<{ id: string; boardId: string; message: string }, { boardId: string; pairId: string }>(
      {
        query: ({ boardId, pairId }) => ({
          url: `/api/boards/${boardId}/pairs/${pairId}`,
          method: "DELETE",
        }),
        invalidatesTags: (result, error, { boardId }) => [{ type: "Boards", id: boardId }],
      }
    ),
    deleteBoard: builder.mutation<{ message: string }, string>({
      query: (boardId) => ({
        url: `/api/boards/${boardId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Boards"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(showToast({ type: "success", title: "Sukces", message: "Tablica została usunięta" }));
        } catch (err: unknown) {
          const errorMessage =
            (err as { error?: { data?: { message?: string } } }).error?.data?.message ?? "Nie udało się usunąć tablicy";
          dispatch(showToast({ type: "error", title: "Błąd", message: errorMessage }));
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useSignUpMutation,
  useLogoutMutation,
  useGetBoardsQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useListPublicBoardsQuery,
  useLazyListPublicBoardsQuery,
  useListPlayedBoardsQuery,
  useLazyListPlayedBoardsQuery,
  useGetBoardByIdQuery,
  useLazyGetBoardByIdQuery,
  useSubmitScoreMutation,
  useCreateBoardMutation,
  useGeneratePairsMutation,
  useUpdateBoardMetaMutation,
  useUpdatePairMutation,
  useAddPairMutation,
  useDeletePairMutation,
  useDeleteBoardMutation,
  useAddLevelMutation,
} = apiSlice;
