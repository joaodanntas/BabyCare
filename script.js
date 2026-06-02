/* ============================================================
   BABYCARE HUB — script.js
   ============================================================ */

'use strict';

// 1. Imports no topo absoluto do ficheiro
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 2. Configuração das credenciais
const firebaseConfig = {
  apiKey: "AIzaSyBh7ig_LsB43K46QBhcPAEt0JCHLklQej8",
  authDomain: "babycare-11bf3.firebaseapp.com",
  projectId: "babycare-11bf3",
  storageBucket: "babycare-11bf3.firebasestorage.app",
  messagingSenderId: "286996279888",
  appId: "1:286996279888:web:59e1870b331d7e401d5755",
  measurementId: "G-MJTTC35S3D"
};

// 3. Inicialização e criação da constante db (Verifique se escreveu 'db' em minúsculo)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
auth.useDeviceLanguage();

// ─── STATE ───────────────────────────────────────────────────
const state = {
  dark: false,
  registered: false,
  user: {
    nome: 'Usuária', idade: '—', semanas: 18,
    altura: '—', peso: '—', sang: '—',
    tipoGest: 'Única', ativFisica: '—', medico: '—'
  },
  chatHistory: []   // { role, content }
};

// ─── IMAGE MAP ────────────────────────────────────────────────
// Assigned after images.js loads
const IMG = {};

// ─── HELPERS ─────────────────────────────────────────────────
function $(id)  { return document.getElementById(id); }
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return document.querySelectorAll(sel); }

function setSrc(id, src) {
  const el = $(id);
  if (el && src) el.src = src;
}

function showScreen(id) {
  qsa('.screen').forEach(s => s.classList.remove('active'));
  const el = $(id);
  if (el) {
    el.classList.add('active');
    el.scrollTop = 0;
    window.scrollTo(0, 0);
  }
}

// ─── THEME ────────────────────────────────────────────────────
function applyTheme() {
  document.body.classList.toggle('dark', state.dark);
  // Icon and thumb position are handled entirely by CSS (background-image + animation)
}

function toggleTheme() {
  state.dark = !state.dark;
  applyTheme();
}

// ─── IMAGES INIT ─────────────────────────────────────────────
function initImages() {
  // Map global constants from images.js
  IMG.LOGO            = typeof IMG_LOGO           !== 'undefined' ? IMG_LOGO            : '';
  IMG.MOON            = typeof IMG_MOON           !== 'undefined' ? IMG_MOON            : '';
  IMG.SUN             = typeof IMG_SUN            !== 'undefined' ? IMG_SUN             : '';
  IMG.FETO            = typeof IMG_FETO           !== 'undefined' ? IMG_FETO            : '';
  IMG.MILHO           = typeof IMG_MILHO          !== 'undefined' ? IMG_MILHO           : '';
  IMG.GESTANTE_LARANJA= typeof IMG_GESTANTE_LARANJA!=='undefined' ? IMG_GESTANTE_LARANJA: '';
  IMG.FRUTAS          = typeof IMG_FRUTAS         !== 'undefined' ? IMG_FRUTAS          : '';
  IMG.GESTANTE_EX     = typeof IMG_GESTANTE_EX    !== 'undefined' ? IMG_GESTANTE_EX     : '';
  IMG.DECO_L          = typeof IMG_DECO_L         !== 'undefined' ? IMG_DECO_L          : '';
  IMG.DECO_R          = typeof IMG_DECO_R         !== 'undefined' ? IMG_DECO_R          : '';
  IMG.LOGO_SM         = typeof IMG_LOGO_SM        !== 'undefined' ? IMG_LOGO_SM         : '';
  IMG.AVATAR          = typeof IMG_AVATAR         !== 'undefined' ? IMG_AVATAR          : '';
  IMG.GESTANTE_PERFIL = typeof IMG_GESTANTE_PERFIL!== 'undefined' ? IMG_GESTANTE_PERFIL : '';

  // Splash
  setSrc('splashLogo', IMG.LOGO);

  // Logos (full, in auth topbars)
  ['loginLogo','cadLogo','recoverLogo'].forEach(id => setSrc(id, IMG.LOGO));

  // Logos (small, in app topbars)
  ['onboardLogo','homeLogo','bebeLogo','corpoLogo','alimentacaoLogo',
   'exerciciosLogo','chatLogo','perfilLogo','ajudaLogo','emailLogo',
   'notifLogo','configLogo','emailPubLogo'
  ].forEach(id => setSrc(id, IMG.LOGO_SM));

  // Avatars in topbars
  ['homeAvatar','bebeAvatar','corpoAvatar','alimentacaoAvatar',
   'exerciciosAvatar','ajudaAvatar','emailAvatar','notifAvatar','configAvatar'
  ].forEach(id => setSrc(id, IMG.AVATAR));

  // Chat bot avatar
  setSrc('chatBotAvatar', IMG.LOGO_SM);

  // Perfil avatar & illustration
  setSrc('perfilAvatarImg', IMG.AVATAR);
  setSrc('perfilIllus', IMG.GESTANTE_PERFIL);

  // Home cards
  setSrc('homeFeto',    IMG.FETO);
  setSrc('homeMilho',   IMG.MILHO);
  setSrc('homeGestante',IMG.GESTANTE_LARANJA);
  setSrc('homeFrutas',  IMG.FRUTAS);
  setSrc('homeEx',      IMG.GESTANTE_EX);

  // Home decorations
  setSrc('homeDecoL', IMG.DECO_L);
  setSrc('homeDecoR', IMG.DECO_R);

  // Page decorations
  const decoIds = [
    'bebeDecoL','bebeDecoR','corpoDecoL','corpoDecoR',
    'alimentacaoDecoL','alimentacaoDecoR','exerciciosDecoL','exerciciosDecoR'
  ];
  decoIds.forEach((id, i) => setSrc(id, i % 2 === 0 ? IMG.DECO_L : IMG.DECO_R));

  // Feto on bebê page
  setSrc('bebeFeto', IMG.FETO);

  // Theme icons initial state
  applyTheme();
}

