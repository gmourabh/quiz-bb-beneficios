/**
 * Sistema de Quiz de Benefícios
 * Versão final otimizada e testada
 */

// Configurações globais
const CONFIG = {
    destinationURL: 'https://beneficios.browsebitz.com/programas-e-beneficios-sociais/',
    preloaderDelay: 3000,
    animationDelay: 300,
    allowedParams: [
        'utm_source',
        'utm_medium', 
        'utm_campaign',
        'utm_term',
        'utm_content',
        'gclid',      // Google Ads Click ID
        'fbclid',     // Facebook Click ID
        'msclkid'     // Microsoft Ads Click ID
    ]
};

/**
 * Manipula a resposta do usuário quando clica em uma opção
 * Função global para ser chamada pelo onclick do HTML
 * @param {string} step - Etapa atual (step1 ou step2)
 * @param {string} answer - Resposta selecionada
 */
function handleAnswer(step, answer) {
    // Usa try-catch para garantir que erros não quebrem o fluxo
    try {
        // Pega o elemento clicado através do event global (disponível em onclick)
        const target = window.event ? window.event.currentTarget || window.event.target : null;
        
        if (target) {
            // Adiciona efeito visual de clique
            target.style.background = 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
            target.style.borderColor = '#2563eb';
        }

        // Rastreia o evento se GA estiver disponível
        trackEvent('quiz_answer', `${step}_${answer}`);

        // Prossegue para próxima etapa
        setTimeout(() => {
            if (step === 'step1') {
                transitionToStep2();
            } else if (step === 'step2') {
                showPreloader();
            }
        }, CONFIG.animationDelay);
        
    } catch (error) {
        // Em caso de erro, tenta prosseguir mesmo assim
        if (step === 'step1') {
            setTimeout(transitionToStep2, CONFIG.animationDelay);
        } else if (step === 'step2') {
            setTimeout(showPreloader, CONFIG.animationDelay);
        }
    }
}

/**
 * Faz a transição da etapa 1 para a etapa 2
 */
function transitionToStep2() {
    try {
        const step1 = document.getElementById('step1');
        const step2 = document.getElementById('step2');
        const progressBar = document.getElementById('progressBar');
        const currentStep = document.getElementById('currentStep');

        // Verifica se os elementos essenciais existem
        if (!step1 || !step2) {
            console.error('Elementos step1 ou step2 não encontrados');
            return;
        }

        // Adiciona classe de animação
        step1.classList.add('fade-out');

        setTimeout(() => {
            // Oculta step1 e mostra step2
            step1.classList.add('hidden');
            step2.classList.remove('hidden');
            
            // Atualiza barra de progresso (se existir)
            if (progressBar) {
                progressBar.style.width = '100%';
            }
            
            if (currentStep) {
                currentStep.textContent = '2';
            }
            
            // Rastreia progresso
            trackEvent('quiz_progress', 'step2_reached');
        }, CONFIG.animationDelay);
        
    } catch (error) {
        console.error('Erro na transição:', error);
    }
}

/**
 * Exibe o preloader antes de redirecionar
 */
function showPreloader() {
    try {
        const step2 = document.getElementById('step2');
        const preloader = document.getElementById('preloader');
        const progressContainer = document.querySelector('.progress-container');

        // Se não encontrar o preloader, redireciona direto
        if (!preloader) {
            console.warn('Preloader não encontrado, redirecionando diretamente');
            redirectToLP();
            return;
        }

        // Anima saída dos elementos
        if (step2) {
            step2.classList.add('fade-out');
        }
        if (progressContainer) {
            progressContainer.classList.add('fade-out');
        }

        setTimeout(() => {
            // Oculta elementos e mostra preloader
            if (step2) {
                step2.classList.add('hidden');
            }
            if (progressContainer) {
                progressContainer.classList.add('hidden');
            }
            
            preloader.classList.add('active');

            // Rastreia conclusão
            trackEvent('quiz_complete', 'showing_results');

            // Redireciona após delay
            setTimeout(redirectToLP, CONFIG.preloaderDelay);
            
        }, CONFIG.animationDelay);
        
    } catch (error) {
        console.error('Erro ao mostrar preloader:', error);
        // Em caso de erro, redireciona direto
        setTimeout(redirectToLP, 1000);
    }
}

/**
 * Redireciona para a landing page mantendo apenas os parâmetros UTM
 */
function redirectToLP() {
    try {
        // Captura os parâmetros da URL atual
        const currentParams = new URLSearchParams(window.location.search);
        const utmParams = new URLSearchParams();
        
        // Filtra apenas os parâmetros permitidos
        CONFIG.allowedParams.forEach(param => {
            const value = currentParams.get(param);
            if (value) {
                utmParams.append(param, value);
            }
        });
        
        // Monta a URL final
        const queryString = utmParams.toString();
        const finalURL = queryString 
            ? `${CONFIG.destinationURL}?${queryString}` 
            : CONFIG.destinationURL;
        
        // Rastreia o redirecionamento
        trackEvent('redirect', 'to_results_page');
        
        // Executa o redirecionamento
        window.location.href = finalURL;
        
    } catch (error) {
        console.error('Erro ao redirecionar:', error);
        // Em caso de erro, redireciona para URL base
        window.location.href = CONFIG.destinationURL;
    }
}

/**
 * Rastreia eventos para Google Analytics
 * @param {string} action - Ação do evento
 * @param {string} label - Rótulo do evento
 */
function trackEvent(action, label) {
    try {
        if (typeof gtag === 'function') {
            gtag('event', action, {
                'event_category': 'Quiz_Beneficios',
                'event_label': label,
                'value': 1
            });
        }
    } catch (error) {
        // Ignora erros de tracking silenciosamente
    }
}

/**
 * Inicializa o quiz quando o DOM estiver pronto
 */
function initQuiz() {
    try {
        // Rastreia o início
        trackEvent('quiz_start', 'page_loaded');
        
        // Adiciona suporte a teclado para acessibilidade
        const buttons = document.querySelectorAll('.option-button');
        buttons.forEach(button => {
            // Adiciona listener para Enter e Espaço
            button.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
            
            // Melhora o foco visual
            button.setAttribute('tabindex', '0');
        });
        
    } catch (error) {
        console.error('Erro ao inicializar quiz:', error);
    }
}

// Aguarda o DOM carregar completamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuiz);
} else {
    // DOM já carregado
    initQuiz();
}

// Expõe a função handleAnswer globalmente para o HTML
window.handleAnswer = handleAnswer;
