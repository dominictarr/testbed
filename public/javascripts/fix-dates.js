var now = new Date()
$('.date').each(function (){
  var old =  new Date(this.innerHTML) 
  this.innerHTML = relativeDate(old,now)
  this.title = this.alt = old
})