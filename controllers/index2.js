// setup
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var Yelp = require('yelp');
var config = require('../config.js');
var yelp = new Yelp(config.getYelpConfig());
var bars = require('../models/bars.js')
var numBarsToDisplay = 15;

router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());

router.get('/', function(req, res) {

    if (!req.session.lastSearch) {
        res.render('index', {
            data: null,
            search: null,
            pageTitle: 'Plans tonight?',
        });
    } else {

        yelp.search({
                term: 'bars',
                location: req.session.lastSearch
            })
            .then(function(data) {
                //create an array of id of bars to be displayed
                var barsToCheck = [];
                for (let i = 0; i < numBarsToDisplay; i++) {
                    barsToCheck.push(data.businesses[i].id);
                }

                //get the number of people going to each bar
                getNumberAttending(barsToCheck)
                    .then(function(response, error) {
                        var temp = response;
                        var attending = [];
                        for (let i = 0; i < barsToCheck.length; i++) {
                            attending.push(0);
                        }

                        for (let i = 0; i < response.length; i++) {
                            var tempIndex = barsToCheck.indexOf(temp[i]['id']);
                            if (tempIndex != -1) {
                                attending[tempIndex] = (temp[i]['attending'].length)
                            }
                        }

                        res.render('index', {
                            data: data.businesses,
                            attending: attending,
                            numBarsToDisplay: numBarsToDisplay,
                            pageTitle: 'Plans Tonight, ' + req.user.name.givenName + '?',
                            search: req.body.lastSearch
                        });

                    });
            })
            .catch(function(err) {
                console.error(err);
            });
    }
})

function yelpQuery(searchTerm) {
    return new Promise(function(resolve, replace) {
        yelp.search({
                term: 'bars',
                location: searchTerm
            })
            .then(function(data) {
                //create an array of id of bars to be displayed
                resolve(data);
                //get the number of people going to each bar

            })
            .catch(function(err) {
                reject(err);
            });
    })
}

router.post('/', function(req, res) {

    yelpQuery(req.body.searchQuery).then(function(response, error) {
            console.log()
            var barsToCheck = [];
            var data = response;
            for (let i = 0; i < numBarsToDisplay; i++) {
                barsToCheck.push(response.businesses[i].id);
            }
            getNumberAttending(barsToCheck)
                .then(function(response, error) {
                    var temp = response;
                    var attending = [];
                    for (let i = 0; i < barsToCheck.length; i++) {
                        attending.push(0);
                    }

                    for (let i = 0; i < response.length; i++) {
                        var tempIndex = barsToCheck.indexOf(temp[i]['id']);
                        if (tempIndex != -1) {
                            attending[tempIndex] = (temp[i]['attending'].length)
                        }
                    }

                    req.session.lastSearch = req.body.searchQuery;
                    req.session.offset = Math.round((data.region.center.longitude * 24) / 360);
                    res.render('index', {
                        data: data.businesses,
                        attending: attending,
                        numBarsToDisplay: numBarsToDisplay,
                        pageTitle: 'Plans Tonight?',
                        search: req.body.searchQuery
                    });

                });
        })
        .catch(function(err) {
            console.error(err);
        });
})

router.post('/going', function(req, res) {
    var offset = req.session.offset;
    var barID = req.body.attendingButton;

    if (!req.isAuthenticated()) {
        res.redirect('./auth/google')
    } else {
        var userID = req.user.id;
        findBar(barID)
            .then(function(response, error) {
                if (error) {
                    console.log("error");
                } else if (response == 'NOT_FOUND') {
                    bars.schema.methods.newBar(barID, userID, offset);
                } else {

                    if (response.attending[0] == undefined) {
                        return 'GOING';
                    } else {
                        return 'NOT_GOING'
                    }
                }

            }).then(function(response, error) {
                if (response == 'GOING') {

                    updateGoing(barID, userID, offset);
                } else {
                    updateNotGoing(barID, userID)
                }


            });
        res.redirect('/');
    }
})

function findBar(barID) {
    return new Promise(function(resolve, reject) {
        bars.findOne({
                '_id': barID
            },
            function(err, docs) {
                if (err) {
                    console.log('error');
                    reject(err);
                } else if (docs) {
                    resolve(docs)
                } else {
                    resolve('NOT_FOUND');
                }
            });
    });
}

function updateNotGoing(barID, userID) {

    return new Promise(function(resolve, reject) {
        bars.update({
                '_id': barID
            }, {
                $pull: {
                    'attending': {
                        $elemMatch: {
                            'personAttending': userID
                        }
                    }
                }
            },

            function(err, docs) {
                if (err) {
                    console.log('error');
                    reject(err);
                } else if (docs) {
                    resolve(docs)
                } else {
                    resolve('NOT_FOUND');
                }
            });
    });
}

function updateGoing(barID, userID, offset) {
  offset = 24 - offset;
  if(offset > 24){
    offset -= 24;
  }

    return new Promise(function(resolve, reject) {
            var date = new Date();
            date.setUTCHours(offset, 0, 0, 0);
            bars.update({
                        '_id': barID
                    }, {
                        $push: {
                            'attending': {
                                '_id': false,
                                'personAttending': userID
                            }
                        }
                    }, {$set: {
                        'expireAt': date
                      }
                    },


                function(err, docs) {
                    if (err) {
                        console.log('error');
                        reject(err);
                    } else if (docs) {
                        resolve(docs)
                    } else {
                        resolve('NOT_FOUND');
                    }
                });
    });
}

function getNumberAttending(barsToCheck) {
    return new Promise(function(resolve, replace) {
        bars.find({
                '_id': {
                    $in: barsToCheck
                }
            },
            function(err, docs) {
                if (err) {
                    reject(err);
                } else if (docs) {
                    resolve(docs)
                } else {
                    resolve(false);
                }
            });
    });
}

module.exports = router;
