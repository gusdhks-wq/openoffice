import { createI18n, defineStrings } from '@genoffice/i18n'
import en from './en'
import ko from './ko'
import zh from './zh'
import zhTW from './zh-TW'
import ja from './ja'
import fr from './fr'
import de from './de'
import es from './es'
import pt from './pt'
import it from './it'
import nl from './nl'
import pl from './pl'
import cs from './cs'
import ru from './ru'
import id from './id'
import ms from './ms'
import vi from './vi'
import ar from './ar'
import he from './he'
import hi from './hi'
import th from './th'
export const translate = createI18n(
  defineStrings({
    en,
    ko,
    zh,
    'zh-TW': zhTW,
    ja,
    fr,
    de,
    es,
    pt,
    it,
    nl,
    pl,
    cs,
    ru,
    id,
    ms,
    vi,
    ar,
    he,
    hi,
    th,
  }),
)
export type MessageKey = keyof typeof zh
