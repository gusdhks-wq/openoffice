import type zh from './zh'
export default {
  driveCancelPending: 'Отменить ожидающее создание (сохранить файлы Drive)',
  driveLiveMode: 'Редактируемые документы Google',
  driveBackupMode: 'Прежние резервные копии файлов',
  driveLiveNotice:
    'Синхронизируйте текстовые документы Google без ПК. В ChatGPT редактируйте тот же документ через Google Drive. Таблицы, форматированные документы и несколько вкладок здесь не редактируются.',
  driveGoogleLink: 'Открыть документ Google',
  driveLiveConflict: 'Обе копии изменены. Черновик сохранён. Откройте копию Drive отдельно.',
  driveUnsupported:
    'Неподдерживаемое содержимое или форматирование. Оригинал и локальный черновик сохранены.',
  driveUncertain:
    'Результат Google неизвестен. Повторите синхронизацию, чтобы найти тот же файл; не создавайте новую копию.',
  driveSetupHint:
    'Включите Drive API и Docs API в Google Cloud. Зарегистрируйте пакет и сертификат Android либо веб-клиент OAuth для этого источника. Секрет клиента не нужен.',
  driveWebClientId: 'ID веб-клиента OAuth (публичный)',
  driveSaveSetup: 'Сохранить вход',
  driveConnect: 'Подключить Диск',
  driveDisconnect: 'Отключить Диск',
  driveSync: 'Синхронизировать документ',
  driveRefresh: 'Обновить',
  driveRemoteFiles: 'Версии на Диске',
  driveConnected: 'Диск подключён',
  driveDisconnected: 'Диск отключён',
  driveBusy: 'Синхронизация…',
  driveSynced: 'Синхронизация завершена',
  driveConflict: 'Есть несколько версий. Откройте каждую ветку в списке Диска.',
  driveFailed: 'Ошибка операции с Диском. Локальные документы сохранены.',
  driveSetup: 'Сначала настройте Google OAuth. См. инструкцию по настройке.',
  driveAccountMismatch: 'Документ связан с другим аккаунтом Диска. Подключите этот аккаунт.',
  drivePending: 'Отправка ожидает на этом устройстве',
  driveOffline: 'Нет сети. Синхронизация связанных документов повторится при подключении.',
  driveNotice: 'Диск хранит изменения в новых файлах. Облачный ИИ не подключён.',
} satisfies Record<keyof typeof zh, string>
