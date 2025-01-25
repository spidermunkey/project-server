const http = require('http');
const httpserver = http.createServer();
httpserver.on("request", (req,res) => {
  console.log(req)
  res.end
})
httpserver.listen(8080).on("connection", connection => {

})
