"use strict";

/* ==========================================================
   STACKEN — INTERACTION SYSTEM
   ----------------------------------------------------------
   Sistemas presentes:
   1. Mouse tracking global
   2. Card 3D tilt
   3. Avatar parallax
   4. Dynamic lighting
   5. Particle system
   6. Tooltip premium
   7. Performance / visibility handling
   ========================================================== */


/* ==========================================================
   ELEMENTOS
   ========================================================== */

const root = document.documentElement;

const profileCard = document.getElementById("profileCard");
const avatarWrapper = document.getElementById("avatarWrapper");

const particleCanvas = document.getElementById("particleCanvas");

const tooltip = document.getElementById("premiumTooltip");
const tooltipText = document.getElementById("tooltipText");

const tooltipTargets = document.querySelectorAll(".tooltip-target");


/* ==========================================================
   CONFIGURAÇÕES GERAIS
   ========================================================== */

const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
);

const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
);


/* ==========================================================
   ESTADO DO CURSOR
   ========================================================== */

const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,

    normalizedX: 0,
    normalizedY: 0,

    targetCardX: 0,
    targetCardY: 0,

    currentCardX: 0,
    currentCardY: 0,

    targetAvatarX: 0,
    targetAvatarY: 0,

    currentAvatarX: 0,
    currentAvatarY: 0
};


/* ==========================================================
   FUNÇÕES UTILITÁRIAS
   ========================================================== */

/**
 * Interpolação linear.
 * É utilizada para que os movimentos 3D não sigam o mouse
 * instantaneamente, criando sensação de peso e suavidade.
 */
const lerp = (start, end, amount) => {
    return start + (end - start) * amount;
};


/**
 * Limita um valor dentro de um intervalo.
 */
const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
};


/* ==========================================================
   MOUSE TRACKING GLOBAL
   ----------------------------------------------------------
   Atualiza:
   - posição das luzes
   - profundidade do background
   - movimento geral da cena
   ========================================================== */

function handlePointerMove(event) {
    if (!finePointer.matches || prefersReducedMotion.matches) {
        return;
    }

    pointer.x = event.clientX;
    pointer.y = event.clientY;

    pointer.normalizedX =
        (event.clientX / window.innerWidth - 0.5) * 2;

    pointer.normalizedY =
        (event.clientY / window.innerHeight - 0.5) * 2;


    /* Luz global */
    root.style.setProperty(
        "--mouse-x",
        `${(event.clientX / window.innerWidth) * 100}%`
    );

    root.style.setProperty(
        "--mouse-y",
        `${(event.clientY / window.innerHeight) * 100}%`
    );


    /* Movimento discreto das camadas do background */
    root.style.setProperty(
        "--scene-x",
        `${pointer.normalizedX * 7}px`
    );

    root.style.setProperty(
        "--scene-y",
        `${pointer.normalizedY * 7}px`
    );
}

window.addEventListener(
    "pointermove",
    handlePointerMove,
    { passive: true }
);


/* ==========================================================
   CARD 3D TILT
   ----------------------------------------------------------
   Calcula a posição do mouse dentro do card.
   O centro representa rotação 0.
   ========================================================== */

function handleCardPointerMove(event) {
    if (!finePointer.matches || prefersReducedMotion.matches) {
        return;
    }

    const rect = profileCard.getBoundingClientRect();

    const relativeX =
        (event.clientX - rect.left) / rect.width;

    const relativeY =
        (event.clientY - rect.top) / rect.height;


    /* Coordenadas de 0 a 100 para iluminação local */
    const localLightX = relativeX * 100;
    const localLightY = relativeY * 100;

    profileCard.style.setProperty(
        "--mouse-x",
        `${localLightX}%`
    );

    profileCard.style.setProperty(
        "--mouse-y",
        `${localLightY}%`
    );


    /*
     * Tilt máximo propositalmente pequeno.
     * A intenção é luxo e profundidade, não um efeito exagerado.
     */
    pointer.targetCardY =
        (relativeX - 0.5) * 8;

    pointer.targetCardX =
        (0.5 - relativeY) * 7;


    /*
     * Avatar se move de maneira independente,
     * aumentando a sensação de diferentes planos.
     */
    pointer.targetAvatarX =
        (relativeX - 0.5) * 7;

    pointer.targetAvatarY =
        (relativeY - 0.5) * 7;
}


