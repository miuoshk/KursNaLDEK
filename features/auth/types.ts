export type AuthActionState = {
  error: string | null;
  info: string | null;
  /**
   * E-mail którego dotyczył błąd / wymaga ponownego potwierdzenia.
   * Gdy ustawiony, UI może pokazać przycisk "Wyślij ponownie link
   * potwierdzający", który wywołuje `resendConfirmationAction`.
   */
  resendEmail?: string | null;
};

export const initialAuthActionState: AuthActionState = {
  error: null,
  info: null,
  resendEmail: null,
};
