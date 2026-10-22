export interface LevelTier {
  levelId: string
  name: string
  minPoints: number
  sortOrder: number
}

export interface Benefit {
  name: string
  description: string | null
}

export interface Prize {
  name: string
  description: string | null
}

export const mockLevels: LevelTier[] = [
  { levelId: "F", name: "Гість", minPoints: 0, sortOrder: 0 },
  { levelId: "E", name: "Мандрівник", minPoints: 70, sortOrder: 1 },
  { levelId: "D", name: "Сходжувач", minPoints: 170, sortOrder: 2 },
  { levelId: "C", name: "Дослідник", minPoints: 470, sortOrder: 3 },
  { levelId: "B", name: "Вартовий", minPoints: 1270, sortOrder: 4 },
  { levelId: "A", name: "Архітектор", minPoints: 2470, sortOrder: 5 },
  { levelId: "S", name: "Хранитель", minPoints: 5000, sortOrder: 6 },
]

export const mockBenefits: Record<string, Benefit[]> = {
  F: [],
  E: [{ name: "Знижка 5%", description: "На всі настільні ігри" }],
  D: [
    { name: "Знижка 5%", description: "На всі настільні ігри" },
    { name: "Знижка 10%", description: "На напої в таверні" },
  ],
  C: [
    { name: "Знижка 10%", description: "На всі настільні ігри" },
    { name: "Знижка 10%", description: "На напої в таверні" },
    { name: "Пріоритетний запис", description: "На популярні сесії" },
  ],
  B: [
    { name: "Знижка 15%", description: "На всі настільні ігри" },
    { name: "Знижка 15%", description: "На напої в таверні" },
    { name: "Пріоритетний запис", description: "На всі сесії" },
    { name: "Безкоштовний напій", description: "Один раз на місяць" },
  ],
  A: [
    { name: "Знижка 20%", description: "На всі настільні ігри та товари" },
    { name: "Знижка 20%", description: "На напої в таверні" },
    { name: "VIP запис", description: "Першочерговий запис на всі сесії" },
    { name: "Безкоштовний напій", description: "При кожному відвідуванні" },
  ],
}

export const mockPrizes: Record<string, Prize[]> = {
  F: [],
  E: [{ name: "Стікер гільдії", description: "Вітальний набір стікерів" }],
  D: [{ name: "Значок мандрівника", description: "Ексклюзивний значок" }],
  C: [
    { name: "Стікер із Блопом", description: "Лімітований стікер з маскотом" },
    { name: "Значок підмайстра", description: null },
  ],
  B: [{ name: "Набір кубиків", description: "Ексклюзивний набір кубиків гільдії" }],
  A: [
    { name: "Футболка гільдії", description: "Ексклюзивний мерч" },
    { name: "Золотий кубик", description: "Колекційний кубик Легенди" },
  ],
}
