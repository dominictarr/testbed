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
    .view('all/ordered', function(doc) {
      var status = doc.state.tests
        .map(function (e){
          return {name: e.filename || e.name, status: e.status}
        })
      emit([doc.username,doc.project,doc.time,doc.state.commit], status);
    }).ready(callback)
}