// ─── NAVIGATION ───────────────────────────────────────────────
function setupNavigation() {
  document.addEventListener('click', e => {
    const target = e.target.closest('[data-goto]');
    if (target) {
      const dest = target.dataset.goto;
      showScreen(dest);
      return;
    }
    const sair = e.target.closest('[data-sair]');
    if (sair) {
      doLogout();
      return;
    }
    const toggle = e.target.closest('.theme-toggle');
    if (toggle) {
      toggleTheme();
      return;
    }
    const eyeBtn = e.target.closest('.eye-btn');
    if (eyeBtn) {
      togglePassword(eyeBtn.dataset.target);
      return;
    }
  });
}

// ─── AUTH ─────────────────────────────────────────────────────
function togglePassword(inputId) {
  const inp = $(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function isEmailOrPhone(val) {
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneReg = /^[\d\s\(\)\-\+]{7,15}$/;
  return emailReg.test(val) || phoneReg.test(val);
}

async function doLogin(e) {
  e.preventDefault();
  
  const emailInput = $('loginEmail');
  const passInput  = $('loginPass');

  if (!emailInput || !passInput) return;

  const email = emailInput.value.trim();
  const pass  = passInput.value.trim();

  if (!email) { showToast('Informe e-mail ou telefone!'); return; }
  if (!isEmailOrPhone(email)) { showToast('Informe um e-mail ou telefone válido!'); return; }
  if (!pass) { showToast('Informe a senha!'); return; }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    console.log("Usuário logado:", user);

    // 1. TRAVA DE VERIFICAÇÃO DE E-MAIL
    if (!user.emailVerified) {
      showToast('Por favor, verifique seu e-mail antes de acessar o aplicativo! ⚠️');
      await auth.signOut();
      return;
    }

    showToast('Verificando perfil...');

    // 2. BUSCA OBRIGATÓRIA NO FIRESTORE
    // Importa as funções do Firestore necessárias para checar o documento
    const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const userDocRef = doc(db, "usuarios", user.uid); 
    const userDocSnap = await getDoc(userDocRef);

    state.registered = true;

    // 3. VALIDAÇÃO REAL DOS DADOS DO ONBOARDING
    if (userDocSnap.exists()) {
      const dadosBanco = userDocSnap.data();

      // Verifica se o campo semanas existe, não é nulo e não está vazio
      if (dadosBanco.semanas !== undefined && dadosBanco.semanas !== null && dadosBanco.semanas !== '') {
        
        // Se os dados existem no banco, preenchemos o seu 'state' global para a Home não ficar em branco
        state.user = {
          nome: dadosBanco.nome || 'Gestante',
          semanas: dadosBanco.semanas,
          altura: dadosBanco.altura || '-',
          peso: dadosBanco.peso || '-',
          dum: dadosBanco.dum || '',
          // adicione outros campos do seu Firestore aqui se necessário...
        };

        // Atualiza elementos visuais da Home se eles já existirem no DOM
        if ($('homeWeekDisplay')) $('homeWeekDisplay').textContent = dadosBanco.semanas + 'ª Semana';
        
        showToast('Bem-vinda de volta! 🎉');
        showScreen('screen-home');
      } else {
        // Documento existe no banco, mas a pessoa fechou o app antes de responder o Onboarding
        console.log("Documento existe, mas falta preencher as semanas.");
        showScreen('screen-onboard');
      }
    } else {
      // É o primeiro login dela ou ela nunca salvou nada no Firestore: manda direto pro Onboarding
      console.log("Nenhum dado encontrado no Firestore para este UID.");
      showScreen('screen-onboard');
    }
  } catch (error) {
    console.error("Erro no login:", error.code);
    if (error.code === 'auth/user-not-found') {
      showToast('Este e-mail não está cadastrado no sistema.');
    } else if (error.code === 'auth/wrong-password') {
      showToast('Senha incorreta! Tente novamente.');
    } else {
      showToast('Erro ao entrar. Tente novamente.');
    }
  }
}

async function doGoogleLogin(e) {
  if (e) e.preventDefault();

  // Inicializa o provedor do Google
  const provider = new GoogleAuthProvider();

  try {
    showToast('A ligar ao Google...');
    
    // Abre a janela flutuante para login
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Guarda o nome do utilizador do Google no nosso state local
    state.user.nome = user.displayName || 'Utilizadora';
    
    showToast(`Bem-vinda, ${state.user.nome}! 🎉`);

    // SEGUNDA MÁGICA: Como ela logou com o Google, vamos verificar se ela já fez o Onboarding antes
    try {
      const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const userDoc = await getDoc(doc(db, "usuarios", user.uid));
      
      if (userDoc.exists()) {
        // Se já tem dados salvos no Firestore, pula o onboarding e vai direto para a Home!
        const dados = userDoc.data();
        state.user.semanas = dados.semanas;
        state.registered = true;
        
        // Atualiza os dados na tela Home e Perfil (pode chamar as suas funções de update aqui se necessário)
        if ($('homeWeekDisplay')) $('homeWeekDisplay').textContent = dados.semanas + 'ª Semana';
        if ($('perfilName')) $('perfilName').textContent = state.user.nome;
        
        showScreen('screen-home');
      } else {
        // Se é a primeira vez dela no app, manda para o Onboarding para preencher peso/altura
        showScreen('screen-onboard');
      }
    } catch (fsError) {
      console.error("Erro ao checar Firestore:", fsError);
      // Por segurança, se falhar a checagem, manda para o Onboarding
      showScreen('screen-onboard');
    }

  } catch (error) {
    console.error("Erro no login com Google:", error.code);
    if (error.code === 'auth/popup-closed-by-user') {
      showToast('Login cancelado: fechou a janela do Google.');
    } else {
      showToast('Erro ao entrar com o Google. Tente novamente.');
    }
  }
}

async function doCadastro(e) {
  e.preventDefault();

  const nomeEl  = $('cadNome');
  const emailEl = $('cadEmail');
  const phoneEl = $('cadPhone');
  const pass1El = $('cadPass1');
  const pass2El = $('cadPass2');

  // Se a tela de cadastro não estiver renderizada ainda, evita o erro de null
  if (!nomeEl || !emailEl || !pass1El) return;

  const nome   = nomeEl.value.trim();
  const email  = emailEl.value.trim();
  const phone  = phoneEl.value.trim();
  const pass1  = pass1El.value.trim();
  const pass2  = pass2El.value.trim();

  if (!nome) { showToast('Informe seu nome!'); return; }
  if (!email && !phone) { showToast('Informe pelo menos e-mail ou telefone!'); return; }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('E-mail inválido!'); return; }
  if (!pass1) { showToast('Informe a senha!'); return; }
  if (pass1 !== pass2) { showToast('As senhas não coincidem!'); return; }
  if (pass1.length < 6) { showToast('A senha deve ter pelo menos 6 caracteres!'); return; }

  try {
    // 1. Cria a conta no Firebase Auth com e-mail e senha
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass1);
    const user = userCredential.user;
    console.log("Usuário criado:", user);

    showToast('Enviando e-mail de verificação...');

    // 2. MÁGICA: Dispara o e-mail oficial de validação do Firebase
    await sendEmailVerification(user);

    // Salva o nome localmente no state para quando ela voltar logada
    state.user.nome = nome;
    state.registered = true;

    showToast('Conta criada com sucesso! Verifique sua caixa de entrada para ativar. 📬');

    // 3. Desloga o usuário para forçá-lo a fazer login apenas após validar o link
    await auth.signOut();
    
    // 4. Redireciona de volta para a tela de login
    showScreen('screen-login');

  } catch (error) {
    console.error("Erro no cadastro:", error.code);
    if (error.code === 'auth/email-already-in-use') {
      showToast('Este e-mail já está cadastrado.');
    } else if (error.code === 'auth/weak-password') {
      showToast('Senha muito fraca! Escolha uma com 6 ou mais dígitos.');
    } else if (error.code === 'auth/invalid-email') {
      showToast('O formato do e-mail digitado é inválido.');
    } else if (error.code === 'auth/user-not-found') {
      showToast('Este e-mail não está cadastrado no sistema.');
    } else if (error.code === 'auth/wrong-password') {
      showToast('Senha incorreta! Tente novamente.');
    } else {
      showToast('Erro ao realizar cadastro. Tente novamente.');
    }
  }
}

