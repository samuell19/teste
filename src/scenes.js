const path = (name, version = 2) => `/castle/${name}.webp?v=${version}`;

export const scenes = {
  exterior: {
    title: "O castelo", image: path("exterior", 3), ratio: 736 / 1308, focus: .5,
    description: "Castelo gótico sob uma lua cheia, com portões de ferro e uma escadaria iluminada.",
    hotspots: [
      { id: "enter", label: "Entrar no castelo", x: 53, y: 67, w: 38, h: 36, to: "hall", invisible: true },
    ],
    motes: "mist",
  },
  hall: {
    title: "A sala de estar", image: path("hall"), ratio: 736 / 1308, focus: .5,
    description: "Sala de estar de um castelo, com escadaria, biblioteca e móveis de veludo.",
    hotspots: [
      { id: "to-lounge", label: "Sala da lareira", x: 22, y: 72, w: 34, h: 17, to: "lounge", icon: "fire" },
      { id: "to-library", label: "Biblioteca", x: 61, y: 60, w: 26, h: 23, to: "library", icon: "book" },
      { id: "to-chapel", label: "Salão dos vitrais", x: 80, y: 38, w: 28, h: 24, to: "chapel", icon: "stairs" },
      { id: "to-dining", label: "Sala de jantar", x: 22, y: 35, w: 34, h: 20, to: "dining", icon: "door" },
      { id: "welcome", label: "Uma carta para você", x: 53, y: 78, w: 15, h: 8, type: "welcome", prop: "letter" },
      { id: "gift", label: "Seu presente", x: 83, y: 79, w: 20, h: 10, to: "secret", prop: "gift" },
    ],
    motes: "dust",
  },
  lounge: {
    title: "Sala da lareira",  image: path("lounge"), ratio: 1439 / 810, focus: .43,
    description: "Sala pintada à mão com sofás vermelhos, velas e uma lareira acesa.",
    hotspots: [
      { id: "song", label: "Uma música para você", x: 49, y: 56, w: 9, h: 13, type: "song", prop: "record" },
      { id: "note", label: "Ler a carta", x: 43, y: 58, w: 7, h: 9, type: "note", prop: "letter" },
      { id: "photo", label: "Uma lembrança", x: 35.5, y: 57, w: 7, h: 12, type: "photo", prop: "frame" },
      { id: "exit", label: "Voltar à sala de estar", x: 89, y: 63, w: 12, h: 24, to: "hall", icon: "door" },
    ],
    fire: { x: 41, y: 47 }, motes: "embers",
  },
  library: {
    title: "Biblioteca", image: path("library"), ratio: 1300 / 700, focus: .49, petFocus: .47,
    description: "Biblioteca gótica pintada com grandes colunas, livros e corredores secretos.",
    hotspots: [
      { id: "song", label: "Examinar o livro musical", x: 53, y: 79, w: 9, h: 15, type: "song", prop: "book" },
      { id: "note", label: "Uma carta nas entrelinhas", x: 58.5, y: 78, w: 7, h: 11, type: "note", prop: "letter" },
      { id: "photo", label: "Uma lembrança guardada", x: 45.5, y: 78, w: 7, h: 12, type: "photo", prop: "frame" },
      { id: "exit", label: "Voltar à sala de estar", x: 44, y: 64, w: 10, h: 20, to: "hall", icon: "door" },
    ], motes: "dust",
  },
  chapel: {
    title: "Salão dos vitrais", subtitle: "uma dança à meia-noite", image: path("chapel"), ratio: 1300 / 730, focus: .5, petFocus: .46,
    description: "Salão de castelo com vitrais vermelhos, pilares e um trono ao fundo.",
    hotspots: [
      { id: "song", label: "A música deste salão", x: 53, y: 81, w: 9, h: 15, type: "song", prop: "record" },
      { id: "note", label: "Uma carta no salão", x: 59.5, y: 81, w: 7, h: 11, type: "note", prop: "letter" },
      { id: "photo", label: "A luz dos vitrais", x: 44.5, y: 80, w: 7, h: 12, type: "photo", prop: "frame" },
      { id: "exit", label: "Voltar à sala de estar", x: 9, y: 74, w: 13, h: 25, to: "hall", icon: "door" },
    ], motes: "embers",
  },
  dining: {
    title: "Sala de jantar" , image: path("dining"), ratio: 1920 / 1081, focus: .47,
    description: "Salão ilustrado com mesa comprida, velas, estátuas e luz fria.",
    hotspots: [
      { id: "song", label: "Uma música à mesa", x: 51, y: 69, w: 8, h: 13, type: "song", prop: "record" },
      { id: "note", label: "Uma carta à sua espera", x: 42, y: 60, w: 7, h: 10, type: "note", prop: "letter" },
      { id: "photo", label: "Guardar uma lembrança", x: 56.5, y: 68, w: 7, h: 12, type: "photo", prop: "frame" },
      { id: "exit", label: "Voltar à sala de estar", x: 26, y: 42, w: 13, h: 24, to: "hall", icon: "door" },
    ], motes: "dust",
  },
  secret: {
    title: "Um cantinho só seu", subtitle: "o melhor ficou para o final", image: path("secret"), ratio: 1440 / 810, focus: .48,
    description: "Salão íntimo ilustrado com cortinas vermelhas, sofás e velas.",
    hotspots: [
      { id: "present", label: "Abrir seu presente", x: 48, y: 62, w: 14, h: 20, type: "gift", prop: "gift" },
      { id: "exit", label: "Voltar à sala de estar", x: 12, y: 43, w: 13, h: 27, to: "hall", icon: "door" },
    ], motes: "dust",
  },
};

export const musicRooms = ["lounge", "library", "chapel", "dining"];
