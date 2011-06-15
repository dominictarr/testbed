/*
  upload a new document, and overwrite what ever is in that place.
  
  couch makes you save documents with the right document revision,
  and we do not delete the document since, since it will briefly be unavailable.

  using FSM to handle the async control flows
*/

var FSM = require('fsm')

/*
  I think I want to turn the fsm into a function... 
  call it and start._in is triggered with the arguments you've passed.

  everything else is effectively hidden, until a halting state is reached. 
  ('end' or 'fatal' will be the conventions)
  then callback is invoked.
  
  hmm, and say an event emitter is returned, so that each event listened to if you like.

  or is that a bad idea? hmm. could be useful for progress bars or something.
*/

//f.filter(null,/^_/)

function filter (obj,keys) {
  var n = {}
  Object.keys(obj).forEach(function (i){
    if(!~keys.indexOf(i))
      n[i] = obj[i]
  })
  return n
}

module.exports = exports = function (db,item,callback){
  return new FSM({
    start: {
      _in: function (db,item){
        this.local.item = item = item || this.local.item
        this.local.db = db = db || this.local.db

        if(!item)
          throw new Error('item cannot be null')
        if(!item._id)
          throw new Error('expected ._id property')

        this.local.item = item = filter(item,['_events'])
        console.log('filtered', this.local.item)
        db.get(item._id, this.callback('ready'))
      },
      ready: ['save', function (n,data) {
        this.local.item._rev = data._rev
        this.local.db.save(this.local.item,this.callback('saved'))//will generate 'saved' or 'error'
      }],
      error: ['save', function (err) {//hopefully a not_found.
        console.log('****************',err,'get error, try and save')
        this.local.db.save(this.local.item,this.callback('saved'))//will generate 'saved' or 'error'
      }]
    },
    save: {
      saved:'end',
      //try again... this is where i need namespaced events.
      //'error.conflict': 'start'
      error: ['save',function (err) {
        if('conflict' === err.error)
          this.retry()
        else throw err
      }],
      retry: 'start'
    }
  }).call(db,item,callback)
}
