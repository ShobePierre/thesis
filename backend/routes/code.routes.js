const express = require("express");
const router = express.Router();
const compilerController = require("../controllers/codeExecution.controller");

router.post("/runcode", compilerController.runCodeSession);

module.exports = router;
