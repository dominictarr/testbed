var db
  , it = require('it-is')
  , opts = {
      name: 'test-fsm',
      clobber: true,
      host: 'localhost',
      raw: true
    }
  , fs = require('fs')

exports.__setup = function (test){

  console.error("init database")
  console.log(opts)
  db = require('../initialize')(opts, function (err,db){
    if(err){
      console.error("DATABASE SETUP ERROR")
      throw err
    }
    test.done()
  })
}

var overwrite = require('../model/overwrite')

exports ['if there is no _id then error'] = function (test) {

  overwrite(db, {hello: 'sadnfljasndflsadnflkasndlfsa'},function (err){
    it(err).ok()
    test.done()
  })

}

exports ['save with fsm'] = function (test) {

console.log("SAVE WITH FSM")
  overwrite(db, {_id: '123',hello: 'sadnfljasndflsadnflkasndlfsa'},function (err){
    it(err).equal(null)
    test.done()
  })
}

exports ['removes _events, etc, before saving'] = function (test) {

  overwrite(db, {_id: '123',hello: 'sadnfljasndflsadnflkasndlfsa', _events: []},function (err){
    it(err).equal(null)
    test.done()
  })
}