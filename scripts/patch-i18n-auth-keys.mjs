import fs from "node:fs";
import path from "node:path";

const root = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "messages");

const patches = {
  en: {
    auth: {
      noAccount: "Don't have an account?",
      registerLink: "Sign up",
      hasAccount: "Already have an account?",
      backToLogin: "Back to login",
      rememberPassword: "Remember your password?",
      passwordChangedLogin: "Password changed. Sign in with your new password.",
      linkExpiredTitle: "Link expired",
      linkExpiredBody:
        "Your password reset link has expired or was already used. Request a new link and try again.",
      sendNewLink: "Send a new link",
      resetPasswordIntro:
        "Enter a new password for {email}. After saving, you will sign in with the new password.",
    },
    errors: {
      linkInvalid: "This link is invalid. Request a new password reset link.",
      linkExpired: "The password reset link has expired. Request a new one and try again.",
      invalidLocale: "Invalid language.",
    },
    common: {
      somethingWentWrong: "Something went wrong",
      backToDashboard: "Back to dashboard",
    },
    nav: {
      studySession: "Study session",
      reviewSession: "Review session",
      chooseSubject: "Choose a subject",
      studySessionTooltip: "Study session — {hint}",
    },
  },
  uk: {
    auth: {
      noAccount: "Немає облікового запису?",
      registerLink: "Зареєструватися",
      hasAccount: "Уже маєте обліковий запис?",
      backToLogin: "Повернутися до входу",
      rememberPassword: "Пам'ятаєте пароль?",
      passwordChangedLogin: "Пароль змінено. Увійдіть із новим паролем.",
      linkExpiredTitle: "Посилання прострочено",
      linkExpiredBody:
        "Посилання для скидання пароля прострочено або вже використано. Запросіть нове посилання та спробуйте знову.",
      sendNewLink: "Надіслати нове посилання",
      resetPasswordIntro:
        "Введіть новий пароль для {email}. Після збереження ви увійдете з новим паролем.",
    },
    errors: {
      linkInvalid: "Це посилання недійсне. Запросіть нове посилання для скидання пароля.",
      linkExpired: "Посилання для скидання пароля прострочено. Запросіть нове та спробуйте знову.",
      invalidLocale: "Недійсна мова.",
    },
    common: {
      somethingWentWrong: "Щось пішло не так",
      backToDashboard: "Повернутися на панель",
    },
    nav: {
      studySession: "Сесія навчання",
      reviewSession: "Сесія повторення",
      chooseSubject: "Оберіть предмет",
      studySessionTooltip: "Сесія навчання — {hint}",
    },
  },
  ru: {
    auth: {
      noAccount: "Нет аккаунта?",
      registerLink: "Зарегистрироваться",
      hasAccount: "Уже есть аккаунт?",
      backToLogin: "Вернуться ко входу",
      rememberPassword: "Помните пароль?",
      passwordChangedLogin: "Пароль изменён. Войдите с новым паролем.",
      linkExpiredTitle: "Ссылка истекла",
      linkExpiredBody:
        "Ссылка для сброса пароля истекла или уже использована. Запросите новую ссылку и попробуйте снова.",
      sendNewLink: "Отправить новую ссылку",
      resetPasswordIntro:
        "Введите новый пароль для {email}. После сохранения вы войдёте с новым паролем.",
    },
    errors: {
      linkInvalid: "Эта ссылка недействительна. Запросите новую ссылку для сброса пароля.",
      linkExpired: "Ссылка для сброса пароля истекла. Запросите новую и попробуйте снова.",
      invalidLocale: "Недопустимый язык.",
    },
    common: {
      somethingWentWrong: "Что-то пошло не так",
      backToDashboard: "Вернуться на панель",
    },
    nav: {
      studySession: "Сессия обучения",
      reviewSession: "Сессия повторения",
      chooseSubject: "Выберите предмет",
      studySessionTooltip: "Сессия обучения — {hint}",
    },
  },
};

const plNav = {
  studySession: "Sesja nauki",
  reviewSession: "Sesja powtórkowa",
  chooseSubject: "Wybierz przedmiot",
  studySessionTooltip: "Sesja nauki — {hint}",
};

for (const locale of ["pl", "en", "uk", "ru"]) {
  const file = path.join(root, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (locale === "pl") {
    Object.assign(data.nav, plNav);
  } else {
    const patch = patches[locale];
    for (const [ns, keys] of Object.entries(patch)) {
      data[ns] = { ...data[ns], ...keys };
    }
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log("patched", locale);
}
