export interface HistoryEntry {
  delta: number
  balanceAfter: number
  occurredAt: number
  activity?: { name: string; hasGame: boolean } | null
  product?: { name: string } | null
  promo?: { name: string } | null
  adminNote?: string | null
}

const now = Math.floor(Date.now() / 1000)
const DAY = 86400

export const mockHistory: HistoryEntry[] = [
  { delta: 25, balanceAfter: 347, occurredAt: now - DAY * 0, activity: { name: "D&D: Загублена Шахта Фанделвера", hasGame: true }, product: null, promo: null, adminNote: null },
  { delta: 15, balanceAfter: 322, occurredAt: now - DAY * 1, product: { name: "Лате" }, activity: null, promo: null, adminNote: null },
  { delta: 30, balanceAfter: 307, occurredAt: now - DAY * 2, activity: { name: "Зів Абісу", hasGame: true }, product: null, promo: null, adminNote: null },
  { delta: -10, balanceAfter: 277, occurredAt: now - DAY * 3, adminNote: "Корекція балансу", activity: null, product: null, promo: null },
  { delta: 20, balanceAfter: 287, occurredAt: now - DAY * 4, activity: { name: "Вікторина: Світ Відьмака", hasGame: false }, product: null, promo: null, adminNote: null },
  { delta: 10, balanceAfter: 267, occurredAt: now - DAY * 5, product: { name: "Чай з травами" }, activity: null, promo: null, adminNote: null },
  { delta: 50, balanceAfter: 257, occurredAt: now - DAY * 6, promo: { name: "Бонус вихідного дня" }, activity: null, product: null, adminNote: null },
  { delta: 25, balanceAfter: 207, occurredAt: now - DAY * 7, activity: { name: "Зоряні Війни RPG", hasGame: true }, product: null, promo: null, adminNote: null },
  { delta: 15, balanceAfter: 182, occurredAt: now - DAY * 8, product: { name: "Кава Американо" }, activity: null, promo: null, adminNote: null },
  { delta: 30, balanceAfter: 167, occurredAt: now - DAY * 9, activity: { name: "Pathfinder: Підземелля", hasGame: true }, product: null, promo: null, adminNote: null },
  { delta: 20, balanceAfter: 137, occurredAt: now - DAY * 10, activity: { name: "Настільна гра: Каркассон", hasGame: false }, product: null, promo: null, adminNote: null },
  { delta: 10, balanceAfter: 117, occurredAt: now - DAY * 11, product: { name: "Сік яблучний" }, activity: null, promo: null, adminNote: null },
  { delta: 25, balanceAfter: 107, occurredAt: now - DAY * 12, activity: { name: "Call of Cthulhu: Маска Нярлатхотепа", hasGame: true }, product: null, promo: null, adminNote: null },
  { delta: 15, balanceAfter: 82, occurredAt: now - DAY * 14, promo: { name: "Знижка за день народження" }, activity: null, product: null, adminNote: null },
  { delta: 20, balanceAfter: 67, occurredAt: now - DAY * 16, activity: { name: "D&D: Прокляття Страду", hasGame: true }, product: null, promo: null, adminNote: null },
  { delta: 10, balanceAfter: 47, occurredAt: now - DAY * 18, product: { name: "Піца Маргарита" }, activity: null, promo: null, adminNote: null },
  { delta: 15, balanceAfter: 37, occurredAt: now - DAY * 20, activity: { name: "Квест: Втеча з кімнати", hasGame: false }, product: null, promo: null, adminNote: null },
  { delta: 12, balanceAfter: 22, occurredAt: now - DAY * 22, product: { name: "Капучіно" }, activity: null, promo: null, adminNote: null },
  { delta: 10, balanceAfter: 10, occurredAt: now - DAY * 25, promo: { name: "Вітальний бонус" }, activity: null, product: null, adminNote: null },
  { delta: 0, balanceAfter: 0, occurredAt: now - DAY * 30, adminNote: "Реєстрація в гільдії", activity: null, product: null, promo: null },
  { delta: 25, balanceAfter: 347, occurredAt: now - DAY * 32, activity: { name: "Vampire: The Masquerade", hasGame: true }, product: null, promo: null, adminNote: null },
  { delta: 15, balanceAfter: 322, occurredAt: now - DAY * 34, product: { name: "Глінтвейн" }, activity: null, promo: null, adminNote: null },
  { delta: 20, balanceAfter: 307, occurredAt: now - DAY * 36, activity: { name: "Warhammer Fantasy RPG", hasGame: true }, product: null, promo: null, adminNote: null },
  { delta: 10, balanceAfter: 287, occurredAt: now - DAY * 38, product: { name: "Какао" }, activity: null, promo: null, adminNote: null },
  { delta: 30, balanceAfter: 277, occurredAt: now - DAY * 40, activity: { name: "D&D: Берег Мечів", hasGame: true }, product: null, promo: null, adminNote: null },
]
