const express = require("express");
const Azure = require("azure-storage");
const fs = require("fs-extra");
const path = require("path");
const mockKey =
  "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;";
const app = express();
const port = 3000;

const blobService = Azure.createBlobService(mockKey);

app.get("/put", async (req, res) => {
  try {
    const file = fs.readFileSync(path.resolve(req.headers.filepath));
    const newFileName = "test" + path.extname(req.headers.filepath);
    fs.writeFileSync(newFileName, file);
    const container = req.headers.container;

    res.status(200).send(await put(container, newFileName));
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/get", async (req, res) => {
  try {
    res.send(await read(req.headers.container, req.headers.filename));
  } catch (err) {
    res.send(err);
  }
});

const limit = 1000;
const start = 0;

async function stressTest(container, filename) {
  try {
    while (start <= limit) {
      start++;
      await read(container, filename);
    }

    return {message:'done'};
  } catch (err) {
    throw err;
  }
}

async function put(container, newFileName) {
  return new Promise((resolve, reject) => {
    blobService.createContainerIfNotExists(
      container,
      {
        publicAccessLevel: "blob"
      },
      (error, result, response) => {
        if (error) reject({ error: error });
        blobService.createBlockBlobFromLocalFile(
          container,
          newFileName,
          newFileName,
          (error, response) => {
            if (error) reject({ error: error });

            resolve(200);
          }
        );
      }
    );
  });
}

async function read(container, filename) {
  return new Promise((resolve, reject) => {
    blobService.getBlobToStream(
      container,
      filename,
      fs.createWriteStream(filename),
      function(error, result, response) {
        if (!error) {
          const bytes = fs.readFileSync(filename);
          fs.removeSync(filename);
          resolve(bytes);
        } else {
          reject({ error: error });
        }
      }
    );
  });
}
app.listen(port, () => console.log(`Example app listening on port ${port}!`));