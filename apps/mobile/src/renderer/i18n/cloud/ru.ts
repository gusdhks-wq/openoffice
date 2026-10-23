import type zh from './zh'
export default {
  cloudTitle: 'Документы для внешнего Codex',
  cloudURL: 'Адрес сервера документов',
  cloudKey: 'Ключ подключения владельца',
  cloudConnect: 'Подключить сервер',
  cloudDisconnect: 'Отключить сервер',
  cloudSync: 'Синхронизировать документ',
  cloudRefresh: 'Обновить документы',
  cloudShare: 'Открыть доступ внешнему Codex',
  cloudUnshare: 'Закрыть доступ',
  cloudVersions: 'Предыдущие версии',
  cloudRestore: 'Восстановить',
  cloudCopy: 'Загрузить как новый документ',
  cloudConnected: 'Сервер документов подключён',
  cloudDisconnected: 'Сервер документов отключён',
  cloudBusy: 'Работа с сервером…',
  cloudFailed: 'Ошибка сервера. Локальные черновики сохранены.',
  cloudConflict:
    'На сервере другая версия. Откройте её отдельно или загрузите черновик как новый документ.',
  cloudPending: 'Отправка на сервер ожидается',
  cloudNotice:
    'Внешний Codex может читать и менять только общие документы. Ключ хранится в памяти только на время запуска.',
} satisfies Record<keyof typeof zh, string>
