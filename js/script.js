// Attend que le document soit complètement chargé avant d'exécuter le script
$(document).ready(function () {
    // Initialisation des variables globales
    let currentQuestions = [];  // Stocke les questions du quiz actuel
    let currentQuestionIndex = 0;  // Index de la question actuelle
    let score = 0;  // Score du joueur
    let hasAnswered = false;  // Indique si le joueur a répondu à la question actuelle
    let userName = "";  // Nom du joueur

    // Gère le clic sur les boutons radio pour sélectionner le niveau
    $("input[type='radio']").on("click", function () {
        let card = $(this).closest('.card');  // Trouve la carte parente
        let rubrique = card.data('name');  // Récupère le nom de la rubrique
        let cardTitle = card.find('.card-title').text().trim();  // Récupère le titre de la carte
        let niveau = $(this).val();  // Récupère le niveau sélectionné
        let imageUrl = card.find('img').attr('src');  // Récupère l'URL de l'image
        
        // Demande le prénom de l'utilisateur
        userName = prompt("Veuillez entrer votre prénom :");
        if (userName) {
            afficherRecapitulatif(userName, rubrique, cardTitle, niveau, imageUrl);
        }
    });

    // Affiche un récapitulatif avant de commencer le quiz
    function afficherRecapitulatif(userName, rubrique, cardTitle, niveau, imageUrl) {
        $('main').html(`
            <div class="text-center text-white">
                <h2 class="fs-3 fw-bold text-capitalize">${cardTitle} - Niveau ${niveau}</h2>
                <p class="mt-4 fs-3"><span class="fs-2">${userName}</span>, vous allez pouvoir commencer le Quizzz !!!</p>
                <img src="${imageUrl}" alt="${rubrique}" class="img-fluid rounded-4 mb-3 mt-3">
                <br>
                <button id="startQuiz" class="mt-3">Démarrer le quiz</button>
            </div>
        `);

        // Gère le clic sur le bouton "Démarrer le quiz"
        $("#startQuiz").on("click", function () {
            chargerQuestions(rubrique, niveau);
        });
    }

    // Charge les questions depuis un fichier JSON
    function chargerQuestions(rubrique, niveau) {
        let url = `json/quizz${rubrique}.json`;
    
        $.ajax({
            url: url,
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                currentQuestions = data.quizz[niveau];
                afficherQuestion();
            },
            error: function () {
                alert("Erreur lors du chargement des questions.");
            }
        });
    }

    // Affiche une question
    function afficherQuestion() {
        // Vérifie si toutes les questions ont été posées
        if (currentQuestionIndex >= currentQuestions.length) {
            afficherResultats();
            return;
        }
    
        hasAnswered = false;
        let question = currentQuestions[currentQuestionIndex];
        let quizHTML = `
            <div class="text-white text-center">
                <h2 class="pt-2">Question ${currentQuestionIndex + 1}</h2>
                <p class="pt-2">${question.question}</p>
                <div class="pt-2"id="propositions" class="proposition-container">
        `;
    
        // Génère les éléments HTML pour chaque proposition
        question.propositions.forEach((proposition, index) => {
            quizHTML += `
                <div class="draggable" draggable="true" data-index="${index}">
                    ${proposition}
                </div>
            `;
        });
    
        quizHTML += `
                </div>
                <div id="dropZone" class="droppable  m-auto">Déposez votre réponse ici</div>
                <button id="nextQuestion" style="display:none;">Suivant</button>
            </div>
        `;
    
        $('main').html(quizHTML);
    
        implementDragAndDrop();
    
        // Gère le clic sur le bouton "Suivant"
        $("#nextQuestion").on("click", function() {
            if (hasAnswered) {
                currentQuestionIndex++;
                afficherQuestion();
            }
        });
    }

    // Implémente la fonctionnalité de drag and drop
    function implementDragAndDrop() {
        const draggables = document.querySelectorAll('.draggable');
        const dropZone = document.getElementById('dropZone');

        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', dragStart);
            draggable.addEventListener('dragend', dragEnd);
        });

        dropZone.addEventListener('dragover', dragOver);
        dropZone.addEventListener('drop', drop);

        function dragStart() {
            this.classList.add('dragging');
        }

        function dragEnd() {
            this.classList.remove('dragging');
        }

        function dragOver(e) {
            e.preventDefault();
        }

        function drop(e) {
            e.preventDefault();
            const draggable = document.querySelector('.dragging');
            if (draggable && !hasAnswered) {
                this.innerHTML = draggable.innerHTML;
                this.dataset.index = draggable.dataset.index;
                verifierReponse();
            }
        }
    }

    // Vérifie la réponse du joueur
    function verifierReponse() {
        if (hasAnswered) return;

        hasAnswered = true;
        let reponseSelectionnee = $("#dropZone").data("index");
        let question = currentQuestions[currentQuestionIndex];
        let reponseCorrecte = question.propositions.indexOf(question.réponse);

        if (parseInt(reponseSelectionnee) === reponseCorrecte) {
            score++;
            $("#dropZone").addClass("correct-answer");
        } else {
            $("#dropZone").addClass("incorrect-answer");
            $(`#propositions li[data-index="${reponseCorrecte}"]`).addClass("correct-answer");
        }

        afficherFeedback(question, parseInt(reponseSelectionnee), reponseCorrecte);
    }

    // Affiche le feedback après chaque réponse
    function afficherFeedback(question, reponseSelectionnee, reponseCorrecte) {
        let feedbackHTML = `
            <div class="text-white text-center">
                <h3 class="">${reponseSelectionnee === reponseCorrecte ? "Correct!" : "Incorrect"}</h3>
                <p>La bonne réponse était: ${question.réponse}</p>
                <p>Anecdote: ${question.anecdote}</p>
            </div>
        `;

        $('main').append(feedbackHTML);
        $("#nextQuestion").show();
    }

    // Affiche les résultats finaux
    function afficherResultats() {
        let totalQuestions = currentQuestions.length;
        let resultatHTML = `
            <div class="text-white text-center">
                <h2 class="fs-3 fw-bold">Quiz terminé!</h2>
                <p class="mt-4"><span class="fs-2">${userName}</span>, Vous avez obtenu le score de</p>
                <p class="fs-1 fw-bold">"${score}/${totalQuestions}"</p>
                <button id="restartQuiz" class="mt-4">Accueil</button>
            </div>
        `;

        $('main').html(resultatHTML);

        $("#restartQuiz").on("click", function() {
            location.reload();
        });
    }

    // Réinitialise le quiz
    function reinitialiserQuiz() {
        currentQuestions = [];
        currentQuestionIndex = 0;
        score = 0;
        hasAnswered = false;
        userName = "";
        $('main').html(''); // Nettoie le contenu principal
        // Réafficher la page d'accueil ici
    }

    // Gère le clic sur le bouton "Accueil"
    $(document).on('click', '#restartQuiz', function() {
        reinitialiserQuiz();
    });
});