function doLogout() {
  if (!confirm('Deseja realmente sair?')) return;
  // Reset only session, keep user data for next login
  showScreen('screen-login');
}

// ─── DADOS SEMANAIS DO BEBÊ ───────────────────────────────────
// Cada entrada: { comparacao, medida, peso, altura, tip1, tip2, bottomTip }
const DADOS_SEMANAS = {
   1: { comparacao: 'Menor que um grão de arroz.', medida: '< 1 mm', peso: '< 1g', altura: '< 0,1 cm', tip1: 'A fecundação acaba de ocorrer!', tip2: 'Cuide bem da alimentação.', bottomTip: 'O embrião ainda é microscópico.' },
   2: { comparacao: 'Menor que um grão de arroz.', medida: '< 1 mm', peso: '< 1g', altura: '< 0,1 cm', tip1: 'Ácido fólico é essencial agora!', tip2: 'Evite álcool e fumo.', bottomTip: 'As células se dividem rapidamente.' },
   3: { comparacao: 'Menor que um grão de arroz.', medida: '1–2 mm', peso: '< 1g', altura: '0,1 cm', tip1: 'Implantação no útero ocorre agora.', tip2: 'Tome ácido fólico diariamente.', bottomTip: 'O embrião está se fixando.' },
   4: { comparacao: 'Semente de Papoula — minúsculo mas presente!', medida: '2–3 mm', peso: '< 1g', altura: '0,2 cm', tip1: 'A produção de hCG começa.', tip2: 'Sinais iniciais podem aparecer.', bottomTip: 'O coração primitivo começa a se formar.' },
   5: { comparacao: 'Semente de gergelim.', medida: '4–5 mm', peso: '< 1g', altura: '0,4 cm', tip1: 'O coração começa a bater!', tip2: 'Náuseas podem surgir agora.', bottomTip: 'O tubo neural está se fechando.' },
   6: { comparacao: 'Ervilha.', medida: '5–6 mm', peso: '< 1g', altura: '0,5 cm', tip1: 'Olhos e nariz começam a se formar.', tip2: 'Hidrate-se bastante.', bottomTip: 'Os membros superiores estão surgindo.' },
   7: { comparacao: 'Mirtilo.', medida: '7–10 mm', peso: '< 1g', altura: '0,8 cm', tip1: 'Braços e pernas emergem!', tip2: 'Repouso é importante.', bottomTip: 'O cérebro cresce rapidamente.' },
   8: { comparacao: 'Framboesa.', medida: '1,4–2 cm', peso: '1g', altura: '1,5 cm', tip1: 'Dedos das mãos se formam.', tip2: 'Evite medicamentos sem receita.', bottomTip: 'O embrião já se move, mas você não sente.' },
   9: { comparacao: 'Azeitona.', medida: '2–3 cm', peso: '2g', altura: '2,3 cm', tip1: 'Todos os órgãos principais existem.', tip2: 'O olfato pode estar aguçado.', bottomTip: 'Agora é chamado de feto!' },
  10: { comparacao: 'Damasco.', medida: '3–4 cm', peso: '4g', altura: '3,1 cm', tip1: 'Unhas e cabelos começam.', tip2: 'Consulta pré-natal em dia!', bottomTip: 'O feto já dobra e estica.' },
  11: { comparacao: 'Figo.', medida: '4–5 cm', peso: '7g', altura: '4,1 cm', tip1: 'Ossos começam a endurecer.', tip2: 'Vitamina D é importante.', bottomTip: 'O feto pode bocejar!' },
  12: { comparacao: 'Lima-da-pérsia.', medida: '5–6 cm', peso: '14g', altura: '5,4 cm', tip1: 'Reflexos se desenvolvem.', tip2: 'Exame do 1º trimestre chegando.', bottomTip: 'Risco de aborto diminui significativamente.' },
  13: { comparacao: 'Vagem de ervilha.', medida: '6–8 cm', peso: '23g', altura: '7,4 cm', tip1: 'Impressões digitais se formam!', tip2: 'Energia pode voltar.', bottomTip: 'O 2º trimestre começa.' },
  14: { comparacao: 'Limão.', medida: '8–9 cm', peso: '43g', altura: '8,7 cm', tip1: 'Tireóide começa a funcionar.', tip2: 'Exercícios leves são recomendados.', bottomTip: 'O bebê faz expressões faciais.' },
  15: { comparacao: 'Maçã.', medida: '9–11 cm', peso: '70g', altura: '10,1 cm', tip1: 'Ele já chupa o dedo!', tip2: 'Ultrassom morfológico se aproxima.', bottomTip: 'O bebê se move muito.' },
  16: { comparacao: 'Abacate.', medida: '11–13 cm', peso: '100g', altura: '11,6 cm', tip1: 'Cabelos e sobrancelhas crescem.', tip2: 'Você pode sentir os primeiros movimentos.', bottomTip: 'O bebê escuta sons externos.' },
  17: { comparacao: 'Nabo.', medida: '12–14 cm', peso: '140g', altura: '13 cm', tip1: 'Gordura começa a se acumular.', tip2: 'Sono de lado é mais confortável.', bottomTip: 'O cordão umbilical está robusto.' },
  18: { comparacao: 'Espiga de milho.', medida: '14–16 cm', peso: '190g', altura: '14,2 cm', tip1: 'Vitaminas são importantes!', tip2: 'Ele já reconhece sua voz!', bottomTip: 'Seu bebê já escuta sons.' },
  19: { comparacao: 'Manga.', medida: '15–18 cm', peso: '240g', altura: '15,3 cm', tip1: 'O vernix caseoso cobre a pele.', tip2: 'Alimentação variada é essencial.', bottomTip: 'Movimentos ficam mais fortes.' },
  20: { comparacao: 'Banana.', medida: '16–19 cm', peso: '300g', altura: '16,4 cm', tip1: 'Metade da gravidez!', tip2: 'Ultrassom morfológico do 2º tri.', bottomTip: 'O bebê dorme e acorda com ciclos.' },
  21: { comparacao: 'Cenoura.', medida: '18–20 cm', peso: '360g', altura: '26,7 cm', tip1: 'Sobrancelhas bem definidas.', tip2: 'Inclua ferro na dieta.', bottomTip: 'O bebê engole líquido amniótico.' },
  22: { comparacao: 'Espiga de milho grande.', medida: '19–21 cm', peso: '430g', altura: '27,8 cm', tip1: 'Lábios e olhos formados.', tip2: 'Movimentos regulares são bons sinais.', bottomTip: 'O bebê reage a sons altos.' },
  23: { comparacao: 'Grapefruit.', medida: '20–22 cm', peso: '500g', altura: '28,9 cm', tip1: 'Audição bem desenvolvida.', tip2: 'Converse com seu bebê!', bottomTip: 'Pulmões em desenvolvimento acelerado.' },
  24: { comparacao: 'Espiga de milho.', medida: '21–23 cm', peso: '600g', altura: '30 cm', tip1: 'Viabilidade fetal alcançada!', tip2: 'Teste de diabetes gestacional.', bottomTip: 'Os pulmões produzem surfactante.' },
  25: { comparacao: 'Nabo sueco.', medida: '22–24 cm', peso: '660g', altura: '34,6 cm', tip1: 'Cabelos já visíveis!', tip2: 'Repouse e eleve as pernas.', bottomTip: 'O bebê responde à luz.' },
  26: { comparacao: 'Alface-americana.', medida: '23–25 cm', peso: '760g', altura: '35,6 cm', tip1: 'Olhos começam a abrir.', tip2: 'Atenção ao inchaço.', bottomTip: 'O cérebro cresce muito nesta fase.' },
  27: { comparacao: 'Couve-flor.', medida: '24–26 cm', peso: '875g', altura: '36,6 cm', tip1: 'Padrão de sono estabelecido.', tip2: 'Prepare a lista do enxoval.', bottomTip: 'O bebê treina a respiração.' },
  28: { comparacao: 'Berinjela.', medida: '25–27 cm', peso: '1 kg', altura: '37,6 cm', tip1: 'Início do 3º trimestre!', tip2: 'Movimento fetal ativo é sinal positivo.', bottomTip: 'Visão e audição bem desenvolvidas.' },
  29: { comparacao: 'Abóbora pequena.', medida: '26–28 cm', peso: '1,15 kg', altura: '38,6 cm', tip1: 'Ossos quase completamente formados.', tip2: 'Carboidratos complexos na dieta.', bottomTip: 'O bebê acumula gordura.' },
  30: { comparacao: 'Pepino grande.', medida: '27–29 cm', peso: '1,3 kg', altura: '39,9 cm', tip1: 'Cérebro em crescimento acelerado.', tip2: 'Descanso com travesseiros ajuda.', bottomTip: 'Os olhos já distinguem luz e sombra.' },
  31: { comparacao: 'Coco.', medida: '28–30 cm', peso: '1,5 kg', altura: '41,1 cm', tip1: 'Pulmões quase maduros.', tip2: 'Cursos de parto são recomendados.', bottomTip: 'O bebê se vira para a posição de parto.' },
  32: { comparacao: 'Abóbora-moranga pequena.', medida: '29–31 cm', peso: '1,7 kg', altura: '42,4 cm', tip1: 'Unhas chegam na ponta dos dedos.', tip2: 'Monitore pressão arterial.', bottomTip: 'Pele menos enrugada agora.' },
  33: { comparacao: 'Abacaxi.', medida: '30–32 cm', peso: '1,9 kg', altura: '43,7 cm', tip1: 'Sistema imune em formação.', tip2: 'Prepare a mala da maternidade.', bottomTip: 'O bebê pisca e reage à luz.' },
  34: { comparacao: 'Melão pequeno.', medida: '31–33 cm', peso: '2,15 kg', altura: '45 cm', tip1: 'Gordura corporal aumenta.', tip2: 'Consultas mais frequentes agora.', bottomTip: 'Coordenação dos reflexos melhora.' },
  35: { comparacao: 'Melão.', medida: '32–34 cm', peso: '2,4 kg', altura: '46,2 cm', tip1: 'Rins funcionando bem.', tip2: 'Sinais de trabalho de parto.', bottomTip: 'O bebê desceu na pelve.' },
  36: { comparacao: 'Alface romana.', medida: '33–35 cm', peso: '2,6 kg', altura: '47,4 cm', tip1: 'Quase pronto para o mundo!', tip2: 'Strep B teste pode ser feito.', bottomTip: 'Pulmões completamente maduros.' },
  37: { comparacao: 'Acelga.', medida: '34–36 cm', peso: '2,85 kg', altura: '48,6 cm', tip1: 'Gravidez a termo precoce!', tip2: 'Anote sinais de trabalho de parto.', bottomTip: 'O bebê está em posição cefálica.' },
  38: { comparacao: 'Alho-poró.', medida: '35–37 cm', peso: '3,1 kg', altura: '49,8 cm', tip1: 'Quase na hora!', tip2: 'Bolsa preparada?', bottomTip: 'A maior parte do vernix foi absorvida.' },
  39: { comparacao: 'Melancia pequena.', medida: '36–38 cm', peso: '3,3 kg', altura: '50,7 cm', tip1: 'Gravidez a termo completo!', tip2: 'Fique atenta às contrações.', bottomTip: 'Cabelos e unhas bem desenvolvidos.' },
  40: { comparacao: 'Melancia.', medida: '36–40 cm', peso: '3,4–3,6 kg', altura: '51 cm', tip1: 'Dia do parto chegando!', tip2: 'Confie no processo!', bottomTip: 'Bebê completamente formado e pronto.' },
  41: { comparacao: 'Melancia.', medida: '36–40 cm', peso: '3,4–3,6 kg', altura: '51 cm', tip1: 'Dia do parto chegando!', tip2: 'Confie no processo!', bottomTip: 'Bebê completamente formado e pronto.' },
  42: { comparacao: 'Melancia.', medida: '36–40 cm', peso: '3,4–3,6 kg', altura: '51 cm', tip1: 'Dia do parto chegando!', tip2: 'Confie no processo!', bottomTip: 'Bebê completamente formado e pronto.' },
};

