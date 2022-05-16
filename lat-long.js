const fse = require("fs-extra");
const axios = require("axios");
const API_KEY = "SEE README";

fse.readdirSync("outputs/raw-ocr-addresses").forEach(async function (file) {
  fse.writeFileSync("outputs/" + file + ".csv", "Address,Latitude,Longitude\n");
  const startOfLine = /\d+ (N|S|E|W)/g;
  const endOfLine = /, OR \d+$/gm;
  const lines = fse
    .readFileSync("./outputs/raw-ocr-addresses/" + file, "utf8")
    .split("\n");
  for (let i = 0; i < lines.length; i++) {
    let address;
    if (lines[i] && lines[i + 1] && lines[i].match(startOfLine)) {
      address = lines[i] + ", " + lines[i + 1];
    } else if (lines[i-1] && lines[i] && lines[i].match(endOfLine)) {
      address = lines[i-1] + ", " + lines[i];
    } else {
      address = null
    }
    if (address !== null) {
      const queryAddress = encodeURI(address.replace(/OR \d+$/g, "Oregon"));
      setTimeout(() => {
        axios
          .get(
            "https://maps.googleapis.com/maps/api/geocode/json?" +
              "&address=" +
              queryAddress +
              "&key=" +
              API_KEY
          )
          .then((res) => {
            if (res.data?.results[0]) {
              const latlong = res.data?.results[0].geometry?.location;
              fse.appendFileSync(
                "outputs/" + file + ".csv",
                '"' +
                  address +
                  '", ' +
                  latlong.lat +
                  ", " +
                  latlong.lng +
                  "\n"
              );
            } else {
              console.log(res.data?.results);
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }, Math.random() * 60000); // spread request across 1 min
    }
  }
});
