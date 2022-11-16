// Imports the Google Cloud client library
import { v2 } from '@google-cloud/translate';

const Translate = v2.Translate
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

export async function SimpleTranslater(text, source, target) {
  
  const reqOptions = {
    from: source,
    to: target
  }
  console.log(reqOptions);
  const [translation] = await translate.translate(text, reqOptions);
  return translation;
}

export default Translater;