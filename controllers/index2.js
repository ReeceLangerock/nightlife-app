// setup
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var Yelp = require('yelp');
var yelpConfig = = {
    consumer_key: process.env.yelp_key,
    consumer_secret: process.env.yelp_secret,
    token: process.env.yelp_token,
    token_secret: process.env.yelp_token_secret,
};
var yelp = new Yelp(yelpConfig);
var bars = require('../models/bars.js')
var numBarsToDisplay = 15;

router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());


router.get('/', function(req, res) {

    //IF USER HASN'T SEARCHED FOR A LOCATION, RENDER BASIC PAGE
    if (!req.session.lastSearch) {
        res.render('index', {
            data: null,
            search: null,
            pageTitle: 'Plans tonight?',
        });
    } else {
        // QUERY YELP FOR RESULTS OF PREVIOUS SEARCH
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
                        var attending = getAttendingArray(barsToCheck, response);

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
                    var attending = getAttendingArray(barsToCheck, response);

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

    // if user isnt authenticated, then authenticate
    if (!req.isAuthenticated()) {
        res.redirect('./auth/google')
    } else {
        var userID = req.user.id;
        //query for the bar the user is trying to go to
        findBar(barID)
            .then(function(response, error) {
                if (error) {
                    console.log("error");
                } else if (response == 'NOT_FOUND') {
                    // create new database entry for the bar
                    bars.schema.methods.newBar(barID, userID, offset);
                } else {
                    // check if they
                    for (let i = 0; i < response.attending.length; i++) {
                        // if user is found in respose return they are now not going
                        if (response.attending[i].personAttending == userID) {
                            return 'NOT_GOING';
                        }
                    }
                    // if user is not in respose return they are now going
                    return 'GOING';

                }

            }).then(function(response, error) {
                if (response == 'GOING') {
                    updateGoing(barID, userID, offset);
                } else {
                    updateNotGoing(barID, userID)
                }
                res.redirect('/');

            }).catch(function(err) {
                console.error(err);
            });

    }
})

function getAttendingArray(barsToCheck, response) {
    var attending = [];

    //default each index to 0;
    for (let i = 0; i < barsToCheck.length; i++) {
        attending.push(0);
    }

    // if id of bar is found in query, assign number attending to appropriate index in attending[]
    for (let i = 0; i < response.length; i++) {
        var tempIndex = barsToCheck.indexOf(response[i]['id']);
        if (tempIndex != -1) {
            attending[tempIndex] = (response[i]['attending'].length)
        }
    }
    return attending;
}

// query yelp for bars in location user requested
function yelpQuery(searchTerm) {
    return new Promise(function(resolve, replace) {
        yelp.search({
                term: 'bars',
                location: searchTerm
            })
            .then(function(data) {
                resolve(data);

            })
            .catch(function(err) {
                reject(err);
            });
    })
}

// check to see if bar entry has been created
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
                $pull: { // remove entry for that user
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
    // created offset to set time to midnight of current day, time of search location
    offset = 24 - offset;
    if (offset > 24) {
        offset -= 24;
    }

    return new Promise(function(resolve, reject) {
        var date = new Date();
        date.setUTCHours(offset, 0, 0, 0);
        bars.findOneAndUpdate({
                '_id': barID
            }, {
                $push: {
                    'attending': {
                        '_id': false,
                        'personAttending': userID
                    }
                }
            }, {
                $set: {
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

// get number of people attending the bars that are being displayed
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
