# le serveur ne gère "qu'une partie", pas 2 parties lancées en parallèle
# Pas de gestion des déconnexions pour l'instant

#les clients demandent régulièrement (toutes les 0.5 sec) une update sur le timer et les phases de jeu

#imports
from flask import Flask
from flask_socketio import SocketIO, send
import time
import sys,random


from flask_apscheduler import APScheduler

tini=time.time()
app = Flask(__name__)
scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()
INTERVAL_TASK_ID = 'interval-task-id'
def interval_task(): #le serveur se met regulierement a jour au cas ou personne n'est connecté a lui

    catchrefresh(0)

scheduler.add_job(id=INTERVAL_TASK_ID, func=interval_task, trigger='interval', seconds=8)

#setup de l'application flask et de socket
socket = SocketIO(app, cors_allowed_origins="*")
app.debug = False
PORT = int(sys.argv[1])+5000
largeur = 900

themes = ['maison','arbre','ordi','japon','corée','amphitheatre','poulet','piano','guitare','musique','cookie','basketball','football','superman','taureau','montre','france','suisse','café','argent','netflix','coder','casque audio','lit','rubiks cube','tetris']
#avec

#@socket.on("nomEvent")
#def fonction(args):
#   ...

#Lorsqu'on recoit l'evenement "nomEvent"
#on exécute la fonction "fonction()" avec les arguments args qui sont fournies par l'evenement socket

#penser à utiliser le mot-clé global pour résoudre
#des pb avec la syntaxe présentée juste au dessus (avec @socket.on)

#avec socket.emit("nom",a,b)
#on envoie aux clients l'évenement intitulé "nom" et a et b en données

#avec socket.emit(nomEvent,to=id) on envoie l'évent seulement à la personne d'identifiant socket id


#Le serveur stocke dans des variables globales
#des infos utiles



NBJOUEURS = 4 #nombre de joueurs par partie
TEMPSPARMANCHE = 4
TEMPSPARVOTE = 3
timer=0 # donne le temps depuis le début de la phase actuelle
tempsDebutManche = 0 # le temps auquel la manche a débuté
estEnPartie=False #devient true lorsque en partie

estEnVotes=False #devient true lorsque la phase de vote est en cours
noms=[] #les noms réservés par des gens en queue où en partie

nomsDernierePartie=[]
scoresDernierePartie=[]
joueursEnQueue=[] #les id socket des gens en file d'attente
joueursEnPartie=[] #les id socket des gens en partie (dessin ou phase de vote)

phasesDessin = [((1,2),(3,4)),((1,3),(2,4)),((1,4),(2,3))]
phaseActuelle = 0 #pour phaseActuelle = 0, on a le joueur 1 et 2 en équipe vs j3 et j4
                  #pour phaseActuelle = 1, j1 et j3 vs j2 et j4

dessin1=[] #une liste de tuple (x,y), chaque x,y correspond à un point du dessin
dessin2=[] #comme dessin1, mais pour l'autre duo



archiveDessins=[[],[],[],[],[],[]]
scores=[0,0,0,0]
totaux=[0,0,0,0,0,0] # un vote mauvais rapporte 0, bof 1, super 3
dessinActuelVote=0
idDejaVoté=[] # les id des joueurs ayant déja voté a ce tour


# Stockage des anciens dessins en vue de la phase des votes de chaque équipe
#Liste des évenements socket

# EVENEMENTS RECUS
# rejoindreQueue : un joueur veut rejoindre la queue pour etre dans une partie des qu'il ya suffisemment de joueurs
# ajout : un joueur ajoute un point au dessin
# voteMauvais : un joueur estime que le dessin est mauvais
# voteBof : un joueur estime que le dessin est bof
# voteSuper : un joueur estime que le dessin est super
# refresh : demande mise a jour de l'etat du serveur
# connection : nouvelle connexion d'un client


#EVENEMENTS ENVOYÉS
# updateDessin : envoi du dessin mis à jour
# nomDejaPris : notifie que le nom demandé est déja pris
# nomOk : notifie que le nom est libre
# rejoint : annonce que le joueur est dans la queue
# etat : envoie si on est en queue, ou en partie
# maj : envoie mise a jour de toutes les variables au client (sauf les dessins)
# effacer : envoie l'instruction d'effacer le dessin
# nouveauPoint : envoie un nouveau point à ajouter sur le dessin


def calculScores(): # a partir de totaux calcule la variable scores

# rappel : phasesDessin = [((1,2),(3,4)),((1,3),(2,4)),((1,4),(2,3))]

        scores[0]=(totaux[0]+totaux[2]+totaux[4]) #le J1 a les points du dessin 1, 3 et 5 car il y a participé
        scores[1]=(totaux[0]+totaux[3]+totaux[5])
        scores[2]=(totaux[1]+totaux[2]+totaux[5])
        scores[3]=(totaux[1]+totaux[3]+totaux[4])


