import type zh from './zh'
export default {
  hwpTitle: 'Obszar HWP · eksperymentalny',
  hwpScope:
    'Otwieraj HWP/HWPX lokalnie i zamieniaj tekst w akapitach lub komórkach. Zmiany i oryginał są zapisywane w kopii do ponownego importu. Eksport zmienionego HWP/HWPX, AI i synchronizacja Drive nie są jeszcze dostępne. Czcionki mogą zmienić podział stron.',
  hwpOpen: 'Otwórz HWP lub kopię roboczą',
  hwpOriginal: 'Eksportuj oryginał sprzed zmian',
  hwpBackup: 'Eksportuj kopię roboczą',
  hwpPrevious: 'Poprzednia strona',
  hwpNext: 'Następna strona',
  hwpPage: 'Strona dokumentu',
  hwpFind: 'Tekst do zamiany · unikatowa fraza',
  hwpReplacement: 'Nowy tekst',
  hwpReplace: 'Zamień i zapisz lokalnie',
  hwpUndo: 'Cofnij ostatnią zmianę',
  hwpFailed:
    'Nie można otworzyć ani edytować. Sprawdź powtarzający się tekst, format i pamięć. Dotychczasowa praca została zachowana.',
} satisfies Record<keyof typeof zh, string>