// ─── IMAGEM POR SEMANA ────────────────────────────────────────
const IMAGENS_SEMANAS = {
   1: 'assets/semanas/semana-1.png',
   2: 'assets/semanas/semana-1.png',
   3: 'assets/semanas/semana-1.png',
   4: 'assets/semanas/semana-4.png',
   5: 'assets/semanas/semana-5.png',
   6: 'assets/semanas/semana-6.png',
   7: 'assets/semanas/semana-7.png',
   8: 'assets/semanas/semana-8.png',
   9: 'assets/semanas/semana-9.png',
  10: 'assets/semanas/semana-10.png',
  11: 'assets/semanas/semana-11.png',
  12: 'assets/semanas/semana-12.png',
  13: 'assets/semanas/semana-13.png',
  14: 'assets/semanas/semana-14.png',
  15: 'assets/semanas/semana-15.png',
  16: 'assets/semanas/semana-16.png',
  17: 'assets/semanas/semana-17.png',
  18: 'assets/semanas/semana-18.png',
  19: 'assets/semanas/semana-19.png',
  20: 'assets/semanas/semana-20.png',
  21: 'assets/semanas/semana-21.png',
  22: 'assets/semanas/semana-22.png',
  23: 'assets/semanas/semana-23.png',
  24: 'assets/semanas/semana-22.png',
  25: 'assets/semanas/semana-17.png',
  26: 'assets/semanas/semana-26.png',
  27: 'assets/semanas/semana-27.png',
  28: 'assets/semanas/semana-28.png',
  29: 'assets/semanas/semana-29.png',
  30: 'assets/semanas/semana-30.png',
  31: 'assets/semanas/semana-31.png',
  32: 'assets/semanas/semana-29.png',
  33: 'assets/semanas/semana-33.png',
  34: 'assets/semanas/semana-34.png',
  35: 'assets/semanas/semana-34.png',
  36: 'assets/semanas/semana-36.png',
  37: 'assets/semanas/semana-37.png',
  38: 'assets/semanas/semana-38.png',
  39: 'assets/semanas/semana-39.png',
  40: 'assets/semanas/semana-40.png',
  41: 'assets/semanas/semana-40.png',
  42: 'assets/semanas/semana-40.png',
};

