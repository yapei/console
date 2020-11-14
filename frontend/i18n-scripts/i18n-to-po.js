const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const { i18nextToPo } = require('i18next-conv');
const common = require('./common.js');

function save(target) {
  return (result) => {
    fs.writeFileSync(target, result);
  };
}

function removeValues(i18nFile, filePath) {
  const file = require(i18nFile);

  const updatedFile = {};

  const keys = Object.keys(file);

  for (let i = 0; i < keys.length; i++) {
    updatedFile[keys[i]] = '';
  }

  const tmpFile = fs.openSync(filePath, 'w');

  fs.writeFileSync(tmpFile, JSON.stringify(updatedFile, null, 2));
}

function consolidateWithExistingTranslations(filePath, fileName, language, package) {
  let existingTranslationsPath;
  const englishFile = require(filePath);
  const englishKeys = Object.keys(englishFile);
  if (package) {
    existingTranslationsPath = `./../packages/${package}/locales/${language}/${fileName}.json`;
  } else {
    existingTranslationsPath = `./../public/locales/${language}/${fileName}.json`;
  }
  if (fs.existsSync(path.join(__dirname, existingTranslationsPath))) {
    const existingTranslationsFile = require(path.join(__dirname, existingTranslationsPath));
    const existingKeys = Object.keys(existingTranslationsFile);
    const matchingKeys = englishKeys.filter((k) => existingKeys.indexOf(k) > -1);

    for (let i = 0; i < matchingKeys.length; i++) {
      englishFile[matchingKeys[i]] = existingTranslationsFile[matchingKeys[i]];
    }

    const untrackedKeys = existingKeys.filter((k) => englishKeys.indexOf(k) === -1);
    for (let i = 0; i < untrackedKeys.length; i++) {
      englishFile[untrackedKeys[i]] = existingTranslationsFile[untrackedKeys[i]];
    }

    fs.writeFileSync(filePath, JSON.stringify(englishFile, null, 2));
  }
}

function processFile(fileName, package, language) {
  let tmpFile;
  if (package) {
    const i18nFile = path.join(__dirname, `./../packages/${package}/locales/en/${fileName}.json`);

    fs.mkdirSync(path.join(__dirname, `./../packages/${package}/locales/tmp`), {
      recursive: true,
    });

    tmpFile = path.join(__dirname, `./../packages/${package}/locales/tmp/${fileName}.json`);

    removeValues(i18nFile, tmpFile);
    consolidateWithExistingTranslations(tmpFile, fileName, language, package);

    fs.mkdirSync(path.join(__dirname, `./../po-files/${language}`), {
      recursive: true,
    });
    i18nextToPo(language, fs.readFileSync(tmpFile), {
      language,
      foldLength: 0,
      ctxSeparator: '~',
    }).then(
      save(
        path.join(
          __dirname,
          `./../po-files/${language}/${path.basename(fileName)}_package=${
            package.split('/')[0]
          }.po`,
        ),
      ),
    );
  } else {
    const i18nFile = path.join(__dirname, `./../public/locales/en/${fileName}.json`);

    fs.mkdirSync(path.join(__dirname, './../public/locales/tmp'), { recursive: true });

    tmpFile = path.join(__dirname, `./../public/locales/tmp/${fileName}.json`);

    removeValues(i18nFile, tmpFile);
    consolidateWithExistingTranslations(tmpFile, fileName, language);

    fs.mkdirSync(path.join(__dirname, `./../po-files/${language}`), { recursive: true });
    i18nextToPo(language, fs.readFileSync(tmpFile), {
      language,
      foldLength: 0,
      ctxSeparator: '~',
    }).then(
      save(
        path.join(__dirname, `./../po-files/${language}/${path.basename(fileName)}.po`),
        language,
      ),
    );
  }
  common.deleteFile(tmpFile);
  console.log(`Processed ${fileName}`);
}

const options = {
  string: ['language', 'package', 'file'],
  boolean: ['help'],
  array: ['files'],
  alias: {
    h: 'help',
    p: 'package',
    f: 'files',
    l: 'language',
  },
  default: {
    files: [],
  },
};

const args = minimist(process.argv.slice(2), options);

if (args.help) {
  return console.log(
    "-h: help\n-l: language (i.e. 'ja')\n-p: package (i.e. 'dev-console'; defaults to undefined)\n-f: file name to convert (i.e. 'nav')",
  );
}

if (args.files && args.language) {
  if (Array.isArray(args.files)) {
    for (let i = 0; i < args.files.length; i++) {
      processFile(args.files[i], args.package, args.language);
    }
  } else {
    processFile(args.files, args.package, args.language);
  }
}