/**
 * Ao sair do card todos os elementos retornam suavemente
 * à posição original.
 */
function resetCardTilt() {
    pointer.targetCardX = 0;
    pointer.targetCardY = 0;

    pointer.targetAvatarX = 0;
    pointer.targetAvatarY = 0;

    profileCard.style.setProperty("--mouse-x", "50%");
    profileCard.style.setProperty("--mouse-y", "50%");
}

profileCard.addEventListener(
    "pointermove",
    handleCardPointerMove,
    { passive: true }
);

profileCard.addEventListener(
    "pointerleave",
    resetCardTilt,
    { passive: true }
);


/* ==========================================================
   LOOP 3D
   ----------------------------------------------------------
   Um único requestAnimationFrame atualiza todas as
   transformações de alta frequência.
   Isso evita criar múltiplos loops independentes.
   ========================================================== */

let interactionFrameId = null;

function animateInteractions() {
    if (
        !finePointer.matches ||
        prefersReducedMotion.matches
    ) {
        root.style.setProperty("--card-rx", "0deg");
        root.style.setProperty("--card-ry", "0deg");

        root.style.setProperty("--avatar-rx", "0deg");
        root.style.setProperty("--avatar-ry", "0deg");

        root.style.setProperty("--avatar-tx", "0px");
        root.style.setProperty("--avatar-ty", "0px");

        interactionFrameId =
            requestAnimationFrame(animateInteractions);

        return;
    }


    /* Movimento do card */
    pointer.currentCardX = lerp(
        pointer.currentCardX,
        pointer.targetCardX,
        0.075
    );

    pointer.currentCardY = lerp(
        pointer.currentCardY,
        pointer.targetCardY,
        0.075
    );


    /* Movimento do avatar */
    pointer.currentAvatarX = lerp(
        pointer.currentAvatarX,
        pointer.targetAvatarX,
        0.09
    );

    pointer.currentAvatarY = lerp(
        pointer.currentAvatarY,
        pointer.targetAvatarY,
        0.09
    );


    /* Aplicação do tilt do card */
    root.style.setProperty(
        "--card-rx",
        `${pointer.currentCardX.toFixed(2)}deg`
    );

    root.style.setProperty(
        "--card-ry",
        `${pointer.currentCardY.toFixed(2)}deg`
    );


    /*
     * Avatar inclina na mesma direção,
     * mas com profundidade diferente.
     */
    root.style.setProperty(
        "--avatar-rx",
        `${(-pointer.currentAvatarY * 0.55).toFixed(2)}deg`
    );

    root.style.setProperty(
        "--avatar-ry",
        `${(pointer.currentAvatarX * 0.55).toFixed(2)}deg`
    );


    /*
     * Pequena translação física do avatar.
     */
    root.style.setProperty(
        "--avatar-tx",
        `${(pointer.currentAvatarX * 0.55).toFixed(2)}px`
    );

    root.style.setProperty(
        "--avatar-ty",
        `${(pointer.currentAvatarY * 0.55).toFixed(2)}px`
    );


    interactionFrameId =
        requestAnimationFrame(animateInteractions);
}

animateInteractions();


/* ==========================================================
   TOOLTIP PREMIUM
   ----------------------------------------------------------
   Uma única tooltip global é usada para todos os elementos
   com a classe .tooltip-target.

   O texto vem do atributo:
   data-tooltip="..."
   ========================================================== */

let tooltipHideTimer = null;
let tooltipAutoHideTimer = null;

let tooltipPointerX = 0;
let tooltipPointerY = 0;


/**
 * Reposiciona a tooltip evitando que ela saia da tela.
 */
