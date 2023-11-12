// décla des variables
let servEstEnPartie = false;
let jeSuisEnPartie = false; //TODO
let estEnVotes = false;
let noms = [];
let phaseActuelle = 0;
let idDejaVote = [];
let dessinActuelVote = 0;
let scores = [0,0,0,0];
let timer = 0;
let dessin = [];
let nom="";
let messages=["Vous ne pouvez dessiner que sur votre moitie","Activez la console javascript pour suivre et debugger"];// un ensemble de messages et le temps jusqu'auquel ils sont affichés
let pStatutPartie; // permet de suivre si on est en partie
let pTimer;
let pDessinActuelVote;
let pStatutVotes;

let RED=[255,0,0];
let GREEN=[0,255,0];
let ORANGE=[255,215,0];


//lire le code python et les commentaires de app.py d'abord pour comprendre tous les évenements

tempsDernierRefresh=0;
TEMPSREFRESH=650; //temporaire, temps en ms pour autorefresh

function setup() { // fonction éxecutée une fois au début
  createCanvas(600,400); //création d'une zone de 600 par 400 pixels
  background(51); // fond gris
  socket=io.connect('http://localhost:5000'); // initialisation du socket client

  pStatutPartie=createP('the server is in a game : '+servEstEnPartie);
  pTimer=createP("temps écoulé sur la manche : "+timer);
  pStatutVotes=createP('the server is in votes : '+estEnVotes);
  pDessinActuelVote=createP();
  //pStatutPartie.show();

  bouttonRech = createButton("recherche de partie"); //création d'un bouton avec du texte dessus
  bouttonRech.position(500,500);
  bouttonRech.mousePressed(recherche); // appel de fonction lorsque le bouton est cliqué

  bouttonRef = createButton("refresh");
  bouttonRef.position(100,500);
  bouttonRef.mousePressed(refreshqueue);


  socket.on('maj',miseAJour); // gestion de socket recu en appelant une fonction
  socket.on('updateDessin',majDessin);
  socket.on('connect', () => {socket.emit("connection",socket.id);messages.push("ID:"+socket.id)}); //permet d'envoyer son ID au serv lors d'une connexion
  socket.on('nomDejaPris',() => {console.log("nomdejapris")});
  socket.on('nomOk',() => {console.log("nomOk")});
  socket.on("rejoint",() => {console.log("rejoint")});





  let nominitialrandom=Math.random().toString(36).replace(/[^a-z]+/g, '');
  let inp = createInput(nominitialrandom); // entrée de texte pour l'utilisateur
  inp.position(200, 400);
  inp.size(100);
  inp.input(majNom); // appelé lorsque le texte entré change
  nom = nominitialrandom;
  tempsDernierRefresh=millis();
}


function draw() { //fonction éxécutée en boucle lors du programme
  pStatutVotes.html('the server is in votes : '+estEnVotes);
  pStatutPartie.html('the server is in a game : '+servEstEnPartie);
  background(51);
  if(!servEstEnPartie && !estEnVotes)
    {

      //ni en votes ni en partie

      fill(255);
      text("les scores de la derniere partie jouee sont " + scores,100,100);
      text("des joueurs respectivement " + noms,100,115 );
    }


  fill(255);


  let offset=0
  for (m of messages){
    text(m,300,10+offset);
    offset+=10;
  }


  if(millis() > tempsDernierRefresh+TEMPSREFRESH){
    tempsDernierRefresh = millis();
    socket.emit("refresh",socket.id);

    //on va périodiquement demander au serveur des mises à jour pour etre au courant des
    //mises à jour des variable
    //c'est comme ceci aussi qu'on permet au serveur de vérifier qu'on a pas changé de phase,
    // sans aucune requete de refresh des clients le serveur ne vérifie jamais s'il faut changer de phase


  }

  if(servEstEnPartie){
    pTimer.html("temps ecoule sur la manche : "+timer);
    line(300,0,300,400);
    if (dessin != []){
      for (coord of dessin){
        fill(200,100,20);
        noStroke();
        ellipse(coord[0],coord[1],10,10);
        stroke(0,0,0);

      }
    }



  }else{
//si pas en partie
pTimer.html("pas de timer, la partie n'a pas commencee");


  }

  if(estEnVotes){
    pTimer.html("temps ecoule sur le vote : "+timer);
    fill(RED);
    rect(0,350,200,400);
    fill(255);
    text("nul",100,375);
    fill(ORANGE);
    rect(200,350,400,400);
    fill(255);
    text("bof",300,375);
    fill(GREEN);
    rect(400,350,600,400);
    fill(255);
    text("kewl",500,375);

    if (dessin != []){
      for (coord of dessin){
        fill(200,100,20);
        ellipse(coord[0],coord[1],10,10);

      }
    }

    pDessinActuelVote.html("On vote actuellement pour le dessin "+dessinActuelVote);
  }



}
function miseAJour(arr){

  servEstEnPartie = arr[0];
  estEnVotes = arr[1];
  noms = arr[2];
  phaseActuelle = arr[3];
  idDejaVote = arr[4];
  dessinActuelVote = arr[5];
  scores = arr[6];
  timer = arr[7];

  console.log("updated")

}
function mousePressed(){ // appelé lors d'un clic de la souris

  if(servEstEnPartie){
    socket.emit("ajout",socket.id,mouseX,mouseY);

  }

  if(estEnVotes && mouseY>350 && mouseY<400){

    if(mouseX<200){socket.emit("vote",socket.id,0)} //vote 0 points
    if(mouseX>200 && mouseX<400){socket.emit("vote",socket.id,1)}
    if(mouseX>400){socket.emit("vote",socket.id,3)} // pas ouf en sécurité on peut émettre via la console des votes avec bcp de points menfin

  }
}
function mouseDragged(){
  if(servEstEnPartie){
    socket.emit("ajout",socket.id,mouseX,mouseY);

  }
}

function recherche(){
  socket.emit("rejoindreQueue",socket.id,nom);
}

function majDessin(d){
  console.log("le dessinfutmaj");
  dessin = d;
}

function refreshqueue(){
  socket.emit("refresh",socket.id);
  console.log("A manual refresh occured");
}

function majNom(){
  nom=this.value();
}
