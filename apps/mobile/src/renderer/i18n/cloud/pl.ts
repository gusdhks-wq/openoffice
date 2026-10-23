import type zh from './zh'
export default {
  cloudMethod: 'Sposób połączenia',
  cloudPairCode: 'Kod telefonu (8 cyfr)',
  cloudPairHelp:
    'Wpisz kod telefonu z okna Mobile-connect na komputerze. Ważny jednorazowo przez 3 minuty. Wpisz P i naciśnij Enter na komputerze, aby uzyskać nowy kod. To inny kod niż kod zatwierdzenia ChatGPT.',
  cloudAuthFailed:
    'Uwierzytelnienie wygasło lub kod jest nieprawidłowy. Uzyskaj nowy kod telefonu na komputerze i połącz ponownie.',
  cloudReconnect: 'Połącz dokument z bieżącym adresem',
  cloudReconnectHelp:
    'Ten sam serwer dokumentów ma nowy adres. Połącz ponownie, zachowując wersję roboczą urządzenia i poprzednie wersje.',
  cloudTitle: 'Dokumenty dla zewnętrznego Codex',
  cloudURL: 'Adres serwera dokumentów',
  cloudKey: 'Klucz połączenia właściciela',
  cloudConnect: 'Połącz serwer',
  cloudDisconnect: 'Odłącz serwer',
  cloudSync: 'Synchronizuj dokument',
  cloudRefresh: 'Odśwież dokumenty',
  cloudShare: 'Udostępnij zewnętrznemu Codex',
  cloudUnshare: 'Zatrzymaj udostępnianie',
  cloudVersions: 'Poprzednie wersje',
  cloudRestore: 'Przywróć',
  cloudCopy: 'Wyślij jako nowy dokument',
  cloudConnected: 'Serwer dokumentów połączony',
  cloudDisconnected: 'Serwer dokumentów odłączony',
  cloudBusy: 'Praca z serwerem…',
  cloudFailed: 'Operacja serwera nie powiodła się. Lokalne szkice zachowano.',
  cloudConflict: 'Serwer ma inną wersję. Otwórz ją osobno lub wyślij szkic jako nowy dokument.',
  cloudPending: 'Wysyłanie do serwera w kolejce',
  cloudNotice:
    'Zewnętrzny Codex może czytać i edytować tylko udostępnione dokumenty. Klucz pozostaje w pamięci na czas tego uruchomienia.',
} satisfies Record<keyof typeof zh, string>
