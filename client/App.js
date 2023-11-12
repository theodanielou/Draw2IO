// décla des variables
let servEstEnPartie = false;
let jeSuisEnPartie = false; //TODO
let estEnVotes = false;
let joueursPresents = [];
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
let scoresDernierePartie="";
let nomsDernierePartie="";
let theme="";
let largeur = 900
let hauteur=500
let taillePoint=8;

let RED=[255,0,0];
let GREEN=[0,255,0];
let ORANGE=[255,215,0];

//lire le code python et les commentaires de app.py d'abord pour comprendre tous les évenements

tempsDernierRefresh=0;
TEMPSREFRESH=650; //temporaire, temps en ms pour autorefresh

function setup() { // fonction éxecutée une fois au début
  let canvas=createCanvas(largeur,hauteur); //création d'une zone de 600 par 400 pixels
  canvas.parent('sketch-holder');
  background(245); // fond gris
  //let strconnectto='http://157.159.195.79:';
  let strconnectto='http://localhost:';
  room=room+5000;
  console.log(room);
  console.log(room);
  socket=io.connect(strconnectto+room); // initialisation du socket client

  pStatutPartie=createP('the server is in a game : '+servEstEnPartie);
  pTimer=createP("temps écoulé sur la manche : "+timer);
  pStatutVotes=createP('the server is in votes : '+estEnVotes);
  pStatutGensPresents=createP('Sont présents sur le serveur les joueurs :');
  pDessinActuelVote=createP();
  //pStatutPartie.show();

  bouttonRech = createButton("recherche de partie"); //création d'un bouton avec du texte dessus
  bouttonRech.position(680,hauteur+100);
  bouttonRech.mousePressed(recherche); // appel de fonction lorsque le bouton est cliqué

  //bouttonRef = createButton("refresh");
  //bouttonRef.position(100,500);
  //bouttonRef.mousePressed(refreshqueue);
  bouttonVoteNul = createButton("Voter 'Nul'");
  bouttonVoteBof = createButton("Voter 'Bof'");
  bouttonVoteSuper = createButton("Voter 'Super'");
  bouttonVoteNul.position(900,hauteur+100);
  bouttonVoteNul.mousePressed(vote0);
  bouttonVoteBof.position(820,hauteur+100);
  bouttonVoteBof.mousePressed(vote1);
  bouttonVoteSuper.position(980,hauteur+100);
  bouttonVoteSuper.mousePressed(vote3);

  bouttonVoteBof.hide();
  bouttonVoteSuper.hide();
  bouttonVoteNul.hide();


  socket.on('maj',miseAJour); // gestion de socket recu en appelant une fonction
  socket.on('updateDessin',majDessin);
  socket.on('connect', () => {socket.emit("connection",socket.id);messages.push("ID:"+socket.id)}); //permet d'envoyer son ID au serv lors d'une connexion
  socket.on('nomDejaPris',() => {console.log("nomdejapris")});
  socket.on('nomOk',() => {console.log("nomOk")});
  socket.on("rejoint",() => {console.log("rejoint")});
  socket.on("theme",(x) => {theme=x});
  socket.on("nouveauPoint",majDessinPoint);
  socket.on("effacer",() => {dessin=[]});





  let nominitialrandom=Math.random().toString(36).replace(/[^a-z]+/g, '');
  //let inp = createInput(nominitialrandom); // entrée de texte pour l'utilisateur
  let inp = createInput('ENTREZ NOM');
  inp.position(570, hauteur+100);
  inp.size(100);
  inp.input(majNom); // appelé lorsque le texte entré change
  nom = nominitialrandom;
  tempsDernierRefresh=millis();
}


function draw() { //fonction éxécutée en boucle lors du programme
  pStatutVotes.html();
  pStatutPartie.html('Le serveur est en partie : '+servEstEnPartie+'<br>Le serveur est en votes : '+estEnVotes+'<br>Sont présents sur le serveur les joueurs : '+joueursPresents);
  pStatutGensPresents.html();
  background(245);
  bouttonRech.hide();
  if(!servEstEnPartie && !estEnVotes)
    {
      bouttonRech.show();
      bouttonVoteBof.hide();
      bouttonVoteSuper.hide();
      bouttonVoteNul.hide();
      //ni en votes ni en partie

      fill(0);
      text("les scores de la derniere partie jouee sont " + scoresDernierePartie,100,90);
      text("des joueurs respectivement " + nomsDernierePartie,100,105);
      text("Attendre la fin de la partie en cours pour chercher une partie, ou changez de salle",100,130);
      text("RAPPEL : entrez votre nom dans la case dédiée en bas a droite, et cliquez recherche de partie",100,145);
      text("Des informations utiles sont affichées sous la fenetre de jeu !",100,190);
      text("Assurez vous de bien mettre votre page web suffisemment grande pour voir tous les boutons et le texte !",100,210);

    }


  fill(0);


  let offset=0
  for (m of messages){
    text(m,largeur/2,10+offset);
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
    text("LE THEME ACTUEL: " + theme,100,100);
    pTimer.html("temps ecoule sur la manche : "+timer);
    line(largeur/2,0,largeur/2,hauteur);
    if (dessin != []){
      for (coord of dessin){
        fill(0,0,0);
        noStroke();
        ellipse(coord[0],coord[1],taillePoint,taillePoint);
        stroke(0,0,0);

      }
    }



  }else{
//si pas en partie
pTimer.html("pas de timer, la partie n'a pas commencee");


  }

  if(estEnVotes){
    bouttonVoteBof.show()
    bouttonVoteSuper.show()
    bouttonVoteNul.show()
    pTimer.html("temps ecoule sur le vote : "+timer);
    fill(100,100,0);
    rect(0,450,200,500);
    fill(0);
    text("vote avec les boutons en bas a droite!",20,475);


    if (dessin != []){
      for (coord of dessin){
        fill(0);
        noStroke();
        ellipse(coord[0],coord[1],taillePoint,taillePoint);
        stroke(0,0,0);

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
  nomsDernierePartie=arr[8];
  scoresDernierePartie=arr[9];
  joueursPresents=arr[10];



  console.log("updated")

}
function mousePressed(){ // appelé lors d'un clic de la souris

  if(servEstEnPartie){


      socket.emit("ajout",socket.id,mouseX,mouseY);



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

function majDessinPoint(x,y){
  dessin.push([x,y]);
}

function refreshqueue(){
  socket.emit("refresh",socket.id);
  console.log("A manual refresh occured");
}
function vote0(){
socket.emit("vote",socket.id,0);
}
function vote1(){
socket.emit("vote",socket.id,1);
}
function vote3(){
socket.emit("vote",socket.id,3);
}

function majNom(){
  nom=this.value();
}
