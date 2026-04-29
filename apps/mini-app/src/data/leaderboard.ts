export interface LeaderboardEntry {
  memberId: string
  firstName: string
  lastName: string | null
  pointsBalance: number
  levelName: string
}

export const mockLeaderboard: LeaderboardEntry[] = [
  { memberId: "1", firstName: "Олександр", lastName: "Петренко", pointsBalance: 2780, levelName: "Легенда" },
  { memberId: "2", firstName: "Марія", lastName: "Коваленко", pointsBalance: 1540, levelName: "Майстер" },
  { memberId: "3", firstName: "Андрій", lastName: "Шевченко", pointsBalance: 1230, levelName: "Майстер" },
  { memberId: "4", firstName: "Катерина", lastName: "Бондаренко", pointsBalance: 890, levelName: "Підмайстер" },
  { memberId: "5", firstName: "Dmytro", lastName: "Horban", pointsBalance: 347, levelName: "Підмайстер" },
  { memberId: "6", firstName: "Ольга", lastName: "Мельник", pointsBalance: 620, levelName: "Підмайстер" },
  { memberId: "7", firstName: "Іван", lastName: "Ткаченко", pointsBalance: 410, levelName: "Мандрівник" },
  { memberId: "8", firstName: "Анна", lastName: "Кравченко", pointsBalance: 280, levelName: "Мандрівник" },
  { memberId: "9", firstName: "Максим", lastName: "Олійник", pointsBalance: 150, levelName: "Шукач" },
  { memberId: "10", firstName: "Софія", lastName: "Литвиненко", pointsBalance: 75, levelName: "Учень" },
]
