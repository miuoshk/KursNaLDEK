export type AuthActionState = {
  error: string | null;
  info: string | null;
};

export const initialAuthActionState: AuthActionState = {
  error: null,
  info: null,
};
