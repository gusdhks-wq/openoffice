import type zh from './zh'
export default {
  cloudMethod: 'Verbindingsmethode',
  cloudPairCode: 'Telefooncode (8 cijfers)',
  cloudPairHelp:
    'Voer de telefooncode uit het PC-venster Mobile-connect in. Eenmalig geldig gedurende 3 minuten. Typ P en druk op Enter op de PC voor een nieuwe code. Dit is niet de ChatGPT-goedkeuringscode.',
  cloudAuthFailed:
    'De aanmelding is verlopen of de code is onjuist. Vraag op de PC een nieuwe telefooncode aan en verbind opnieuw.',
  cloudReconnect: 'Dit document opnieuw verbinden met het huidige adres',
  cloudReconnectHelp:
    'Dezelfde documentserver heeft een nieuw adres. Verbind opnieuw met behoud van het concept op dit apparaat en eerdere versies.',
  cloudTitle: 'Documenten voor externe Codex',
  cloudURL: 'Adres van documentserver',
  cloudKey: 'Verbindingssleutel van eigenaar',
  cloudConnect: 'Server verbinden',
  cloudDisconnect: 'Server loskoppelen',
  cloudSync: 'Document synchroniseren',
  cloudRefresh: 'Documenten vernieuwen',
  cloudShare: 'Delen met externe Codex',
  cloudUnshare: 'Delen stoppen',
  cloudVersions: 'Vorige versies',
  cloudRestore: 'Herstellen',
  cloudCopy: 'Als nieuw document uploaden',
  cloudConnected: 'Documentserver verbonden',
  cloudDisconnected: 'Documentserver niet verbonden',
  cloudBusy: 'Documentserver is bezig…',
  cloudFailed: 'Serveractie mislukt. Lokale concepten blijven behouden.',
  cloudConflict:
    'De server heeft een andere versie. Open die apart of upload het concept als nieuw document.',
  cloudPending: 'Server-upload wacht',
  cloudNotice:
    'Externe Codex kan alleen gedeelde documenten lezen en bewerken. De sleutel blijft deze uitvoering in het geheugen.',
} satisfies Record<keyof typeof zh, string>
