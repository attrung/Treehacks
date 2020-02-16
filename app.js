var express = require("express");
var app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");


app.use(express.static(__dirname + "/public"));

app.get("/", function(req, res){
  res.render("landing");
});

app.get("/home", function(req, res){
  res.redirect("/");
});

app.get("/main", function(req, res){
  res.render("main");
})

app.get("/map", function(req, res){
  res.render("main2")
})

app.listen(process.env.PORT, process.env.IP, function(){
  console.log("Server started!");
})
