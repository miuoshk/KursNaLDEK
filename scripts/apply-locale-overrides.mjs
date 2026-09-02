/**
 * Ukrainian and Russian overrides for pulpit (proper localization).
 */
import fs from "node:fs";
import path from "node:path";

const root = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "messages");

const ukOverrides = {
  pulpit: {
    greetingMorning: "Доброго ранку! Готові до нових викликів?",
    greetingAfternoon: "Як справи? Час трохи попрактикуватися.",
    greetingEvening: "Добрий вечір! Вечірня сесія?",
    greetingNight: "Нічна сова? Не забудьте про сон!",
    welcome: "Вітаємо, {name}!",
    cardDailyGoal: "Денна ціль",
    cardDailyGoalReached: "Ціль досягнуто!",
    cardStreak: "Серія",
    cardStreakStart: "Почніть нову серію!",
    cardReviews: "Повторення",
    cardRank: "Ранг",
    quickStartTitle: "Розпочати навчання",
    activityTitle: "Ваша активність",
    progressTitle: "Ваш прогрес",
    weakPointsTitle: "Слабкі місця",
    historyTitle: "Історія сесій",
  },
};

const ruOverrides = {
  pulpit: {
    greetingMorning: "Доброе утро! Готовы к новым вызовам?",
    greetingAfternoon: "Как дела? Время немного позаниматься.",
    greetingEvening: "Добрый вечер! Вечерняя сессия?",
    greetingNight: "Ночная сова? Не забудьте про сон!",
    welcome: "Добро пожаловать, {name}!",
    cardDailyGoal: "Дневная цель",
    cardDailyGoalReached: "Цель достигнута!",
    cardStreak: "Серия",
    cardStreakStart: "Начните новую серию!",
    cardReviews: "Повторения",
    cardRank: "Ранг",
    quickStartTitle: "Начать обучение",
    activityTitle: "Ваша активность",
    progressTitle: "Ваш прогресс",
    weakPointsTitle: "Слабые места",
    historyTitle: "История сессий",
  },
};

function applyOverrides(data, overrides) {
  for (const [ns, keys] of Object.entries(overrides)) {
    data[ns] = { ...data[ns], ...keys };
  }
}

for (const [locale, overrides] of [
  ["uk", ukOverrides],
  ["ru", ruOverrides],
]) {
  const file = path.join(root, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  applyOverrides(data, overrides);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log("overrides applied", locale);
}