function positionTooltip(x, y) {
    const tooltipRect = tooltip.getBoundingClientRect();

    const horizontalPadding = 16;
    const verticalPadding = 18;

    let targetX = x;
    let targetY = y - 24;


    /* Limite esquerdo */
    const halfWidth = tooltipRect.width / 2;

    targetX = clamp(
        targetX,
        halfWidth + horizontalPadding,
        window.innerWidth - halfWidth - horizontalPadding
    );


    /*
     * Caso não exista espaço suficiente acima do mouse,
     * a tooltip é movida para baixo.
     */
    if (
        targetY - tooltipRect.height <
        verticalPadding
    ) {
        targetY = y + tooltipRect.height + 15;
    }


    tooltip.style.left = `${targetX}px`;
    tooltip.style.top = `${targetY}px`;
}


/**
 * Mostra tooltip.
 */
function showTooltip(target, event = null) {
    clearTimeout(tooltipHideTimer);
    clearTimeout(tooltipAutoHideTimer);

    const message =
        target.dataset.tooltip || "";

    tooltipText.textContent = message;


    /*
     * Mouse:
     * tooltip próxima ao cursor.
     *
     * Teclado:
     * tooltip próxima ao centro do elemento.
     */
    if (event && typeof event.clientX === "number") {
        tooltipPointerX = event.clientX;
        tooltipPointerY = event.clientY;
    } else {
        const rect = target.getBoundingClientRect();

        tooltipPointerX =
            rect.left + rect.width / 2;

        tooltipPointerY =
            rect.top;
    }


    positionTooltip(
        tooltipPointerX,
        tooltipPointerY
    );

    tooltip.classList.add("is-visible");

    tooltip.setAttribute(
        "aria-hidden",
        "false"
    );


    /*
     * Reposicionamento após o browser calcular
     * o tamanho final do texto.
     */
    requestAnimationFrame(() => {
        positionTooltip(
            tooltipPointerX,
            tooltipPointerY
        );
    });


    /*
     * A tooltip desaparece automaticamente
     * depois de alguns segundos.
     */
    tooltipAutoHideTimer = setTimeout(() => {
        hideTooltip();
    }, 2600);
}


/**
 * Oculta tooltip.
 */
function hideTooltip(delay = 0) {
    clearTimeout(tooltipHideTimer);
    clearTimeout(tooltipAutoHideTimer);

    tooltipHideTimer = setTimeout(() => {
        tooltip.classList.remove("is-visible");

        tooltip.setAttribute(
            "aria-hidden",
            "true"
        );
    }, delay);
}


/**
 * Faz a tooltip acompanhar suavemente o cursor.
 */
function moveTooltip(event) {
    if (!tooltip.classList.contains("is-visible")) {
        return;
    }

    tooltipPointerX = event.clientX;
    tooltipPointerY = event.clientY;

    positionTooltip(
        tooltipPointerX,
        tooltipPointerY
    );
}


/* Registra eventos em todos os alvos */

tooltipTargets.forEach((target) => {

    target.addEventListener(
        "pointerenter",
        (event) => {
            /*
             * Em telas touch não queremos tooltip
             * sendo acionada por toque acidental.
             */
            if (event.pointerType === "touch") {
                return;
            }

            showTooltip(target, event);
        }
    );


    target.addEventListener(
        "pointermove",
        (event) => {
            if (event.pointerType === "touch") {
                return;
            }

            moveTooltip(event);
        },
        { passive: true }
    );


    target.addEventListener(
        "pointerleave",
        () => {
            hideTooltip(120);
        },
        { passive: true }
    );


    /* Acessibilidade via teclado */

    target.addEventListener(
        "focus",
        () => {
            showTooltip(target);
        }
    );

    target.addEventListener(
        "blur",
        () => {
            hideTooltip();
        }
    );

});


/* ==========================================================
   PARTICLE SYSTEM
   ----------------------------------------------------------
   Canvas é utilizado em vez de dezenas de elementos DOM.

   Isso mantém o background mais leve e permite:
   - partículas pequenas
   - movimento suave
   - profundidade
   - interação sutil com o mouse
   ========================================================== */

