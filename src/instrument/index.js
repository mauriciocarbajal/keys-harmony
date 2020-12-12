/**
 * This file implements the instrument itself
 * which is served to different handlers (leapHandler and cliHandler)
 * 
 * Handlers will pass the chord to be played
 * Example: play the V7 of the IIIm chord, with tensions
 * 
 */

const easymidi = require('easymidi');

const {
  diatonicChords,
  secDomChords,
} = require('./chords');

const {
  invert,
  addTension,
 } = require('./alter');

 const {
  tonalityName,
  getChordName,
  getGradeName,
 } = require('./utils')

const DEFAULT_CURRENT_KEY = 60;
const DEFAULT_CHANNEL = 0;

var midiOutput;

const startInstrument = () => {
  midiOutput = new easymidi.Output('keys-harmony-output', true);
  releasePedal();
}

const getChords = (currentKey = DEFAULT_CURRENT_KEY) => {
  return {
    chords: [, ...Object.values(diatonicChords(currentKey))],
    secDomChords: [, ...Object.values(secDomChords(currentKey))],
  }
}

let currentKey = DEFAULT_CURRENT_KEY;
let table = getChords(currentKey);

const getCurrentTonality = () => {
  return tonalityName(currentKey % 12)
}

const playChord = (grade, secDom, subMin) => {
  let notes;
  let currentTable = table;
  let newGrade = grade;
  let chordKey = currentKey;
  let label;

  if (subMin) {
    // Sub min tonality chord
    chordKey = currentKey + 3;
    currentTable = getChords(chordKey);
    newGrade = ((grade + 4) % 7) + 1;
  }
  
  if (secDom) {
    // Secondary dominant chord
    notes = currentTable.secDomChords[newGrade];

    // label... it's complicated...
    if (newGrade == 1) label = getChordName(tonalityName(chordKey % 12), 5);
    if (newGrade == 2) label = getChordName(tonalityName((chordKey+2) % 12), 5);
    if (newGrade == 3) label = getChordName(tonalityName((chordKey+4) % 12), 5);
    if (newGrade == 4) label = getChordName(tonalityName((chordKey+5) % 12), 5);
    if (newGrade == 5) label = getChordName(tonalityName((chordKey+7) % 12), 5);
    if (newGrade == 6) label = getChordName(tonalityName((chordKey+9) % 12), 5);
    if (newGrade == 7) label = getChordName(tonalityName((chordKey+11) % 12), 5);

  } else {
    // Diatonic chord
    notes = currentTable.chords[newGrade];
    label = getChordName(tonalityName(chordKey % 12), newGrade);
  }

  releaseChordsPedal(midiOutput)
  notes.forEach((note) => {
    midiOutput.send('noteon', {
      note: note,
      velocity: 64,
      channel: DEFAULT_CHANNEL,
    });
  });

  return {
    label,
    gradeName: getGradeName(newGrade),
  };
}

const playSingleNote = (singleNote) => {
  midiOutput.send('noteon', {
    note: currentKey + 12 + singleNote,
    velocity: 64,
    channel: DEFAULT_CHANNEL,
  });
}

const moveTonality = (n) => {
  currentKey = currentKey + n;
  table = getChords(currentKey);
}

const sendControlChange = (value, controller = 7) => {
  midiOutput.send('cc', {
    controller,
    value,
    channel: DEFAULT_CHANNEL,
  })
}

const sendPitchChange = (value) => {
  midiOutput.send('pitch', {
    value,
    channel: DEFAULT_CHANNEL,
  })
}

const releasePedal = () => {
  for (let i = 0; i < 128; i = i + 1) {
    midiOutput.send('noteoff', {
      note: i,
      velocity: 0,
      channel: DEFAULT_CHANNEL,
    });

    midiOutput.send('reset')
  }
};

const releaseChordsPedal = () => {
  for (let i = 0; i < currentKey + 12; i = i + 1) {
    midiOutput.send('noteoff', {
      note: i,
      velocity: 0,
      channel: DEFAULT_CHANNEL,
    });

    midiOutput.send('reset')
  }
}

const closeInstrument = () => {
  midiOutput.close();
}


module.exports = {
  startInstrument,
  getChords,
  instrumentFeatures: {
    getCurrentTonality,
    playChord,
    playSingleNote,
    sendControlChange,
    sendPitchChange,
    releasePedal,
    moveTonality,
  },
  closeInstrument,
}
