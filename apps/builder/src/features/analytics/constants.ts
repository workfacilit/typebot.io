export const timeFilterValues = [
  'today',
  'last7Days',
  'last30Days',
  'monthToDate',
  'lastMonth',
  'yearToDate',
  'allTime',
] as const

export const timeFilterLabels: Record<
  (typeof timeFilterValues)[number],
  string
> = {
  today: 'Hoje',
  last7Days: 'Últimos 7 dias',
  last30Days: 'Últimos 30 dias',
  monthToDate: 'Do mês até hoje',
  lastMonth: 'Mês passado',
  yearToDate: 'Do ano até hoje',
  allTime: 'Todos',
}

export const defaultTimeFilter = 'last7Days' as const
