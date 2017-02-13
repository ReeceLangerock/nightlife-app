var express = require('express');
var router = express.Router();

//sign out of oAuth
router.get('/', (req, res) => {  
  req.logout();
  req.session = null;
  res.redirect('/');
});

module.exports = router;
