import type zh from './zh'
export default {
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
