# Débat Méthodique

## Introduction
Ce projet est une solution logicielle pour réorganiser et faciliter les débats sur le net.

L'idée est de faire un plugin pour navigateur. Lorsque l'utilisateur visitera un site, forum, réseau social... géré par Débat Méthodique, celui-ci parsera le contenu de la conversation pour la lui présenter d'une toute autre façon.
L'objectif est d'éliminer un maximum de biais inhérent à la manière dont sont présentées les informations sur les sites internet visés.
Redonner à l'utilisateur le contrôle sur ce qui lui est présenté et lui offrir plus de lisibilité sur l'état actuel du débat.

## Démarrage
Débat Méthodique (DM) est un projet en cours de développement. Pour le tester ouvrez simplement testPage.html dans votre navigateur (ou la version light). Recherchez le bouton "Débat Méthodique" dans la page et cliquez dessus.

Le code permettant le parsing des informations de la page internet (parser.js) ainsi que la transformation en une nouvelle forme de débat (debatmethodique.js|css) a été inséré manuellement dans cette page dont le contenu a été copié/collé. Le but étant de développer d'abord la solution, avant de transformer celle-ci en un plugin qui s’exécuterait plus ou moins automatiquement lors de la visite du site.

## Fil de discussion et... ?!
Une présentation très classique sur le web est celle consistant en un long fil vertical que l'utilisateur scroll pour le parcourir. DM casse cette règle pour présenter les informations non plus en une seule dimension verticale, mais en deux dimensions.
Sur la première ligne, on trouve tous les commentaires n'ayant pas de parent. C'est à dire les réponses directes à l'article/post/tweet... initial qui suscite la discussion. Sur la deuxième ligne, les réponses faites à ces commentaires initiaux, avec le lien visible de parenté qu'ils peuvent avoir. Sur la troisième ligne, les réponses à ces réponses, et ainsi de suite.

## Commentaire sélectionné
Il y a toujours un commentaire de sélectionné, il est sensé être ce que l'utilisateur est actuellement en train de lire. Ce commentaire est entouré d'une bordure verte et est agrandit par rapport aux autres dont la taille maximum est fixe.
Ce commentaire sélectionné est celui dont le contexte de lecture est aussi le plus visible et lisible. Ses parents (les commentaires auxquels il répond), ainsi que ces enfants (les réponses qui lui sont apportées), sont visibles et s'alignent avec lui.
Leur éloignement par rapport à la sélection est indiqué visuellement par une bordure et un lien dont la couleur va du vert (très proche) au rouge (très éloigné).
La vue essaye de se placer au mieux pour que le commentaire sélectionné soit le mieux placé possible dans la fenêtre.

Il est possible de changer de sélection et de sélectionner un autre commentaire :
- en cliquant sur le bouton approprié dans un commentaire (une flèche verte encadrée de vert)
- en naviguant avec votre clavier (haut pour remonter sur un parent, bas pour descendre sur un enfant, gauche et droite pour sélectionner un frère)
- TODO : navigation par pertinence

La vue peut être éloignée de ce commentaire sélectionné (parce que vous avez navigué dans la page), vous pouvez à tout moment revenir sur ce commentaire en cliquant sur le bouton dans la barre de menu principale (une flèche verte encadrée de vert).

## Tri, filtre et pertinence
Comme la discussion n'est pas représentée par un long scroll vertical, il n'y a pas de début (arbitraire) ni de fin (perdue dans les limbes) au débat. A la place, l'utilisateur choisi lui même et uniquement pour lui même, ce qu'il souhaite voir. En sélectionnant des tris et filtres, c'est lui qui va avoir la main sur ce qui lui est présenté et comment.
En choisissant ce qu'il veux voir, l'utilisateur créé un ordre de pertinence. Les commentaires qui, selon ce qu'il a choisit, sont très pertinents, auront un en-tête vert. Pour ceux, au contraire, les moins pertinents, l'en-tête sera rouge. Et entre les deux, tout un dégradé de nuances.
Vous pouvez choisir les fonctions de tri en cliquant sur le bouton dans la barre de menu principale ("Trier/Filtrer")
La vue basculera alors vers une autre forme où vous verrez et pourrez paramétrer les fonctions de tri que vous voulez utiliser. Vous verrez aussi les commentaires de la discussion, triés par pertinence et sans visibilité sur leur contexte dans le débat.
Vous pouvez choisir vos fonctions de tri à activer en cochant leur checkbox.
En les glissant/déplaçant, vous déterminez leur priorité relative dans le tri.
En cliquant sur la roue crantée, vous pouvez paramétrer plus finement la façon dont la fonction tri ou filtre les commentaires. Cela affiche un histogramme donnant les différentes valeurs de pertinence sur laquelle vous pouvez jouer.

## TODO
En dehors des bugs à corriger :
- (Re)faire la navigation par la souris (pour une forme de navigation libre dans le débat)
- Simplifier/améliorer le modèle de donnée du graphe pour rendre plus rapide et fluide la navigation
- Ajouter d'autres fonctions de tris/filtres (et des combinaisons pré-programmées)
- Faire un vrai parser, capable de récupérer le contenu des discussions de nombreuses sources
- Gérer l'interaction avec le site transformé (écrire un nouveau commentaire, voter...)
- Implémenter une interface de paramétrage de DM (actuellement seulement dans le code)
- Faire de DM un plugin utilisant automatiquement son parser et donnant un moyen pratique de transformer la page visitée
- Le style ! DM est assez moche et peu accessible (en court de développement, mais pas finit)
- etc...
