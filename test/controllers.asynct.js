var controllers = require('../controllers')
  , it = require('it-is')
  , fs = require('fs')
  , render = require('render')
  , db
  , opts = {
      name: 'test-testbed',
      clobber: true,
      host: 'localhost',
      raw: true
    }
  , data = JSON.parse(fs.readFileSync(__dirname + '/data/testbed-migrated.json'))
/* Assertions */
  , summary_valid = it.has({
      commit: it.typeof('string')
    , total: it.typeof('number')
    , passes: it.typeof('number')
    , status: it.typeof('string')
    , time: function (actual){
        it(new Date(actual).toString()).notEqual('Invalid Date')
      }
    })
  , row_valid = 
      it.has({
        key: it.instanceof(Array)
      , value: summary_valid
      })
  , view_valid = 
      it.property('rows', it.every(row_valid).property('length', it.ok()))  

  function validate(row){
    return it.property('rows', it.every(row || row_valid).property('length', it.ok()))  
  }
  
exports.__setup = function (test) {
  
  console.error("init database")
  console.log(opts)
  db = require('../initialize')(opts, function (err,db){
    if(err){
      console.error("DATABASE SETUP ERROR")
      throw err
    }

    console.log(data)
    db.save(data, function (err){
      //if(err)
        //throw err
      console.log("DATABASE '" + opts.name + "' IS READY")
      test.done()
    })
  })

}
/*

the user level summary should return the latest 
username/project combinations for the user name passed in

the home level summary should return the latest of each username/project combination

the project summary returns all the commits for a username/project

*/

exports ['summary'] = function (test) {
  var req = {
        params: {
          username: 'dominictarr'
        }
      }
    , keys = {}
    , summary = controllers(db).summary.username

  summary(req,function (err,data){

    it(err).equal(null)

    /*

      got an error here because it chains changed the state, would be way better to make them immutable.

    */

    validate(function (row){
        it.property('key',function (key){//check every key is unique
          console.log(key)
          it.property('length',2)
          it(keys[key]).equal(null,render(key) + ' was not unique')
          keys[key] = true
        })
        row_valid(row)
      })(data)
    test.done()  
  })
}

exports ['home'] = function (test) {
  
  var keys = {}
    , home = controllers(db).summary.home

  home ({},function (err,data){
    console.log('*********************')
    it(err).equal(null)
    validate(row_valid)(data)
    test.done()  
  })

}

exports ['username/project'] = function (test) {
  
  var keys = {}
    , req = {
        params: {
          username: 'dominictarr'
        , project: 'testbed'
        }
      }
    , un_pj = controllers(db).summary.username_project

  un_pj (req,function (err,data){
    it(err).equal(null)

    validate(row_valid)(data)
    test.done()  
  })
}

