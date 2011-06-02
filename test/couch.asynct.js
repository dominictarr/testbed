var db
  , it = require('it-is')
  , opts = {
      name: 'test-testbed',
      clobber: true
    }
  , fs = require('fs')
  , data = (JSON.parse(fs.readFileSync(__dirname + '/data/testbed-all.json'))
    .rows.filter(function (e){
        return e.id[0] != '_'
      }).map(function (e){
        return e.doc
      }))

exports.__setup = function (test){

  console.error("init database")
  db = require('../initialize')(opts, function (err,db){
    if(err){
      console.error("DATABASE SETUP ERROR")
      throw err
    }

    console.log(data)
    db.save(data, function (err){
      if(err)
        throw error
      console.info("DATABASE '" + opts.name + "' IS READY")
      test.done()
    })
  })
}

var summary = 
  it.every(it.has({
    name:it.ok()
  , status:it.ok()
  }))

exports ['test ordered'] = function (test){

  db.view('all/ordered', function (err,data){
    console.log(err)
    if(err) throw err

    it(data.rows.filter(function (e){
      return e.key == 'error'
    })).deepEqual([])
//    console.log("all/ordered:",data)
    it(data.rows).every(it.has({
      key: [
          it.typeof('string')
        , it.typeof('string')
        , function (actual){
            it(new Date(actual).toString()).notEqual('Invalid Date')
          }
        ]
    , value: summary
    }))
    test.done()
  })
}

exports ['test summary'] = function (test){

/*
  show the results of the latest commit for each user's project

*/

  db.view('all/summary', {reduce: true, group: true}, function (err,data){
    if(err) throw err
    console.log("all/summary:",data.rows)
    var seen = []
    it(data.rows).every(it.has({
      key: it.property('length',it.ok())//username,project
    , value: it.has({
        commit: it.matches(/[\w|\d]+/)
      , status: it.matches(/success|failure|error/)
      , passes: it.typeof('number')
      , total: it.typeof('number')
      })
    })).property('length', it.ok("length must be > 0"))
    test.done()
  })
}
