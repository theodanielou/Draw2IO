let tempsDernierRefresh=0;
let TEMPSREFRESH = 700;
let sockets=[];
let ROOMS=10;
let joueursenpdanschaqueroom=[];

function setup(){
  for (var i = 0; i < ROOMS; i++) {
    sockets.push(io.connect('http://0.0.0.0:'+(5000+i+1)));
    joueursenpdanschaqueroom.push([]);
    sockets[i].on('infosparties',miseAJour);
  }
  tempsDernierRefresh=millis();
}

function draw(){
  if(millis() > tempsDernierRefresh+TEMPSREFRESH){
    tempsDernierRefresh = millis();
    for (var i = 0; i < ROOMS; i++) {
      sockets[i].emit("iwantinfo",sockets[i].id);
      //console.log("dans la salle "+i+" : "+joueursenpdanschaqueroom[i]);
      document.getElementById("l"+(i+1)).innerHTML = "dans la salle : "+joueursenpdanschaqueroom[i];
    }
  }
}

function miseAJour(a){
  //console.log('recumaj');
  joueursenpdanschaqueroom[a[1]-5001]=a[0];
}

function ouvre(i){
  //console.log("room"+i.toString()+".html")
  window.open("room"+i.toString()+".html");
}