function getImagemSemana(sem) {
  const s = Math.max(1, Math.min(40, Math.round(sem)));
  return IMAGENS_SEMANAS[s] || 'assets/milho-home.png';
}

function getDadosSemana(sem) {
  const s = Math.max(1, Math.min(40, Math.round(sem)));
  return DADOS_SEMANAS[s] || DADOS_SEMANAS[18];
}

function updateWeeklyData(sem) {
  const d = getDadosSemana(sem);
  const pct = Math.round((sem / 40) * 100);

  // Imagem dinâmica por semana (home e página bebê)
  const imgSrc = getImagemSemana(sem);
  setSrc('homeMilho', imgSrc);
  setSrc('bebeFruta', imgSrc);

  // Home card
  const compEl = $('homeFetoComparacao');
  if (compEl) compEl.textContent = d.comparacao;
  const medEl = $('homeFetoMedida');
  if (medEl) medEl.textContent = d.medida;

  // Bebe page
  const weekEl = $('bebeWeekLabel');
  if (weekEl) weekEl.textContent = 'Semana ' + sem;
  const pesoEl = $('bebePeso');
  if (pesoEl) pesoEl.textContent = d.peso;
  const altEl = $('bebeAltura');
  if (altEl) altEl.textContent = d.altura;
  const tip1El = $('bebeTip1');
  if (tip1El) tip1El.innerHTML = '&#8226; ' + d.tip1;
  const tip2El = $('bebeTip2');
  if (tip2El) tip2El.innerHTML = '&#8226; ' + d.tip2;
  const btEl = $('bebeBottomTip');
  if (btEl) btEl.innerHTML = '&#8226; ' + d.bottomTip;

  // Journey bar
  const jornadaEl = $('bebeJornada');
  if (jornadaEl) jornadaEl.textContent = 'Semana ' + sem + ' de 40';
  const pctEl = $('bebePct');
  if (pctEl) pctEl.textContent = pct + '% concluído';
  const fillEl = $('bebeFill');
  if (fillEl) fillEl.style.width = pct + '%';
}

