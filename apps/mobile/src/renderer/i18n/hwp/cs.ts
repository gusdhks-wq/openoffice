import type zh from './zh'
export default {
  hwpTitle: 'Pracovní prostor HWP · experimentální',
  hwpScope:
    'Otevřete HWP/HWPX místně a nahrazujte text v odstavcích či buňkách. Změny a originál se ukládají do znovu importovatelné pracovní kopie. Export upraveného HWP/HWPX, AI a synchronizace Drive zatím nejsou dostupné. Písma mohou změnit stránkování.',
  hwpOpen: 'Otevřít HWP nebo pracovní kopii',
  hwpOriginal: 'Exportovat originál před úpravami',
  hwpBackup: 'Exportovat pracovní kopii',
  hwpPrevious: 'Předchozí stránka',
  hwpNext: 'Další stránka',
  hwpPage: 'Stránka dokumentu',
  hwpFind: 'Nahrazovaný text · jedinečná fráze',
  hwpReplacement: 'Nový text',
  hwpReplace: 'Nahradit a uložit místně',
  hwpUndo: 'Vrátit poslední úpravu',
  hwpFailed:
    'Otevření či úprava se nezdařily. Ověřte opakovaný text, formát a úložiště. Dosavadní práce zůstává zachována.',
} satisfies Record<keyof typeof zh, string>
