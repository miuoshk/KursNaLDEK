/**
 * Ukrainian and Russian overrides for osce + pulpit (proper localization).
 */
import fs from "node:fs";
import path from "node:path";

const root = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "messages");

const ukOverrides = {
  osce: {
    courseTitle: "Курс OSCE",
    simulation: "Симуляція OSCE",
    simulationShort: "Симуляція",
    stationTitle: "Станція OSCE",
    topicTitle: "Тема",
    atlasOpg: "Атлас OPG",
    pageSubject: "Предмет",
    pageSession: "Сесія",
    examPractical: "Практичний іспит",
    examPracticalWithDate: "Практичний іспит — {date}",
    listStats: "{stations} станцій · {tasks} завдань · поріг: {threshold}% на станцію",
    noStations: "Немає станцій для відображення. Зверніться до адміністратора або спробуйте пізніше.",
    simulationModeLink: "Режим симуляції OSCE",
    dayGroupDay1: "День 1",
    dayGroupDay2: "День 2",
    dayGroupBonus: "Бонус",
    stationListLink: "Список станцій",
    passThreshold: "Поріг заліку: {threshold}%",
    competenciesHeading: "Результати навчання, перевірені на цій станції",
    topicsHeading: "Теми",
    noTopics: "Немає тем. Теми будуть додані незабаром.",
    questionSession: "Сесія питань",
    noActiveQuestions: "Немає активних питань у цій темі.",
    simulationDescription: "Повна пробна спроба за графіком станцій. Результати зберігаємо у профілі.",
    simulationDay1Hint: "Розпочніть симуляцію першого дня іспиту.",
    simulationDay2Hint: "Розпочніть симуляцію другого дня іспиту.",
    historyHeading: "Історія спроб",
    historyRow: "День {day} · {date}",
    historyRowStats: "Станції: {stations} · середній результат {percent}%",
    knowledgeCard: "Картка знань",
    knowledgeCardPreparing: "Картка знань готується",
    knowledgeCardPreparingBody:
      "Тим часом можете потренувати питання — це найкращий спосіб навчання.",
    startQuestions: "Перейти до питань →",
    understoodStartQuestions: "Зрозуміло, перейти до питань",
    endSession: "Завершити",
    nextTopic: "Наступна тема",
    backToStation: "Повернутися до станції",
    summaryTitle: "Підсумок",
    summaryScore: "Результат:",
    check: "Перевірити",
    nextQuestion: "Наступне питання",
    examFormatTrigger: "Формат іспиту",
    examFormatTitle: "Формат іспиту OSCE — WNMZ ŚUM",
  },
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
  osce: {
    courseTitle: "Курс OSCE",
    simulation: "Симуляция OSCE",
    simulationShort: "Симуляция",
    stationTitle: "Станция OSCE",
    topicTitle: "Тема",
    atlasOpg: "Атлас OPG",
    pageSubject: "Предмет",
    pageSession: "Сессия",
    examPractical: "Практический экзамен",
    examPracticalWithDate: "Практический экзамен — {date}",
    listStats: "{stations} станций · {tasks} заданий · порог: {threshold}% на станцию",
    noStations: "Нет станций для отображения. Свяжитесь с администратором или попробуйте позже.",
    simulationModeLink: "Режим симуляции OSCE",
    dayGroupDay1: "День 1",
    dayGroupDay2: "День 2",
    dayGroupBonus: "Бонус",
    stationListLink: "Список станций",
    passThreshold: "Порог зачёта: {threshold}%",
    competenciesHeading: "Результаты обучения, проверяемые на этой станции",
    topicsHeading: "Темы",
    noTopics: "Нет тем. Темы будут добавлены скоро.",
    questionSession: "Сессия вопросов",
    noActiveQuestions: "Нет активных вопросов в этой теме.",
    simulationDescription: "Полная пробная попытка по порядку станций. Результаты сохраняем в профиле.",
    simulationDay1Hint: "Начните симуляцию первого дня экзамена.",
    simulationDay2Hint: "Начните симуляцию второго дня экзамена.",
    historyHeading: "История попыток",
    historyRow: "День {day} · {date}",
    historyRowStats: "Станции: {stations} · средний результат {percent}%",
    knowledgeCard: "Карта знаний",
    knowledgeCardPreparing: "Карта знаний готовится",
    knowledgeCardPreparingBody:
      "Тем временем можете потренировать вопросы — это лучший способ обучения.",
    startQuestions: "Перейти к вопросам →",
    understoodStartQuestions: "Понятно, перейти к вопросам",
    endSession: "Завершить",
    nextTopic: "Следующая тема",
    backToStation: "Вернуться к станции",
    summaryTitle: "Итог",
    summaryScore: "Результат:",
    check: "Проверить",
    nextQuestion: "Следующий вопрос",
    examFormatTrigger: "Формат экзамена",
    examFormatTitle: "Формат экзамена OSCE — WNMZ ŚUM",
  },
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
