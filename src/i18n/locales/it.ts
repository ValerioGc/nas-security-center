export const it = {
  sectionsLabel: 'Sezioni',
  sections: {
    access: 'Accesso',
    devices: 'Dispositivi',
    certificates: 'Certificati',
    antivirus: 'Antivirus',
    logs: 'Log di sicurezza',
  },
  loading: 'Caricamento in corso',
  retry: 'Riprova',
  save: 'Salva',
  cancel: 'Annulla',
  add: 'Aggiungi',
  remove: 'Rimuovi',
  increase: 'Aumenta',
  decrease: 'Diminuisci',
  close: 'Chiudi',
  refresh: 'Aggiorna',
  launcherUnavailable: 'Il launcher non è al momento disponibile.',

  accessIntro:
    'Gestione delle notifiche di accesso, del blocco dei tentativi falliti e degli indirizzi autorizzati al NAS.',
  notifyFailures: 'Notifica accessi falliti',
  notifyFailuresNote:
    'I tentativi di accesso rifiutati vengono registrati nel log di sicurezza e notificati con indirizzo di origine, credenziale non valida e data dell’evento.',
  signInLock: 'Blocco dopo i tentativi falliti',
  signInLockNote:
    'Al raggiungimento del numero massimo di tentativi falliti, l’indirizzo di origine viene bloccato per la durata impostata.',
  signInLockAttempts: 'Tentativi',
  signInLockMinutes: 'Durata del blocco (minuti)',
  signInLockUnavailable:
    'Il gateway non è disponibile. Le impostazioni del blocco non sono accessibili.',
  discovery: 'Rilevamento in rete (NAS Finder)',
  discoveryNote: 'Consente a NAS Finder di trovare il NAS nella rete locale.',
  allowedAddresses: 'Indirizzi ammessi',
  allowedAddressesOn:
    'L’accesso al NAS è consentito esclusivamente agli indirizzi e alle reti elencati. Le connessioni già stabilite rimangono attive.',
  allowedAddressesOff:
    'In assenza di regole, l’accesso al NAS non è limitato dall’indirizzo di origine. L’aggiunta della prima regola attiva il filtro.',
  noAllowedAddresses: 'Nessuna regola di accesso configurata.',
  addAddress: 'Aggiungi indirizzo',
  accessRuleKind: 'Tipo',
  ruleKinds: { ip: 'Indirizzo', range: 'Intervallo' },
  accessRuleValue: 'Valore',
  ruleHints: { ip: 'Indirizzo IPv4 o IPv6', range: 'Rete in formato CIDR' },
  accessRuleLabel: 'Nome',
  accessRuleLabelHint: 'Portatile in studio',
  addedOn: 'Aggiunto il',

  devicesIntro: 'I dispositivi ammessi con un certificato del NAS e il loro stato.',
  addDevice: 'Aggiungi dispositivo',
  newDevice: 'Nuovo dispositivo',
  newDeviceNote:
    'Il certificato viene creato solo per questo dispositivo. È richiesta la password dell’account.',
  deviceReady: 'Dispositivo aggiunto',
  deviceDetails: 'Dettagli del dispositivo',
  deviceName: 'Nome',
  deviceIcon: 'Icona',
  deviceIcons: {
    desktop: 'PC fisso',
    laptop: 'Notebook',
    phone: 'Telefono',
    tv: 'Televisore',
    projector: 'Proiettore',
  },
  noDevices: 'Nessun dispositivo registrato',
  currentDevice: 'Questo dispositivo',
  syncClient: 'Client di sincronizzazione',
  deviceStates: {
    pending: 'In attesa del primo accesso',
    active: 'Attivo',
    revoked: 'Revocato',
    expired: 'Scaduto',
    none: 'Senza certificato',
  },
  lastSeen: 'Ultimo accesso',
  neverSeen: 'Mai collegato',
  never: 'Mai',
  createdOn: 'Aggiunto il',
  certificate: 'Certificato',
  certificateState: 'Stato',
  fingerprint: 'Impronta SHA-256',
  issuedOn: 'Emesso il',
  expiresOn: 'Scade il',
  activatedOn: 'Attivato il',
  renewCertificate: 'Rinnova certificato',
  renewNote:
    'Il certificato attuale non è più valido. Il nuovo certificato si attiva al primo accesso.',
  renewedNote:
    'Il certificato precedente non è più valido. Il nuovo certificato va installato sul dispositivo e si attiva al primo accesso.',
  certificateRenewed: 'Certificato rinnovato',
  revokeCertificate: 'Revoca certificato',
  revokeNote: 'Il dispositivo non può raggiungere il NAS fino al rinnovo del certificato.',
  revoke: 'Revoca',
  removeDevice: 'Rimuovi dispositivo',
  removeNote:
    'Il dispositivo e i suoi certificati verranno eliminati. L’operazione non può essere annullata.',
  ownDeviceLocked:
    'Dispositivo in uso. Revoca, rinnovo e rimozione sono disponibili da un altro dispositivo.',
  accountPassword: "Password dell'account",
  confirm: 'Conferma',
  done: 'Fine',
  mtlsSetup:
    'L’accesso con certificato richiede il certificato del dispositivo importato nel browser e il NAS aperto in HTTPS.',
  mtlsTitle: 'Accesso solo con certificato',
  mtlsNote:
    'Con l’opzione attiva il NAS risponde solo ai browser con il certificato di un dispositivo registrato. L’attivazione richiede un dispositivo aggiunto, il suo file .p12 importato nel browser e il NAS aperto in HTTPS.',
  mtlsUnavailable: 'Opzione non disponibile senza un’autorità di certificazione.',
  mtlsOnTitle: 'Attiva accesso con certificato',
  mtlsOffTitle: 'Disattiva accesso con certificato',
  mtlsOnNote:
    'I browser senza il certificato di un dispositivo registrato non potranno più raggiungere il NAS. È richiesta la password dell’account.',
  mtlsOffNote:
    'Il NAS torna raggiungibile da qualunque browser con nome utente e password. È richiesta la password dell’account.',
  credentialTitle: 'Certificato del dispositivo',
  credentialNote:
    'Il file va installato solo su questo dispositivo. Ogni dispositivo ha un certificato proprio, revocabile singolarmente.',
  credentialPassword: 'Password del file',
  credentialPasswordNote: 'Visualizzata solo ora e richiesta durante l’installazione del file.',
  downloadCertificate: 'Scarica certificato',
  authorityTitle: 'Autorità del NAS',
  authorityNote:
    'Installata tra le autorità attendibili, evita gli avvisi del browser sulla connessione al NAS.',
  downloadAuthority: 'Scarica autorità',
  wrongPassword: 'Password errata',
  tooManyAttempts: 'Troppi tentativi. Riprovare fra qualche minuto.',
  devicesUnavailable: 'Il gateway non risponde. I dispositivi non sono disponibili.',
  ownDevice: 'Dispositivo in uso. Azione disponibile da un altro dispositivo.',
  mtlsNeedsCertificate:
    'Questo browser non usa un certificato del NAS. Il certificato va installato prima di attivare l’opzione.',

  logsIntro: 'Registro dei tentativi di accesso rifiutati, ordinati dal più recente.',
  when: 'Quando',
  from: 'Da',
  wrongField: 'Campo sbagliato',
  fields: { username: 'Nome utente', password: 'Password' },
  noRefused: 'Nessun accesso rifiutato.',
  notifyOff:
    'La registrazione dei tentativi di accesso rifiutati è disattivata. L’opzione «Notifica accessi falliti» è disponibile nella sezione Accesso.',

  certificatesIntro:
    'Certificato HTTPS del NAS con indirizzi coperti, autorità di firma e scadenza.',
  httpsOff: 'HTTPS non attivo. Il certificato è pronto ma non viene usato.',
  plainConnection:
    'Pagina aperta in HTTP. La connessione non è cifrata e il browser la segnala come non sicura indipendentemente dal certificato installato.',
  openHttps: 'Apri in HTTPS',
  httpsSettingsTitle: 'Connessione HTTPS',
  httpsSettingsNote:
    'La porta e il reindirizzamento si applicano senza rigenerare il certificato o modificare l’autorità del NAS.',
  httpsPort: 'Porta HTTPS',
  forceHttps: 'Forza HTTPS',
  forceHttpsNote:
    'Reindirizza gli accessi HTTP verso HTTPS sulla porta scelta. Lo schermo collegato al NAS mantiene il proprio accesso locale.',
  invalidHttpsPort: 'Inserisci una porta intera tra 1 e 65535.',
  httpsSaveNote:
    'Il certificato rimane invariato. Se cambia la porta HTTPS o attivi il reindirizzamento, la console viene aperta sul nuovo indirizzo. Una porta già occupata non viene applicata.',
  httpsPortUnavailable: 'La porta HTTPS è già occupata o non disponibile.',
  httpsSaveFailed:
    'Non è stato possibile applicare le impostazioni HTTPS. La connessione precedente rimane attiva.',
  hostNotCovered:
    'Il NAS è stato raggiunto come «{host}», indirizzo non coperto dal certificato. Il browser lo segnala come non sicuro, anche con l’autorità installata, finché l’indirizzo non viene aggiunto ai nomi del certificato.',
  hostCovered:
    '«{host}» è coperto dal certificato. Se il browser lo segnala ancora come non sicuro, l’autorità del NAS non è installata tra quelle attendibili di questo dispositivo.',
  activeCertificate: 'Certificato in uso',
  certificateSources: { nas: 'Del NAS', custom: 'Personalizzato' },
  certificateSubject: 'Soggetto',
  certificateIssuer: 'Firmato da',
  certificateNames: 'Indirizzi coperti',
  validFrom: 'Valido dal',
  renewServerCertificate: 'Rigenera certificato',
  renewServerNote:
    'Viene emesso subito un nuovo certificato con la stessa autorità, quindi i browser che la considerano attendibile non richiedono modifiche. È richiesta la password dell’account.',
  useNasCertificate: 'Torna al certificato del NAS',
  useNasNote:
    'Il certificato personalizzato verrà eliminato e il NAS torna a usare il proprio. È richiesta la password dell’account.',
  extraNamesTitle: 'Indirizzi aggiuntivi',
  extraNamesNote:
    'Indirizzi coperti automaticamente dal certificato del NAS. È possibile aggiungere altri indirizzi di accesso, come un dominio, un nome dinamico o l’indirizzo di una VPN o di un inoltro.',
  extraNameHint: 'nas.esempio.it o 10.8.0.2',
  addName: 'Aggiungi',
  saveNames: 'Salva indirizzi',
  saveNamesNote:
    'Il certificato del NAS verrà emesso di nuovo con questi indirizzi. È richiesta la password dell’account.',
  invalidName: 'Indirizzo non valido. Sono ammessi nomi di dominio, anche con *., e indirizzi IP.',
  customTitle: 'Certificato personalizzato',
  customNote:
    'Certificato firmato da un’altra autorità, per esempio Let’s Encrypt, con la relativa chiave privata in formato PEM. Sostituisce quello del NAS fino alla scadenza.',
  certificateFile: 'Certificato (.crt, .pem)',
  keyFile: 'Chiave privata (.key, .pem)',
  uploadCertificate: 'Carica certificato',
  uploadNote:
    'Il certificato deve essere valido e corrispondere alla chiave privata. È richiesta la password dell’account.',
  customActiveNote:
    'Certificato personalizzato in uso. Gli indirizzi aggiuntivi valgono per il certificato del NAS.',
  authorityExpires: 'Scade il',
  trustTitle: 'Come rendere attendibile il NAS',
  trustSteps: {
    windows: {
      name: 'Windows',
      browsers: 'Chrome ed Edge',
      steps: [
        'Aprire il file scaricato e scegliere Installa certificato.',
        'Selezionare Computer locale.',
        'Scegliere Colloca tutti i certificati nel seguente archivio e indicare Autorità di certificazione radice attendibili.',
        'Confermare con Fine.',
      ],
    },
    macos: {
      name: 'macOS',
      browsers: 'Safari e Chrome',
      steps: [
        'Aprire il file scaricato con Accesso Portachiavi, nel portachiavi Sistema.',
        'Aprire il certificato «nas-os NAS authority» con un doppio clic.',
        'In Fidati, impostare Quando si usa questo certificato su Fidati sempre.',
        'Chiudere la finestra e confermare con la password del Mac.',
      ],
    },
    linux: {
      name: 'Linux',
      browsers: 'Chrome',
      steps: [
        'Aprire Impostazioni, Privacy e sicurezza, Sicurezza, Gestisci certificati.',
        'Nella scheda Autorità scegliere Importa e selezionare il file scaricato.',
        'Attivare «Considera attendibile questo certificato per identificare siti web» e confermare.',
      ],
    },
    firefox: {
      name: 'Firefox',
      browsers: 'Tutti i sistemi',
      steps: [
        'Aprire Impostazioni, Privacy e sicurezza, Certificati, Mostra certificati.',
        'Nella scheda Autorità scegliere Importa e selezionare il file scaricato.',
        'Attivare «Considera attendibile questa CA per l’identificazione di siti web» e confermare.',
      ],
    },
    android: {
      name: 'Android',
      browsers: 'Chrome',
      steps: [
        'Aprire Impostazioni, Sicurezza, Crittografia e credenziali.',
        'Scegliere Installa un certificato, Certificato CA, e confermare l’avviso.',
        'Selezionare il file scaricato.',
      ],
    },
    ios: {
      name: 'iPhone e iPad',
      browsers: 'Safari',
      steps: [
        'Aprire il file scaricato e consentire il download del profilo.',
        'In Impostazioni, Profilo scaricato, scegliere Installa.',
        'In Generali, Info, Impostazioni certificati attendibili, attivare «nas-os NAS authority».',
      ],
    },
  },
  trustPlatforms: 'Sistemi',
  trustAfter: 'Al termine riavviare il browser e riaprire il NAS in HTTPS.',
  antivirus: {
    openSettings: 'Apri impostazioni',
    disableConfirm:
      'Le scansioni e l’aggiornamento delle firme vengono fermati. L’antivirus resta installato, con impostazioni e quarantena invariate.',
    confirmDisable: 'Conferma disattivazione',
    loadingStatus: 'Lettura dello stato dell’antivirus in corso',
    preparing: 'Preparazione dell’antivirus in corso',
    emptyQuarantineNote:
      'I file rilevati spostati in quarantena vengono elencati qui, isolati dal resto del NAS.',
    scanCards: 'Opzioni di ogni tipo di scansione',
    intro: 'Scansioni, pianificazione e quarantena dell’antivirus del NAS.',
    settings: 'Impostazioni antivirus',
    enabled: 'Antivirus abilitato',
    disabled: 'Antivirus disabilitato',
    enable: 'Abilita e installa l’antivirus',
    disable: 'Disabilita antivirus',
    disabledNote:
      'L’antivirus è disattivato per impostazione predefinita. L’attivazione installa l’antivirus e scarica le firme.',
    enabledNote:
      'L’antivirus esegue le scansioni richieste e mantiene aggiornate le firme. Le scansioni periodiche vengono eseguite anche con l’app chiusa.',
    progress: 'Avanzamento operazione',
    scan: 'Scansione',
    scanType: 'Tipo di scansione',
    startScan: 'Avvia scansione',
    paths: 'Percorsi assoluti sul NAS, uno per riga',
    pathsHint: '/srv/storage/Documenti',
    defaultPaths: 'Percorsi predefiniti, uno per riga',
    exclusions: 'Percorsi esclusi, uno per riga',
    archives: 'Scansiona gli archivi',
    detectPua: 'Rileva applicazioni potenzialmente indesiderate',
    maxFileMb: 'Dimensione massima del file (MiB)',
    limitsNote:
      'I file oltre il limite, anche negli archivi, non vengono controllati. Collegamenti simbolici, filesystem virtuali e dati interni del NAS sono esclusi.',
    result: 'Ultima scansione',
    scanned: 'File controllati',
    found: 'Minacce rilevate',
    skipped: 'Saltati perché non modificati',
    skipUnchanged: 'Ignora i file non modificati dall’ultima scansione',
    incrementalNote:
      'I file trovati puliti e non modificati da allora vengono saltati. Dopo 30 giorni vengono controllati di nuovo con le firme aggiornate.',
    scannedArchive: 'File già controllati',
    scannedArchiveNote:
      'La scansione rapida, e la personalizzata con l’opzione attiva, salta i file già controllati e non modificati. Dopo questa operazione la scansione successiva controlla tutti i file.',
    forgetScanned: 'Dimentica i file già scansionati',
    clean: 'Scansione completata senza minacce rilevate.',
    quarantine: 'Quarantena',
    emptyQuarantine: 'La quarantena è vuota.',
    moveToQuarantine: 'Sposta in quarantena',
    restore: 'Ripristina',
    delete: 'Elimina definitivamente',
    restoreNote:
      'Il file tornerà nel percorso originale. Può contenere una minaccia. Un file già presente non viene sovrascritto.',
    deleteNote:
      'Il file in quarantena sarà eliminato definitivamente. L’operazione non può essere annullata.',
    autoQuarantine: 'Quarantena automatica',
    quarantineNote:
      'I file rilevati possono essere isolati in una cartella privata sul NAS. Per impostazione predefinita le minacce vengono segnalate e la quarantena è manuale.',
    bootScan: "Scansione all'avvio del sistema",
    shutdownScan: 'Scansione allo spegnimento del sistema',
    lifecycleNote:
      'Ogni scansione usa le opzioni del tipo selezionato. All’avvio il NAS è disponibile al termine della scansione. Spegnimento e riavvio attendono la sua conclusione, al massimo 24 ore.',
    powerLoading: 'Lettura delle regole di alimentazione in corso',
    powerUnavailable:
      'Regole di alimentazione non disponibili. Non è possibile verificare gli orari.',
    powerOff: 'Il NAS risulta spento a questo orario. È necessario modificare la pianificazione.',
    powerSoon:
      'È previsto uno spegnimento o riavvio entro 30 minuti. La scansione potrebbe essere interrotta.',
    schedulerEnabled: 'Abilita scansioni periodiche',
    scheduleNote:
      'Gli orari seguono il fuso orario del NAS. Le scansioni pianificate usano le opzioni del tipo scelto. Con una scansione già in corso, quella pianificata viene saltata e notificata.',
    job: 'Job',
    jobEnabled: 'Job attivo',
    addJob: 'Aggiungi job',
    day: 'Giorno',
    time: 'Orario',
    kinds: {
      full: 'Totale',
      quick: 'Rapida',
      file: 'File',
      custom: 'Personalizzata',
    },
    scope: {
      full: 'Controlla il sistema e i dati del NAS, esclusi filesystem virtuali, collegamenti simbolici e dati interni.',
      quick: 'Controlla /home, /tmp e /var/tmp. I percorsi sono modificabili nelle impostazioni.',
      file: 'Controlla un singolo file presente sul NAS.',
      custom:
        'Controlla i file e le cartelle indicati. Senza percorsi usa quelli delle impostazioni.',
    },
    phases: {
      configuring: 'Salvataggio delle impostazioni in corso',
      installing: 'Download e installazione dell’antivirus in corso',
      updating: 'Download delle firme in corso',
      disabling: 'Disattivazione del servizio in corso',
      scanning: 'Scansione in corso',
      quarantine: 'Gestione della quarantena in corso',
      resuming: 'Verifica del servizio antivirus in corso',
      forgetting: 'Eliminazione dell’elenco dei file controllati in corso',
    },
    days: {
      everyday: 'Ogni giorno',
      monday: 'Lunedì',
      tuesday: 'Martedì',
      wednesday: 'Mercoledì',
      thursday: 'Giovedì',
      friday: 'Venerdì',
      saturday: 'Sabato',
      sunday: 'Domenica',
    },
    chooseFile: 'Scegli file dal NAS',
    chooseFolder: 'Scegli cartella dal NAS',
    tabs: {
      general: 'Generale',
      scheduler: 'Pianificazione',
      scans: 'Scansioni',
      quarantine: 'Quarantena',
    },
  },
};
