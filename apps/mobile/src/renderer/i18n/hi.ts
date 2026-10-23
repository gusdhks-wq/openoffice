import hwp from './hwp/hi'
import cloud from './cloud/hi'
import drive from './drive/hi'
import type zh from './zh'
export default {
  ...hwp,
  ...cloud,
  ...drive,
  prototype: 'मोबाइल प्रारूप',
  newDocument: 'नया दस्तावेज़',
  importFile: 'आयात',
  exportFile: 'निर्यात',
  documents: 'दस्तावेज़',
  editor: 'दस्तावेज़ की सामग्री',
  saved: 'इस डिवाइस पर सहेजा गया',
  saving: 'सहेज रहा है…',
  saveFailed: 'सहेजा नहीं गया। बाहर जाने से पहले प्रति निर्यात करें।',
  retry: 'फिर सहेजें',
  loading: 'लोड हो रहा है…',
  openFailed: 'स्थानीय संग्रह नहीं खुला। पृष्ठ फिर लोड करें।',
  importFailed: '2 MB से छोटी UTF-8 .md या .txt फ़ाइल चुनें।',
  exportFailed: 'फ़ाइल निर्यात नहीं हुई।',
  localOnly: 'दस्तावेज़ पहले इस डिवाइस पर सहेजे जाते हैं। बाहरी कनेक्शन वैकल्पिक हैं।',
  untitled: 'बिना शीर्षक',
  empty: 'शुरू करने के लिए दस्तावेज़ बनाएँ या आयात करें।',
  language: 'भाषा',
} satisfies Record<keyof typeof zh, string>
