"use strict";

const { constants, promises : fs } = require("fs");

function exists(target) {
  return new Promise((resolve) => {
    fs.access(target, constants.F_OK)
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
}

function mkdir(target) {
  return new Promise((resolve, reject) => {
    fs.mkdir(target, { recursive: true })
      .then(() => resolve())
      .catch((err) => reject(err));
  });
}

module.exports = { exists, mkdir };