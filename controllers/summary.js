
module.exports = function (db){
  function summary(opts,cont){

    db.view('all/summary',opts, function (err,data){
      if(err) {
        console.error(err)
        res.statusCode = 500
        return cont(err)
      }
      data.rows.sort(function (x,y){
        return x.value.time < y.value.time ? 1 : -1
      })
      if(data.rows.length)
        cont(null,data)
      else 
        cont(404)

    })
  }


  return {
    home: function (req,cont){
      var opts = {
        group_level: 2,
        reduce: true
      }
      summary(opts,cont)
    },
    username:
      function (req,cont){
        var opts = {
          startkey: [req.params.username,'_______'],
          endkey: [req.params.username,'ZZZZZZZZZ'],
          group_level: 2,
          reduce: true
        }
        summary(opts,cont)
      },
    username_project: function (req,cont){
      var opts = {
        endkey: [req.params.username,req.params.project,'ZZZZZZZ'],
        startkey: [req.params.username,req.params.project,'_____'],
        reduce: false
      }
      summary(opts,cont)
    }
  }
}