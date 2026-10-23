import type zh from './zh'
export default {
  cloudTitle: 'बाहरी Codex के दस्तावेज़',
  cloudURL: 'दस्तावेज़ सर्वर का पता',
  cloudKey: 'स्वामी का कनेक्शन कुंजी',
  cloudConnect: 'सर्वर जोड़ें',
  cloudDisconnect: 'सर्वर से कनेक्शन हटाएँ',
  cloudSync: 'दस्तावेज़ सिंक करें',
  cloudRefresh: 'दस्तावेज़ रीफ़्रेश करें',
  cloudShare: 'बाहरी Codex से साझा करें',
  cloudUnshare: 'साझा करना बंद करें',
  cloudVersions: 'पिछले संस्करण',
  cloudRestore: 'पुनर्स्थापित करें',
  cloudCopy: 'नए दस्तावेज़ के रूप में अपलोड करें',
  cloudConnected: 'दस्तावेज़ सर्वर जुड़ा है',
  cloudDisconnected: 'दस्तावेज़ सर्वर जुड़ा नहीं है',
  cloudBusy: 'सर्वर पर काम हो रहा है…',
  cloudFailed: 'सर्वर कार्रवाई विफल हुई। स्थानीय ड्राफ्ट सुरक्षित हैं।',
  cloudConflict:
    'सर्वर पर दूसरा संस्करण है। अलग खोलें या ड्राफ्ट को नए दस्तावेज़ के रूप में अपलोड करें।',
  cloudPending: 'सर्वर अपलोड की प्रतीक्षा है',
  cloudNotice:
    'बाहरी Codex केवल साझा किए गए दस्तावेज़ पढ़ और बदल सकता है। कुंजी इस सत्र के दौरान केवल मेमोरी में रहती है।',
} satisfies Record<keyof typeof zh, string>
