module.exports = function parsePayload(request,response,next){
  if (request.method == 'POST' && !request.body.payload){
    response.json({message: 'operation unsuccessful', success: false, reason: 'invalid payload'})
    return;
  }
  next()
}
