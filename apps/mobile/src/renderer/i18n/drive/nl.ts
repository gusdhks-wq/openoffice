import type zh from './zh'
export default {
  driveCancelPending: 'Wachtende aanmaak annuleren (Drive-bestanden behouden)',
  driveLiveMode: 'Bewerkbare Google-documenten',
  driveBackupMode: 'Oude bestandsback-ups',
  driveLiveNotice:
    'Synchroniseer Google-documenten als platte tekst zonder PC. Bewerk hetzelfde document via Google Drive in ChatGPT. Tabellen, opgemaakte documenten en meerdere tabbladen worden hier niet bewerkt.',
  driveGoogleLink: 'Google-document openen',
  driveLiveConflict:
    'Beide kopieën zijn gewijzigd. Het concept blijft bewaard. Open de Drive-kopie apart.',
  driveUnsupported:
    'Niet-ondersteunde inhoud of opmaak. Origineel en lokaal concept blijven bewaard.',
  driveUncertain:
    'Google-resultaat onzeker. Probeer opnieuw te synchroniseren om hetzelfde bestand te vinden; maak geen extra kopie.',
  driveSetupHint:
    'Schakel Drive API en Docs API in Google Cloud in. Registreer het Android-pakket en ondertekeningscertificaat of een web-OAuth-client voor deze exacte oorsprong. Geen clientgeheim nodig.',
  driveWebClientId: 'Web-OAuth-client-ID (openbaar)',
  driveSaveSetup: 'Aanmelding opslaan',
  driveConnect: 'Drive verbinden',
  driveDisconnect: 'Drive loskoppelen',
  driveSync: 'Dit document synchroniseren',
  driveRefresh: 'Vernieuwen',
  driveRemoteFiles: 'Drive-versies',
  driveConnected: 'Drive verbonden',
  driveDisconnected: 'Drive niet verbonden',
  driveBusy: 'Synchroniseren…',
  driveSynced: 'Synchronisatie voltooid',
  driveConflict: 'Er zijn meerdere versies. Open elke tak vanuit de Drive-lijst.',
  driveFailed: 'Drive-actie mislukt. Lokale documenten blijven behouden.',
  driveSetup: 'Stel eerst Google OAuth in. Zie de installatiehandleiding.',
  driveAccountMismatch: 'Dit document hoort bij een ander Drive-account. Verbind dat account.',
  drivePending: 'Upload op dit apparaat in wachtrij',
  driveOffline: 'Offline. Gekoppelde documenten worden bij verbinding opnieuw gesynchroniseerd.',
  driveNotice: 'Drive bewaart wijzigingen als nieuwe bestanden. Cloud-AI is niet verbonden.',
} satisfies Record<keyof typeof zh, string>
