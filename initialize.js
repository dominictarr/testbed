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
/*    .view('all/status', function(doc) {
      var status = doc.report.tests
        .map(function (e){
          return {name: e.filename || e.name, status: e.status}
        })
      emit([doc.username,doc.project,doc.commit], status);
    })*/
    .view('all/summary', function(doc) {
      if(doc.type != 'repo' || !doc.report.tests)
        return
      try{
        var total = 0, passes = 0
          , status = doc.report.status

            doc.report.tests.forEach(function (e){
              total ++;
              if(e.status == 'success') passes ++;
              return e.status
            })/*.reduce(function (x,y){
              return x < y ? x : y
            })*/
        var time = new Date(doc.time)
        emit([doc.username,doc.project,time], {
          commit: doc.commit, 
          status:status, 
          time: time,
          total: total,
          passes: passes
        });
      }catch (err){
        err.at = doc._id
        emit('error', err)
      }
    }, function (key,values){
      try {
      if(key == 'error')
        return {
          commit: 'various', 
          status:'view errors', 
          time: new Date(),
          total: values.length,
          passes: 0
        }
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
/*    .view('all/ordered', function(doc) {
      var status = doc.state.tests
        .map(function (e){
          return {name: e.filename || e.name, status: e.status}
        })
      emit([doc.username,doc.project,doc.time,doc.state.commit], status);
    })*/
    .ready(callback)
}