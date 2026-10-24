import hwp from './hwp/ru'
import cloud from './cloud/ru'
import drive from './drive/ru'
import type zh from './zh'
export default {
  ...hwp,
  ...cloud,
  ...drive,
  prototype: 'Мобильный прототип',
  newDocument: 'Новый документ',
  importFile: 'Импорт',
  exportFile: 'Экспорт',
  documents: 'Документы',
  editor: 'Содержимое документа',
  saved: 'Сохранено на устройстве',
  saving: 'Сохранение…',
  saveFailed: 'Не сохранено. Перед выходом экспортируйте копию.',
  retry: 'Повторить сохранение',
  loading: 'Загрузка…',
  openFailed: 'Не удалось открыть локальное хранилище. Обновите страницу.',
  importFailed: 'Выберите файл UTF-8 .md или .txt размером менее 2 МБ.',
  exportFailed: 'Не удалось экспортировать файл.',
  localOnly: 'Документы сначала сохраняются на этом устройстве. Внешние подключения необязательны.',
  untitled: 'Без названия',
  empty: 'Создайте или импортируйте документ.',
  language: 'Язык',
} satisfies Record<keyof typeof zh, string>