// ─── ONBOARDING ───────────────────────────────────────────────
async function saveOnboard(e) {
  if (e) e.preventDefault();
  
  const user = auth.currentUser;
  if (!user) {
    showToast('Erro: Utilizador não identificado. Faça login novamente.');
    showScreen('screen-login');
    return;
  }
  
  // ── Campos obrigatórios ──────────────────────────────────────
  const semVal   = $('oSemanas').value.trim();
  const idadeVal = $('oIdade').value.trim();
  const altVal   = $('oAltura').value.trim();
  const pesoVal  = $('oPeso').value.trim();
  const dumVal   = $('oDum').value;

  if (!semVal)   { showToast('Informe as semanas de gestação!'); $('oSemanas').focus(); return; }
  if (!idadeVal) { showToast('Informe sua idade!');              $('oIdade').focus();   return; }
  if (!altVal)   { showToast('Informe sua altura!');            $('oAltura').focus();  return; }
  if (!pesoVal)  { showToast('Informe seu peso!');              $('oPeso').focus();    return; }
  if (!dumVal)   { showToast('Informe a data da última menstruação!'); $('oDum').focus(); return; }
  
  const dumDate = new Date(dumVal);
  const today   = new Date(); today.setHours(0,0,0,0);
  
  if (isNaN(dumDate.getTime())) { showToast('Data da última menstruação inválida!'); $('oDum').focus(); return; }
  if (dumDate > today) { showToast('A data da última menstruação não pode ser uma data futura!'); $('oDum').focus(); return; }
  if (semVal > 50) { showToast('Tempo de gestação inválido (maior que 50 semanas)!'); $('oSemanas').focus(); return; }
  
  const diasAtras = (today - dumDate) / (1000 * 60 * 60 * 24);
  if (diasAtras > 294) { showToast('Data da DUM muito antiga (mais de 42 semanas). Verifique!'); $('oDum').focus(); return; }
  // ────────────────────────────────────────────────────────────

  const sem = parseInt(semVal) || 18;
  
  // Capturando as variáveis locais auxiliares antes de subir para a nuvem
  const sangVal   = $('oTipoSang').value  || '—';
  const ativVal   = $('oAtiv').value      || '—';
  const gestVal   = $('oTipoGest').value  || 'Única';
  const medicoVal = $('oMedico').value    || '—';

  // 1. Criar o objeto com a estrutura idêntica para o Firestore Database
  const dadosOnboarding = {
    nome: state.user.nome || 'Utilizadora',
    idade: idadeVal,
    altura: altVal,
    peso: pesoVal,
    semanas: sem,
    dum: dumVal,
    tipoSanguineo: sangVal,
    praticaExercicio: ativVal,
    tipoGestacao: gestVal,
    medicoResponsavel: medicoVal,
    atualizadoEm: new Date().toISOString()
  };

  try {
    showToast('A guardar dados na nuvem...');

    // 2. MÁGICA: Grava os dados usando o UID exclusivo gerado na tela de cadastro
    await setDoc(doc(db, "usuarios", user.uid), dadosOnboarding);

    // 3. Atualiza o State local da aplicação (Se o banco aceitar com sucesso)
    state.user.idade      = idadeVal;
    state.user.altura     = altVal;
    state.user.peso       = pesoVal;
    state.user.sang       = sangVal;
    state.user.semanas    = sem;
    state.user.ativFisica = ativVal;
    state.user.tipoGest   = gestVal;
    state.user.medico     = medicoVal;
    state.registered      = true;

    // 4. Toda a sua lógica original de Update das Telas permanece intacta:
    
    // Update home
    $('homeWeekDisplay').textContent = sem + 'ª Semana';
    // Update exercises
    $('exerWeekDisplay').textContent = sem + 'ª Semana';

    // Update all weekly data (fetus size, bebe page, journey bar)
    updateWeeklyData(sem);

    // Calculate DPP from DUM
    if (dumVal) {
      const dum    = new Date(dumVal);
      const dpp    = new Date(dum.getTime() + 280 * 864e5);
      const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      const wk     = Math.ceil(dpp.getDate() / 7);
      const ord    = ['1ª','2ª','3ª','4ª','5ª'];
      $('homePartoPrev').textContent = (ord[wk-1]||'') + ' Semana de ' + months[dpp.getMonth()];
    }

    // Perfil display
    $('perfilName').textContent = state.user.nome;
    $('perfilAge').textContent  = state.user.idade !== '—' ? state.user.idade + ' anos' : '—';
    $('perfilWeek').textContent = sem + 'ª Semana';
    $('pdAltura').textContent   = state.user.altura !== '—' ? state.user.altura + ' m' : '—';
    $('pdPeso').textContent     = state.user.peso   !== '—' ? '~ ' + state.user.peso + ' kg' : '—';
    $('pdSang').textContent     = state.user.sang;
    $('pdTipoGest').textContent = state.user.tipoGest;
    $('pdAtiv').textContent     = state.user.ativFisica;

    showToast('Dados guardados com sucesso! 🌟');
    showScreen('screen-home');

  } catch (error) {
    console.error("Erro ao salvar no Firestore:", error);
    showToast('Erro ao sincronizar com o banco de dados. Tente novamente.');
  }
}

