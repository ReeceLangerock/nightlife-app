const mongoose = require('mongoose');

// schema for new bar
var barSchema = mongoose.Schema({
  'expireAt': Date, expireAfterSeconds: 0, //ttl for entry
  '_id': String,
  'attending': [{
    'personAttending' : String,
     '_id' : false
  }]
});

barSchema.methods.newBar = function(id, person, offset){
  // offset for utc of bar location and set ttl to midnight of current day
  var d = new Date();
  offset = 24 - offset;
  if(offset > 24){
    offset -= 24;
  }
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