@socket.on("vote")
def catchVote(id,pts):
    if(pts<=3):
        if id not in idDejaVoté:
            totaux[dessinActuelVote]+=pts
            idDejaVoté.append(id)




def genererToutesInfosUtiles(): # sert a envoyer a un client tout ce qu'il a besoin de savoir pour afficher les infos de maniere actualisée


    return [estEnPartie,estEnVotes,noms,phaseActuelle,idDejaVoté,dessinActuelVote,scores,int(timer),nomsDernierePartie,scoresDernierePartie,noms]

@socket.on("connection") #sur une nouvelle connexion on envoie les derniere infos au client
def catchconnect(id):
    print()
    print()
    print(id+"s'est connecté")
    print()
    print()
    catchrefresh(id)

@socket.on("iwantinfo") #envoyer au site web central les infos sur la partie intéressantes
def catchiwantinfo(idd):
    socket.emit("infosparties",[noms,PORT],to=idd)




def rafraichirDessinTous(): #rafraichit les dessin de  chacun
    socket.emit("effacer");
    for id in joueursEnPartie:
        catchajout(id,-100,-100);


@socket.on("ajout")
def catchajout(id,x,y):
    #on doit savoir si le joueur contribue au dessin1 ou au dessin2 en regardant la variable phasesDessin[phaseActuelle]
    #on considère qu'un joueur d'id "ID" est le joueur1 si son id est en premirer position de
    #la liste joueursEnPartie


    #la fonction auxiliaire quelJoueur() sert a trouver ceci
    if(estEnPartie) or x==(-100): #si on veut juste rafraichir le dessin x = -100 et on autorise la fonction a se faire

        if quelJoueur(id) in phasesDessin[phaseActuelle][0]: #le joueur est dans l'équipe 1

            if (quelJoueur(id)==phasesDessin[phaseActuelle][0][0] and x<largeur/2) or (quelJoueur(id)==phasesDessin[phaseActuelle][0][1] and x>largeur/2): #verif du coté du point posé

                dessin1.append([x,y]);

                if(estEnVotes):
                    socket.emit("updateDessin",dessin1,to=joueursEnPartie[phasesDessin[phaseActuelle][0][0]-1])

                    socket.emit("updateDessin",dessin1,to=joueursEnPartie[phasesDessin[phaseActuelle][0][1]-1])
                else:
                    socket.emit("nouveauPoint",(x,y),to=joueursEnPartie[phasesDessin[phaseActuelle][0][0]-1])
                    socket.emit("nouveauPoint",(x,y),to=joueursEnPartie[phasesDessin[phaseActuelle][0][1]-1])



        if quelJoueur(id) in phasesDessin[phaseActuelle][1]:
            if ((quelJoueur(id)==phasesDessin[phaseActuelle][1][0] and x<largeur/2) or (quelJoueur(id)==phasesDessin[phaseActuelle][1][1] and x>largeur/2)): #verif du coté du point
                dessin2.append([x,y])

                if(estEnVotes):
                    socket.emit("updateDessin",dessin2,to=joueursEnPartie[phasesDessin[phaseActuelle][1][0]-1])

                    socket.emit("updateDessin",dessin2,to=joueursEnPartie[phasesDessin[phaseActuelle][1][1]-1])
                else:
                    socket.emit("nouveauPoint",(x,y),to=joueursEnPartie[phasesDessin[phaseActuelle][1][0]-1])
                    socket.emit("nouveauPoint",(x,y),to=joueursEnPartie[phasesDessin[phaseActuelle][1][1]-1])





@socket.on("rejoindreQueue")
def catchrejoindreQueue(id,nom): #on verifie si le nom est dispo et si il y a de la place pour rentrer dans la queue
    if nom in noms:
        socket.emit("nomDejaPris",to=id)
        print("nomdejapris")
    else:

        socket.emit("nomOk",to=id)
        print("envoyé nomOk")
        if (len(joueursEnQueue) < NBJOUEURS) and (not (id in joueursEnQueue)): #dans ce cas on peut joindre la queue
            joueursEnQueue.append(id)
            socket.emit("rejoint",to=id)
            noms.append(nom)

            if len(joueursEnQueue)==NBJOUEURS:
                commencer()





