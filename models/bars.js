const mongoose = require('mongoose');

var barSchema = mongoose.Schema({
  'expireAt': Date, expireAfterSeconds: 0,
  '_id': String,
  'attending': [{
    'personAttending' : String,
     '_id' : false
  }]
});

barSchema.methods.newBar = function(id, person, offset){
  console.log("new bar");
  var d = new Date();
  offset = 24 - offset;
  if(offset > 24){
    offset -= 24;
  }
  console.log(offset);
  d.setUTCHours(offset,0,0,0);
  var newBar = new barModel({
    'expireAt': d,
    '_id': id,
    'attending': [{
      'personAttending' :person,
      '_id' : false
    }]
  });

  newBar.save(function(err){
    if(err){
      
      throw err;
    }
    else{

      return 'success';
    }
  })
}

var barModel = mongoose.model('bar', barSchema, 'bars');
module.exports = barModel;
