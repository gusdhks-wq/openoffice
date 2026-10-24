import type zh from './zh'
export default {
  hwpExitFullscreen: 'Zamknij pełny ekran',

  hwpFullscreen: 'Pełny ekran',

  hwpFitWidth: 'Dopasuj szerokość',

  hwpZoomOut: 'Pomniejsz',

  hwpZoomIn: 'Powiększ',

  hwpHelp: 'Zakres i ograniczenia',

  sourceWorkspace: 'Dokumenty tekstowe i połączenia',

  hwpSaveFailed:
    'Nie można zweryfikować lub zapisać zmian. Nie zamykaj edytora i spróbuj ponownie. Oryginał i ostatni zapis pozostają.',

  hwpSaveNative: 'Zapisz zmienioną kopię HWP/HWPX',

  hwpNew: 'Nowy dokument HWP',

  hwpTitle: 'Edytor HWP · eksperymentalny',
  hwpScope:
    'Pisz bezpośrednio w HWP/HWPX, zmieniaj format i tabele. Zapis lokalny po przerwie w pisaniu oraz eksport kopii w oryginalnym formacie. Oryginał pozostaje. Hasła i śledzenie zmian nie są obsługiwane. Zgodność z Hangul i klawiatura telefonu wymagają testów; brak AI i Drive.',
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
    'Nie można otworzyć dokumentu. Sprawdź format, hasło i śledzenie zmian. Oryginały i zapisane kopie pozostają.',
} satisfies Record<keyof typeof zh, string>
