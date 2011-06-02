/*
create database
create views
save ~/.testbedrc.json with configuration info.

*/

var init = require('cradle-init')


module.exports = function (opts,callback){
  opts.raw = true
  opts.cache = true
  console.log("INIT VIEWS", opts)
  return init(opts.name,opts)
    .view('all/status', function(doc) {
      var status = doc.state.tests
        .map(function (e){
          return {name: e.filename || e.name, status: e.status}
        })
      emit([doc.username,doc.project,doc.state.commit], status);
    })
    .view('all/summary', function(doc) {
      if(!doc.state || doc.type == 'commit')
        return
      try{
        var total = 0, passes = 0
          , status = (doc.state.tests || doc.state.results)
            .map(function (e){
              total ++;
              if(!e)
                throw new Error('e is undefined')
              if(e.status) passes ++;
              return e.status
            }).reduce(function (x,y){
              return x > y ? x : y
            })

        emit([doc.username,doc.project], {
          commit: doc.state.commit, 
          status:status, 
          time: new Date(doc.time),
          total: total,
          passes: passes
        });
      }catch (err){
        err.at = doc._id
        emit('error', err)
      }
    }, function (key,values){
      try {
        var max = null
        values.forEach(function (e){
          if(!max || new Date(e.time) > new Date(max.time))
            max = e
        })
        return max
      } catch (err){
        return err
      }
    })
    .view('all/ordered', function(doc) {
      var status = doc.state.tests
        .map(function (e){
          return {name: e.filename || e.name, status: e.status}
        })
      emit([doc.username,doc.project,doc.time,doc.state.commit], status);
    }).ready(callback)
}