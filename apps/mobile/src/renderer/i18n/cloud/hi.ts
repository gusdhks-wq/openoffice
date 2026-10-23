import type zh from './zh'
export default {
  cloudMethod: 'कनेक्शन का तरीका',
  cloudPairCode: 'फ़ोन कोड (8 अंक)',
  cloudPairHelp:
    'PC की Mobile-connect विंडो में दिखा फ़ोन कोड डालें। यह 3 मिनट तक केवल एक बार मान्य है। नए कोड के लिए PC पर P लिखकर Enter दबाएँ। यह ChatGPT अनुमोदन कोड से अलग है।',
  cloudAuthFailed:
    'प्रमाणीकरण समाप्त हो गया या कोड गलत है। PC से नया फ़ोन कोड लेकर फिर कनेक्ट करें।',
  cloudReconnect: 'इस दस्तावेज़ को वर्तमान पते से फिर जोड़ें',
  cloudReconnectHelp:
    'उसी दस्तावेज़ सर्वर का पता बदल गया है। डिवाइस का ड्राफ़्ट और पिछले संस्करण बनाए रखते हुए फिर कनेक्ट करें।',
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