// ─── CHAT ─────────────────────────────────────────────────────
function addChatMessage(role, text) {
  const isUser = role === 'user';
  const body   = $('chatBody');

  const wrap = document.createElement('div');
  wrap.className = 'chat-msg ' + (isUser ? 'chat-msg--user' : 'chat-msg--bot');

  const avatar = document.createElement('img');
  avatar.className = 'chat-avatar';
  avatar.src = isUser ? IMG.AVATAR : IMG.LOGO_SM;
  avatar.alt = isUser ? 'Você' : 'Baby IA';

  const textWrap = document.createElement('div');
  const sender   = document.createElement('p');
  sender.className = 'chat-sender';
  sender.textContent = isUser ? 'Você' : 'Baby IA';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + (isUser ? 'chat-bubble--user' : 'chat-bubble--bot');
  // Render line breaks and bullet lists
  bubble.innerHTML = text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\n/g,'<br>')
    .replace(/• /g,'<br>• ');

  textWrap.appendChild(sender);
  textWrap.appendChild(bubble);
  wrap.appendChild(avatar);
  wrap.appendChild(textWrap);
  body.appendChild(wrap);
  body.scrollTop = body.scrollHeight;

  state.chatHistory.push({ role: isUser ? 'user' : 'assistant', content: text });
}

function addTypingIndicator() {
  const body = $('chatBody');
  const wrap = document.createElement('div');
  wrap.className = 'chat-msg chat-msg--bot';
  wrap.id = 'typingIndicator';

  const avatar = document.createElement('img');
  avatar.className = 'chat-avatar';
  avatar.src = IMG.LOGO_SM;

  const textWrap = document.createElement('div');
  const sender   = document.createElement('p');
  sender.className = 'chat-sender';
  sender.textContent = 'Baby IA';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble chat-bubble--bot';
  bubble.innerHTML = '<div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';

  textWrap.appendChild(sender);
  textWrap.appendChild(bubble);
  wrap.appendChild(avatar);
  wrap.appendChild(textWrap);
  body.appendChild(wrap);
  body.scrollTop = body.scrollHeight;
}

function removeTypingIndicator() {
  const el = $('typingIndicator');
  if (el) el.remove();
}

async function sendMessage() {
  const input = $('chatInput');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';
  $('chatSendBtn').disabled = true;

  addChatMessage('user', text);
  addTypingIndicator();

  const systemPrompt = `Você é a Baby IA, assistente virtual especializada em gestação e cuidados pré-natais do BabyCare Hub.
Você é carinhosa, empática e informativa. A usuária está na semana ${state.user.semanas} de gestação.
Responda sempre em português brasileiro de forma acolhedora e clara.
Use • como marcador de listas quando listar dicas ou itens.
IMPORTANTE: Sempre recomende consultar o médico obstetra para questões médicas específicas.
Nunca forneça diagnósticos — apenas informações e orientações gerais de saúde gestacional.`;

  try {
    const messages = [
      ...state.chatHistory.slice(-10),
      { role: 'user', content: text }
    ];

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages
      })
    });

    const data  = await resp.json();
    const reply = data.content?.[0]?.text || 'Desculpe, não consegui processar. Tente novamente!';
    removeTypingIndicator();
    addChatMessage('assistant', reply);
  } catch {
    removeTypingIndicator();
    addChatMessage('assistant', 'Desculpe, ocorreu um erro de conexão. Tente novamente em breve! 💙');
  }

  $('chatSendBtn').disabled = false;
  input.focus();
}

function setupChat() {
  $('chatSendBtn').addEventListener('click', sendMessage);
  $('chatInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage();
  });

  // Suggestion chips
  $('chatChips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (chip) {
      $('chatInput').value = chip.textContent;
      sendMessage();
    }
  });
}

// ─── SETTINGS TOGGLES ─────────────────────────────────────────
function setupSettingsToggles() {
  document.addEventListener('click', e => {
    const tog = e.target.closest('[data-stoggle]');
    if (!tog) return;
    tog.classList.toggle('settings-toggle--on');
    // Se for o toggle de dark mode na tela de config
    if (tog.dataset.stoggle === 'cfg-dark') {
      state.dark = tog.classList.contains('settings-toggle--on');
      applyTheme();
    }
  });
  // Sync config dark toggle with current theme state
  const cfgDark = $('configDarkToggle');
  if (cfgDark && state.dark) cfgDark.classList.add('settings-toggle--on');
}

