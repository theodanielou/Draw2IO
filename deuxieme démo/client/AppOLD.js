var socket;
var button;
var msg;
var tempsjusqua=0;
var nomvoulu="";
var nb;
var estenqueue=false;
var pseudoqueue;
var dessin=[];
var estenpartie=false;


function setup() {
  createCanvas(600,400);
  background(51);
  socket=io.connect('http://localhost:5000');

  socket.emit("veutNom",nomvoulu,socket.id);
  button = createButton("recherche de partie");

  button.position(500,500);
  button.mousePressed(fonction);

  ref = createButton("refresh");
  ref.position(100,500);
  ref.mousePressed(refreshqueue);
  refreshqueue();

  socket.on('nomok',afficherNomOk);
  socket.on('nomdejapris',afficherNomPasOk);
  socket.on('accepte',entree);
  socket.on('nbjoueurs',updateNB);
  socket.on('verifvivant',rien);
  socket.on('trop',tropdemonde)
  socket.on('yourein',cparti)
  socket.on('updatedessin',maj)
  socket.on('connect', () => {socket.emit("connection",socket.id)});

  let inp = createInput('');
  inp.position(200, 400);
  inp.size(100);
  inp.input(myInputEvent);
}


function draw() {
  background(51);

  if(!estenpartie){
  if (millis()<tempsjusqua) {
    console.log('jaffiche');
    text(msg,50,50);
  }

  text(nb+"/4",300,50);

  if (estenqueue) {
    text("vous etes en queue avec le pseudo",400,50);
    text(pseudoqueue,400,200);
  }}
  else{
    //ici on est en game
    text("vous etes en partie avec le pseudo",400,50);
    text(pseudoqueue,400,200);


    dessin.forEach(ellipser);

  }

}

function mousePressed(){
  if(estenpartie){socket.emit("ajout",mouseX,mouseY);
}

}

function rien(){
socket.emit("incr");
}

function fonction(){
  socket.emit("veutNom",nomvoulu,socket.id);
  console.log('jeveux un nom');

}
function updateNB(x){
  nb=x;
}
function afficherNomOk(){
  refreshqueue();
  msg="le nom est bien ok";
  tempsjusqua=millis()+2000;

}
function afficherNomPasOk(){
  refreshqueue();
  msg="le nom est deja pris";
  tempsjusqua=millis()+2000;
}
function tropdemonde(){
  refreshqueue();
  msg="Trop de joueurs sorry";

  tempsjusqua=millis()+2000;
}

function refreshqueue(){

  socket.emit("ref",socket.id)

}
function myInputEvent() {
  nomvoulu=this.value();
}

function entree(){
  console.log('jesuisenqueue');
  estenqueue=true;
  pseudoqueue=nomvoulu
}

function cparti(){
estenpartie=true;

}
function ellipser(tuple){
  ellipse(tuple[0],tuple[1],20,20);


}
function maj(x){

  dessin=x;

}