const ctx = particleCanvas.getContext("2d", {
    alpha: true
});

let canvasWidth = 0;
let canvasHeight = 0;

let devicePixelRatioValue = 1;

let particles = [];

let particleFrameId = null;

let lastParticleTime = 0;


/**
 * Quantidade adaptativa de partículas.
 * Telas pequenas recebem menos partículas.
 */
function getParticleCount() {
    const area =
        window.innerWidth *
        window.innerHeight;

    const count =
        Math.floor(area / 26000);

    return clamp(count, 24, 58);
}


/**
 * Classe responsável por uma partícula individual.
 */
class Particle {

    constructor(initial = false) {
        this.reset(initial);
    }


    reset(initial = false) {
        this.x =
            Math.random() * canvasWidth;

        this.y = initial
            ? Math.random() * canvasHeight
            : canvasHeight + 10;

        /*
         * depth varia entre 0.25 e 1.
         * Partículas mais "próximas" se movem um pouco mais.
         */
        this.depth =
            0.25 + Math.random() * 0.75;

        this.radius =
            0.35 + this.depth * 0.8;

        this.speedY =
            (0.045 + Math.random() * 0.1)
            * this.depth;

        this.speedX =
            (Math.random() - 0.5)
            * 0.035;

        this.alpha =
            0.08 + Math.random() * 0.32;

        this.phase =
            Math.random() * Math.PI * 2;

        this.phaseSpeed =
            0.004 + Math.random() * 0.007;
    }


    update(deltaMultiplier) {
        this.phase +=
            this.phaseSpeed * deltaMultiplier;

        this.y -=
            this.speedY * deltaMultiplier;

        this.x +=
            (
                this.speedX +
                Math.sin(this.phase) * 0.012
            )
            * deltaMultiplier;


        /*
         * Parallax baseado no cursor.
         * Muito pequeno para não transformar o fundo
         * em algo chamativo demais.
         */
        if (
            finePointer.matches &&
            !prefersReducedMotion.matches
        ) {
            this.x +=
                pointer.normalizedX *
                0.012 *
                this.depth *
                deltaMultiplier;

            this.y +=
                pointer.normalizedY *
                0.006 *
                this.depth *
                deltaMultiplier;
        }


        /* Reciclagem da partícula */
        if (
            this.y < -12 ||
            this.x < -20 ||
            this.x > canvasWidth + 20
        ) {
            this.reset(false);
        }
    }