// ─── FAQ ACCORDION ────────────────────────────────────────────
function setupFAQ() {
  document.addEventListener('click', e => {
    const header = e.target.closest('.faq-item__header');
    if (!header) return;
    const item = header.closest('.faq-item');
    if (!item) return;
    // Close all others
    qsa('.faq-item.open').forEach(o => { if (o !== item) o.classList.remove('open'); });
    item.classList.toggle('open');
  });
}

// ─── EMAIL FORM ───────────────────────────────────────────────
function setupEmailForm() {
  // ── Formulário logado ──────────────────────────────────────
  const msgEl = $('emailMsg');
  if (msgEl) {
    msgEl.addEventListener('input', () => {
      const len = msgEl.value.length;
      $('emailCharCount').textContent = len + '/1100 caracteres';
    });
  }

  const attachArea = $('emailAttach');
  const fileInput  = $('emailFileInput');
  if (attachArea && fileInput) {
    attachArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const f = fileInput.files[0];
      if (f) attachArea.querySelector('div:nth-child(2)').textContent = f.name;
    });
  }

  const sendBtn = $('btnEmailSend');
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      showToast('E-mail enviado com sucesso! Responderemos em até 48h. ✅');
      setTimeout(() => showScreen('screen-ajuda'), 1500);
    });
  }

  // ── Formulário público (sem login) ─────────────────────────
  const pubMsg = $('pubEmailMsg');
  if (pubMsg) {
    pubMsg.addEventListener('input', () => {
      $('pubEmailCharCount').textContent = pubMsg.value.length + '/1100 caracteres';
    });
  }

  const pubAttach = $('pubEmailAttach');
  const pubFile   = $('pubEmailFileInput');
  if (pubAttach && pubFile) {
    pubAttach.addEventListener('click', () => pubFile.click());
    pubFile.addEventListener('change', () => {
      const f = pubFile.files[0];
      if (f) pubAttach.querySelector('div:nth-child(2)').textContent = f.name;
    });
  }

  const pubSend = $('btnPubEmailSend');
  if (pubSend) {
    pubSend.addEventListener('click', () => {
      const nome  = $('pubEmailNome').value.trim();
      const email = $('pubEmailEmail').value.trim();
      const assunto = $('pubEmailAssunto').value;
      const msg   = $('pubEmailMsg').value.trim();
      if (!nome)   { showToast('Informe seu nome!'); return; }
      if (!email)  { showToast('Informe seu e-mail!'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('E-mail inválido!'); return; }
      if (!assunto){ showToast('Selecione um assunto!'); return; }
      if (!msg)    { showToast('Escreva sua mensagem!'); return; }
      showToast('E-mail enviado! Responderemos em até 48h. ✅');
      setTimeout(() => showScreen('screen-login'), 1800);
    });
  }
}

// ─── TOAST ────────────────────────────────────────────────────
function showToast(msg) {
  let toast = qs('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
      position:fixed; bottom:70px; left:50%; transform:translateX(-50%);
      background:#3A1A1A; color:white; border-radius:12px;
      padding:12px 22px; font-size:14px; z-index:9999;
      box-shadow:0 4px 16px rgba(0,0,0,.25); font-family:inherit;
      max-width:90vw; text-align:center;
      animation: fadeUp .3s ease;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ─── RECOVER ─────────────────────────────────────────────────
async function doRecoverPassword(e) {
  if (e) e.preventDefault();

  // Procura o input de texto especificamente dentro da sua tela de recuperação
  const emailInput = document.querySelector('#screen-recover .auth-input');
  
  if (!emailInput || !emailInput.value.trim()) {
    showToast('Por favor, digite o seu e-mail cadastrado!');
    if (emailInput) emailInput.focus();
    return;
  }

  const email = emailInput.value.trim();

  try {
    showToast('Enviando e-mail de redefinição...');
    
    // O Firebase assume o disparo do e-mail de redefinição
    await sendPasswordResetEmail(auth, email);

    showToast('E-mail enviado com sucesso! Verifique sua caixa de entrada. 📬');
    
    // Limpa o campo para a próxima vez e joga de volta para o Login
    emailInput.value = '';
    showScreen('screen-login');

  } catch (error) {
    console.error("Erro na recuperação:", error.code);
    
    // Tratamento de erros amigável
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      showToast('Este e-mail não está cadastrado no sistema.');
    } else if (error.code === 'auth/invalid-email') {
      showToast('O formato do e-mail digitado é inválido.');
    } else {
      showToast('Erro ao enviar e-mail de recuperação. Tente novamente.');
    }
  }
}

// ─── SPLASH AUTO-ADVANCE ─────────────────────────────────────
function setupSplash() {
  setTimeout(() => showScreen('screen-login'), 2200);
}

// ─── MAIN INIT ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Wait for images.js to load (it's in the same page)
  initImages();
  setupNavigation();
  setupChat();
  setupFAQ();
  setupEmailForm();
  setupSettingsToggles();
  setupSplash();

  // Auth buttons
  $('btnLogin').addEventListener('click', doLogin);
  $('btnCadastro').addEventListener('click', doCadastro);
  $('btnSaveOnboard').addEventListener('click', saveOnboard);
  $('btnGoogleLogin').addEventListener('click', doGoogleLogin);
  $('btnRecover').addEventListener('click', doRecoverPassword);

  // Initialize weekly display with default semana
  updateWeeklyData(state.user.semanas);

  // Enter key on login
  $('loginPass').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
});