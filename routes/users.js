var express = require('express');
var router = express.Router();

var param="bbbbbbb"; 

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json({
    status:"0",
    msg:param
  });
  res.send('respond with a resource');
});

module.exports = router;
