import type zh from './zh'
export default {
  driveCancelPending: 'लंबित निर्माण रद्द करें (Drive फ़ाइलें रखें)',
  driveLiveMode: 'संपादन योग्य Google दस्तावेज़',
  driveBackupMode: 'पुराने फ़ाइल बैकअप',
  driveLiveNotice:
    'PC के बिना सादा पाठ Google दस्तावेज़ सिंक करें। ChatGPT में उसी दस्तावेज़ को Google Drive से संपादित करें। यहाँ तालिकाएँ, फ़ॉर्मैट वाले या कई टैब वाले दस्तावेज़ संपादित नहीं होते।',
  driveGoogleLink: 'Google दस्तावेज़ खोलें',
  driveLiveConflict: 'दोनों प्रतियाँ बदली हैं। ड्राफ़्ट सुरक्षित है। Drive की प्रति अलग से खोलें।',
  driveUnsupported: 'सामग्री या फ़ॉर्मैट समर्थित नहीं है। मूल और स्थानीय ड्राफ़्ट सुरक्षित हैं।',
  driveUncertain:
    'Google का परिणाम स्पष्ट नहीं है। वही फ़ाइल खोजने के लिए फिर सिंक करें; नई प्रति न बनाएँ।',
  driveSetupHint:
    'Google Cloud में Drive API और Docs API चालू करें। Android पैकेज और हस्ताक्षर प्रमाणपत्र या इस मूल के लिए वेब OAuth क्लाइंट पंजीकृत करें। क्लाइंट सीक्रेट की आवश्यकता नहीं है।',
  driveWebClientId: 'वेब OAuth क्लाइंट ID (सार्वजनिक)',
  driveSaveSetup: 'लॉगिन सेटअप सहेजें',
  driveConnect: 'Drive जोड़ें',
  driveDisconnect: 'Drive का कनेक्शन हटाएँ',
  driveSync: 'यह दस्तावेज़ सिंक करें',
  driveRefresh: 'रीफ़्रेश करें',
  driveRemoteFiles: 'Drive संस्करण',
  driveConnected: 'Drive जुड़ा है',
  driveDisconnected: 'Drive जुड़ा नहीं है',
  driveBusy: 'सिंक हो रहा है…',
  driveSynced: 'सिंक पूरा हुआ',
  driveConflict: 'कई संस्करण हैं। Drive सूची से हर शाखा खोलें।',
  driveFailed: 'Drive कार्रवाई विफल हुई। स्थानीय दस्तावेज़ सुरक्षित हैं।',
  driveSetup: 'पहले Google OAuth सेट करें। ऐप की सेटअप मार्गदर्शिका देखें।',
  driveAccountMismatch: 'यह दस्तावेज़ दूसरे Drive खाते का है। वह खाता जोड़ें।',
  drivePending: 'इस डिवाइस पर अपलोड कतार में है',
  driveOffline: 'ऑफ़लाइन। जुड़ने पर संबद्ध दस्तावेज़ फिर सिंक होंगे।',
  driveNotice: 'Drive बदलावों को नई फ़ाइलों में रखता है। क्लाउड AI जुड़ा नहीं है।',
} satisfies Record<keyof typeof zh, string>
