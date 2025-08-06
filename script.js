// Armazena as respostas do usuário
let answers = {};

/**
 * Manipula a resposta do usuário quando clica em uma opção
 * @param {string} step - Etapa atual (step1 ou step2)
 * @param {string} answer - Resposta selecionada
 */
function handleAnswer(step, answer) {
    // Armazena a resposta
    answers[step] = answer;

    // Adiciona efeito visual de clique
    event.target.style.background = 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
    event.target.style.borderColor = '#2563eb';

    // Rastreia o evento (se Google Analytics estiver configurado)
    trackEvent('quiz_answer', `${step}_${answer}`);

    if (step === 'step1') {
        // Aguarda um momento para mostrar o feedback visual
        setTimeout(() => {
            transitionToStep2();
        }, 300);
    } else if (step === 'step2') {
        // Mostra o preloader e redireciona
        setTimeout(() => {
            showPreloader();
        }, 300);
    }
}

/**
 * Faz a transição da etapa 1 para a etapa 2
 */
function transitionToStep2() {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const progressBar = document.getElementById('progressBar');
    const currentStepText = document.getElementById('currentStep');

    // Animação de saída
    step1.classList.add('fade-out');

    setTimeout(() => {
        // Oculta step1 e mostra step2
        step1.classList.add('hidden');
        step2.classList.remove('hidden');
        
        // Atualiza barra de progresso
        progressBar.style.width = '100%';
        currentStepText.textContent = '2';
        
        // Rastreia progresso
        trackEvent('quiz_progress', 'step2_reached');
    }, 300);
}

/**
 * Exibe o preloader antes de redirecionar
 */
function showPreloader() {
    const step2 = document.getElementById('step2');
    const preloader = document.getElementById('preloader');
    const progressContainer = document.querySelector('.progress-container');

    // Animação de saída
    step2.classList.add('fade-out');
    progressContainer.classList.add('fade-out');

    setTimeout(() => {
        // Oculta step2 e mostra preloader
        step2.classList.add('hidden');
        progressContainer.classList.add('hidden');
        preloader.classList.add('active');

        // Rastreia conclusão
        trackEvent('quiz_complete', 'showing_results');

        // Redireciona após 3 segundos
        setTimeout(() => {
            redirectToLP();
        }, 3000);
    }, 300);
}

/**
 * Redireciona para a landing page com os parâmetros
 */
function redirectToLP() {
    // Prepara os parâmetros UTM e dados do quiz
    const params = new URLSearchParams(window.location.search);
    
    // Adiciona as respostas como parâmetros (opcional para tracking)
    if (answers.step1) params.append('q1', answers.step1);
    if (answers.step2) params.append('q2', answers.step2);
    
    // Adiciona timestamp para análise
    params.append('timestamp', Date.now());

    // URL de destino - ALTERE AQUI PARA SUA URL REAL
    const destinationURL = 'https://beneficios.browsebitz.com/programas-e-beneficios-sociais/';
    
    // Redireciona mantendo os parâmetros UTM
    const finalURL = params.toString() ? `${destinationURL}?${params.toString()}` : destinationURL;
    
    // Rastreia o redirecionamento
    trackEvent('redirect', 'to_results_page');
    
    // Executa o redirecionamento
    window.location.href = finalURL;
}

/**
 * Rastreia eventos para Google Analytics (se configurado)
 * @param {string} action - Ação do evento
 * @param {string} label - Rótulo do evento
 */
function trackEvent(action, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'event_category': 'Quiz_Beneficios',
            'event_label': label,
            'value': 1
        });
    }
    
    // Console log para debug (remover em produção)
    console.log(`Event tracked: ${action} - ${label}`);
}

/**
 * Previne que o usuário saia acidentalmente da página
 */
window.addEventListener('beforeunload', function (e) {
    // Só mostra o aviso se o usuário começou mas não terminou o quiz
    if (answers.step1 && !answers.step2) {
        e.preventDefault();
        e.returnValue = 'Você está quase terminando! Tem certeza que deseja sair?';
    }
});

/**
 * Inicialização quando o DOM estiver pronto
 */
document.addEventListener('DOMContentLoaded', function() {
    // Rastreia o início do quiz
    trackEvent('quiz_start', 'page_loaded');
    
    // Adiciona listener para teclas de acessibilidade
    document.addEventListener('keydown', function(e) {
        // Permite navegação por Tab
        if (e.key === 'Tab') {
            return;
        }
        
        // Permite seleção com Enter ou Espaço quando um botão está focado
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('option-button')) {
            e.preventDefault();
            e.target.click();
        }
    });
    
    // Verifica se há parâmetros UTM na URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('utm_source')) {
        console.log('Visitor from campaign:', urlParams.get('utm_source'));
    }
    
    // Adiciona timestamp de início
    window.quizStartTime = Date.now();
});

/**
 * Função auxiliar para calcular tempo gasto no quiz
 */
function getQuizDuration() {
    if (window.quizStartTime) {
        const duration = Math.floor((Date.now() - window.quizStartTime) / 1000);
        return duration; // em segundos
    }
    return 0;
}

/**
 * Adiciona duração do quiz antes de redirecionar
 */
const originalRedirectToLP = redirectToLP;
redirectToLP = function() {
    const duration = getQuizDuration();
    if (duration > 0) {
        trackEvent('quiz_duration', `${duration}_seconds`);
    }
    originalRedirectToLP();
};