@socket.on("refresh") # on va envoyer les dernieres infos utiles au client
def catchrefresh(id): # on verifie qu'on a pas changé de phase, puisque cette fonction est appellée régulièrement

    global tempsDebutManche,estEnPartie,phaseActuelle,estEnVotes,dessinActuelVote,timer
    global archiveDessins,dessin1,dessin2,idDejaVoté
    global timer,tempsDebutManche,estEnPartie,estEnVotes
    global noms,joueursEnQueue,joueursEnPartie,phasesDessin,phaseActuelle,dessin1,dessin2
    global archiveDessins,scores,totaux,dessinActuelVote,idDejaVoté
    timer=time.time()-tempsDebutManche
    if(timer>TEMPSPARMANCHE) and estEnPartie:

        #on doit alors changer de phase
        #on archive les dessins
        if phaseActuelle==0:
            archiveDessins[0]=dessin1.copy()
            archiveDessins[1]=dessin2.copy()
        if phaseActuelle==1:
            archiveDessins[2]=dessin1.copy()
            archiveDessins[3]=dessin2.copy()
        if phaseActuelle==2:
            archiveDessins[4]=dessin1.copy()
            archiveDessins[5]=dessin2.copy()

        tempsDebutManche=time.time()
        envoyerThemeEtChangerTheme()
        if(phaseActuelle<2):
            phaseActuelle+=1
            dessin1=[]
            dessin2=[]
            rafraichirDessinTous()

        else:
            estEnPartie=False
            estEnVotes=True
            dessinActuelVote=0
            dessin1=archiveDessins[dessinActuelVote].copy()
            dessin2=archiveDessins[dessinActuelVote].copy()
            rafraichirDessinTous()

    if(time.time()>tempsDebutManche+TEMPSPARVOTE) and estEnVotes:

        if dessinActuelVote<6:
            dessinActuelVote+=1
        if dessinActuelVote<6:
            dessin1=archiveDessins[dessinActuelVote].copy()
            dessin2=archiveDessins[dessinActuelVote].copy()
            rafraichirDessinTous()
            tempsDebutManche=time.time()
            idDejaVoté=[]

        if(dessinActuelVote>=6):
            dessinActuelVote=0
            print("FINIIIIIIIIIIIi")
            print("Les totaux sont")
            print(totaux)
            print("les scores")
            calculScores()
            print(scores)
            global nomsDernierePartie
            global scoresDernierePartie
            nomsDernierePartie=noms
            scoresDernierePartie=scores
            estEnVotes=False
            rafraichirDessinTous()


            timer=0 # donne le temps depuis le début de la phase actuelle
            tempsDebutManche = 0 # le temps auquel la manche a débuté
            estEnPartie=False #devient true lorsque en partie

            estEnVotes=False #devient true lorsque la phase de vote est en cours
            noms=[] #les noms réservés par des gens en queue où en partie

            joueursEnQueue=[] #les id socket des gens en file d'attente
            joueursEnPartie=[] #les id socket des gens en partie (dessin ou phase de vote)

            phasesDessin = [((1,2),(3,4)),((1,3),(2,4)),((1,4),(2,3))]
            phaseActuelle = 0 #pour phaseActuelle = 0, on a le joueur 1 et 2 en équipe vs j3 et j4
                              #pour phaseActuelle = 1, j1 et j3 vs j2 et j4

            dessin1=[] #une liste de tuple (x,y), chaque x,y correspond à un point du dessin
            dessin2=[] #comme dessin1, mais pour l'autre duo



            archiveDessins=[[],[],[],[],[],[]]
            scores=[0,0,0,0]
            totaux=[0,0,0,0,0,0] # un vote mauvais rapporte 0, bof 1, super 3
            dessinActuelVote=0
            idDejaVoté=[]
            rafraichirDessinTous()
            for i in joueursEnPartie:
                socket.emit("maj",genererToutesInfosUtiles(),to=i)
    if(id!=0):
        socket.emit("maj",genererToutesInfosUtiles(),to=id)


def quelJoueur(id):
    if(joueursEnPartie[0]==id):
        return 1
    if(joueursEnPartie[1]==id):
        return 2
    if(joueursEnPartie[2]==id):
        return 3
    if(joueursEnPartie[3]==id):
        return 4
    return -1


def envoyerThemeEtChangerTheme():
    global themes
    theme=random.choice(themes)
    for id in joueursEnPartie:
        socket.emit("theme",theme,to=id)


def commencer(): #passage de la phase de queue à la phase de jeu
    global estEnPartie,joueursEnPartie,joueursEnQueue,phaseActuelle,dessin1,dessin2,archiveDessins,tempsDebutManche

    estEnPartie=True
    joueursEnPartie=joueursEnQueue.copy()
    joueursEnQueue=[]
    phaseActuelle=0
    tempsDebutManche=time.time()
    print(tempsDebutManche)
    print("au dessus init de temps deb")
    dessin1=[]
    dessin2=[]
    rafraichirDessinTous()
    archiveDessins=[[],[],[],[],[],[]]
    totaux=[0,0,0,0,0,0]
    dessinActuelVote=0
    idDejaVoté=[]
    envoyerThemeEtChangerTheme()
    for id in joueursEnPartie:
        catchrefresh(id)




#code à avoir en dessous de @socket.on()
#permet de lancer le serveur
if __name__ == '__main__':
    socket.run(app,host='0.0.0.0',port=PORT)
