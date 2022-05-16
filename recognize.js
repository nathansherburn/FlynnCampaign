const tesseract = require("node-tesseract-ocr");
const sharp = require("sharp");
const fse = require("fs-extra");
const tessConfig = {};

// I'm so sorry if anyone ever needs to read this code.

const directories = fse.readdirSync("turfs");
const totalDirectories = directories.length - 2;
let currentDirectory = 0;
directories.forEach((dir) => {
  // if (dir !== "Salem Turf 15") {
  //   return
  // }
  if (fse.lstatSync("./turfs/" + dir).isDirectory()) {
    currentDirectory++;
    console.log(currentDirectory + "/" + totalDirectories);
    fse.ensureDir("outputs/raw-ocr-addresses/");
    fse.writeFileSync("outputs/raw-ocr-addresses/" + dir, "");
    fse.readdirSync("./turfs/" + dir).forEach(async function (file) {
      if (file.endsWith(".png")) {
        fse.ensureDirSync("./cleaned/" + dir);
        await cleanImage(
          "./turfs/" + dir + "/" + file,
          "./cleaned/" + dir + "/" + file
        ).catch((err) => {
          console.log(err);
        });
        recognizeText(dir, file);
      }
    });
  }
});

function cleanImage(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    sharp(inputPath).metadata().then(
      (metadata) => {
      let width = 950
      let height = 1800
      let top = 250
      if (metadata.width === 828) {
        width = 828
        height = 1400
        top = 160
      }
      sharp(inputPath)
        // initial image size is 1125 x 2436
        // or 828 × 1792
        // .extract({ left: 0, top: 250, width: 950, height: 1800 })
        .extract({ left: 0, top: top, width: width, height: height })
        .negate({ alpha: false })
        .withMetadata({ density: 300 })
        .toFile(outputPath, function (err) {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            resolve();
          }
        });
      })
  });
}

function recognizeText(dir, file) {
  tesseract
    .recognize("./cleaned/" + dir + "/" + file, tessConfig)
    .then((text) => {
      fse.appendFileSync("outputs/raw-ocr-addresses/" + dir, text);
      // console.log(text);
    })
    .catch((error) => {
      console.log(error.message);
    });
}
