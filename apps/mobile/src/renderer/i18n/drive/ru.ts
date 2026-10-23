import type zh from './zh'
export default {
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