    draw() {
        const pulse =
            0.72 +
            Math.sin(this.phase) * 0.28;

        const finalAlpha =
            this.alpha * pulse;


        ctx.beginPath();

        ctx.arc(
            this.x,
            this.y,
            this.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            `rgba(192, 132, 252, ${finalAlpha})`;

        ctx.fill();


        /*
         * Glow somente nas partículas maiores.
         * Evita shadowBlur em todas as partículas.
         */
        if (this.depth > 0.78) {
            ctx.beginPath();

            ctx.arc(
                this.x,
                this.y,
                this.radius * 3.4,
                0,
                Math.PI * 2
            );

            const glow =
                ctx.createRadialGradient(
                    this.x,
                    this.y,
                    0,
                    this.x,
                    this.y,
                    this.radius * 3.4
                );

            glow.addColorStop(
                0,
                `rgba(168, 85, 247, ${finalAlpha * 0.18})`
            );

            glow.addColorStop(
                1,
                "rgba(168, 85, 247, 0)"
            );

            ctx.fillStyle = glow;
            ctx.fill();
        }
    }
}


/**
 * Ajusta resolução do canvas considerando DPR.
 * O DPR é limitado para evitar custo excessivo em
 * telas de altíssima densidade.
 */
function resizeParticleCanvas() {
    devicePixelRatioValue =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    canvasWidth =
        window.innerWidth;

    canvasHeight =
        window.innerHeight;


    particleCanvas.width =
        Math.floor(
            canvasWidth *
            devicePixelRatioValue
        );

    particleCanvas.height =
        Math.floor(
            canvasHeight *
            devicePixelRatioValue
        );


    particleCanvas.style.width =
        `${canvasWidth}px`;

    particleCanvas.style.height =
        `${canvasHeight}px`;


    ctx.setTransform(
        devicePixelRatioValue,
        0,
        0,
        devicePixelRatioValue,
        0,
        0
    );


    createParticles();
}


/**
 * Cria / recria as partículas.
 */
function createParticles() {
    const count =
        prefersReducedMotion.matches
            ? Math.min(14, getParticleCount())
            : getParticleCount();

    particles = Array.from(
        { length: count },
        () => new Particle(true)
    );
}


/**
 * Loop de partículas.
 */
function animateParticles(timestamp = 0) {

    /*
     * Usuários que preferem menos movimento recebem
     * uma versão praticamente estática.
     */
    if (prefersReducedMotion.matches) {
        ctx.clearRect(
            0,
            0,
            canvasWidth,
            canvasHeight
        );

        particles.forEach((particle) => {
            particle.draw();
        });

        return;
    }


    const delta =
        timestamp - lastParticleTime;

    lastParticleTime = timestamp;


    /*
     * Normalização aproximada para 60 FPS.
     * clamp evita saltos gigantes ao voltar de outra aba.
     */
    const deltaMultiplier =
        clamp(delta / 16.67, 0.4, 2.2);


    ctx.clearRect(
        0,
        0,
        canvasWidth,
        canvasHeight
    );


    particles.forEach((particle) => {
        particle.update(deltaMultiplier);
        particle.draw();
    });


    particleFrameId =
        requestAnimationFrame(animateParticles);
}


/* ==========================================================
   PERFORMANCE — VISIBILITY API
   ----------------------------------------------------------
   Quando a aba não está visível, o canvas é pausado.
   ========================================================== */

function handleVisibilityChange() {

    if (document.hidden) {

        if (particleFrameId) {
            cancelAnimationFrame(
                particleFrameId
            );

            particleFrameId = null;
        }

        return;
    }


    if (
        !particleFrameId &&
        !prefersReducedMotion.matches
    ) {
        lastParticleTime =
            performance.now();

        particleFrameId =
            requestAnimationFrame(
                animateParticles
            );
    }
}

document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
);


/* ==========================================================
   RESIZE
   ========================================================== */

let resizeTimer = null;

function handleResize() {

    /*
     * Debounce evita recriar o canvas dezenas
     * de vezes durante um resize contínuo.
     */
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {

        resizeParticleCanvas();

        hideTooltip();

    }, 120);
}

window.addEventListener(
    "resize",
    handleResize,
    { passive: true }
);


/* ==========================================================
   ALTERAÇÃO DE PREFERÊNCIA DE MOVIMENTO
   ========================================================== */

function handleMotionPreferenceChange() {

    resizeParticleCanvas();


    if (prefersReducedMotion.matches) {

        if (particleFrameId) {
            cancelAnimationFrame(
                particleFrameId
            );

            particleFrameId = null;
        }

        animateParticles();

        resetCardTilt();

    } else {

        if (!particleFrameId) {

            lastParticleTime =
                performance.now();

            particleFrameId =
                requestAnimationFrame(
                    animateParticles
                );
        }
    }
}

if (typeof prefersReducedMotion.addEventListener === "function") {

    prefersReducedMotion.addEventListener(
        "change",
        handleMotionPreferenceChange
    );

}


/* ==========================================================
   INICIALIZAÇÃO
   ========================================================== */

function init() {

    resizeParticleCanvas();


    if (prefersReducedMotion.matches) {

        animateParticles();

    } else {

        particleFrameId =
            requestAnimationFrame(
                animateParticles
            );
    }


    /*
     * Remove uma possível classe no-document caso
     * futuramente o projeto seja expandido.
     */
    document.body.classList.add("is-ready");
}


/*
 * DOMContentLoaded não é estritamente necessário porque
 * o script está no final do body, mas mantém a inicialização
 * explícita e segura caso a estrutura seja alterada.
 */
if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        init,
        { once: true }
    );

} else {

    init();

}