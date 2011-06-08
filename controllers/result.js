
module.exports = 
  function (req,cont){
    db.get([req.params.username, req.params.project, req.params.commit].join(','),
    function (err,data){
      cont(null,data)
    })
  }