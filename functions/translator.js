// Imports the Google Cloud client library
const {Translate} = require('@google-cloud/translate').v2;

const projectId = 'wired-compass-334608';

// Instantiates a client
const translate = new Translate({projectId});

async function Translater(req, res) {
  // The text to translate
  const text = 'Hello world!';

  // The target language
  const target = 'tr';

  // Translates some text into Russian
  const [translation] = await translate.translate(text, target);
  console.log(`Text: ${text}`);
  console.log(`Translation: ${translation}`);
  res.send(translation)
}

export default Translater;