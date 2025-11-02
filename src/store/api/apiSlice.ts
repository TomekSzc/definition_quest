import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  LoginRequest,
  AuthResponse,
  SignUpRequest,
  RefreshTokenRequest,
  BoardSummaryDTO,
} from '../../types';
import { setCredentials, logout, updateTokens } from '../slices/authSlice';
import { showToast } from '../slices/toastSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: '/',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as any).auth.accessToken as string | null;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth: typeof baseQuery = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Do not attempt token refresh for authentication endpoints themselves
    const requestUrl = typeof args === 'string' ? args : args.url;
    if (requestUrl && (requestUrl.startsWith('/api/auth/login') || requestUrl.startsWith('/api/auth/signUp'))) {
      return result;
    }

    const refreshToken = (api.getState() as any).auth.refreshToken as string | null;
    if (!refreshToken) {
      api.dispatch(logout());
      return result;
    }

    const refreshResult = await baseQuery(
      {
        url: '/api/auth/refresh-token',
        method: 'POST',
        body: { refreshToken } as RefreshTokenRequest,
      },
      api,
      extraOptions,
    );

    if (refreshResult.data && (refreshResult.data as AuthResponse).data?.session) {
      const { accessToken, refreshToken: newRefreshToken } = (refreshResult.data as AuthResponse).data!.session!;
      api.dispatch(updateTokens({ accessToken, refreshToken: newRefreshToken }));

      // retry original query with new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  // Pokaż toast dla wszystkich innych błędów sieciowych
  if (result.error && result.error.status !== 401) {
    api.dispatch(
      showToast({
        type: 'error',
        title: 'Błąd',
        message:
          (result.error.data as any)?.message || 'Wystąpił błąd zapytania',
      }),
    );
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Boards', 'Auth'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: '/api/auth/login',
        method: 'POST',
        body,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.data) {
            dispatch(setCredentials({
              user: data.data.user,
              accessToken: data.data.session?.accessToken ?? '',
              refreshToken: data.data.session?.refreshToken ?? '',
            }));
            dispatch(
              showToast({
                type: 'success',
                title: 'Success',
                message: 'Logged in successfully',
              }),
            );
          }
        } catch (err: any) {
          dispatch(
            showToast({
              type: 'error',
              title: 'Error',
              message: err.error?.data?.message || 'Login failed',
            }),
          );
        }
      },
    }),
    signUp: builder.mutation<AuthResponse, SignUpRequest>({
      query: (body) => ({
        url: '/api/auth/signUp',
        method: 'POST',
        body,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            showToast({
              type: 'success',
              title: 'Success',
              message: data.message || 'Account created',
            }),
          );
        } catch (err: any) {
          dispatch(
            showToast({
              type: 'error',
              title: 'Error',
              message: err.error?.data?.message || 'Sign up failed',
            }),
          );
        }
      },
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/api/auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(logout());
        }
      },
    }),
    getBoards: builder.query<BoardSummaryDTO[], void>({
      query: () => '/api/boards',
      providesTags: ['Boards'],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignUpMutation,
  useLogoutMutation,
  useGetBoardsQuery,
} = apiSlice;
