// ─── CSS-33 (Silva et al., 2016) ─────────────────────────────────────────────

export const CSS33_ITEMS = [
  "Se eu notar alguma sensação corporal estranha eu vou procurá-la na Internet.",
  "Pesquiso os mesmos sintomas na Internet mais de uma vez.",
  "Pesquisar na Internet sobre os sintomas ou os possíveis problemas de saúde que percebi interrompe meu tempo gasto no Facebook/Twitter/outras redes sociais.",
  "Pesquisar na Internet sobre os sintomas ou os possíveis problemas de saúde que percebi me leva a consultar meu médico.",
  "Eu tenho problemas para relaxar depois de pesquisar na Internet sobre os sintomas ou os possíveis problemas de saúde que percebi.",
  "Pesquisar na Internet sobre os sintomas ou os possíveis problemas de saúde que percebi interrompe outras pesquisas (por exemplo, meu trabalho/tarefa da faculdade/trabalho de casa).",
  "Eu fico mais facilmente ansioso ou irritado após pesquisar na Internet sobre os sintomas ou problemas de saúde percebidos.",
  "Pesquisar na Internet sobre sintomas ou os possíveis problemas de saúde que percebi interrompe minhas atividades online (como por exemplo, assistir filmes).",
  "Levo a opinião do meu médico ou profissional de saúde mais a sério do que a minha pesquisa médica na Internet.",
  "Eu entro em pânico quando leio na Internet que um sintoma que tenho é encontrado em algum problema de saúde raro/grave.",
  "Ao pesquisar sintomas ou problemas de saúde na Internet, visito fóruns onde os indivíduos diagnosticados ou preocupados discutem suas condições médicas, sintomas e experiências.",
  "Pesquisar na Internet sobre os sintomas ou os possíveis problemas de saúde que percebi em mim interrompe meu trabalho (como escrever e-mails, trabalhar em documentos do Word ou planilhas).",
  "Eu leio diferentes páginas da Internet sobre o mesmo problema de saúde que percebi.",
  "Pesquisar na Internet sobre os sintomas ou os possíveis problemas de saúde que percebi interrompe minhas atividades sociais presenciais (reduz o tempo gasto com amigos/família).",
  "Discuto minhas descobertas médicas na Internet com o meu médico/profissional de saúde.",
  "Sugiro ao meu médico/profissional de saúde que posso precisar de um procedimento de diagnóstico sobre o qual eu li na Internet (por exemplo, uma biópsia/um exame de sangue específico).",
  "Pesquisar na Internet sobre os sintomas ou os possíveis problemas de saúde que percebi me distrai da leitura de notícias/esportes/entretenimento on-line.",
  "Eu leio as mesmas páginas da Internet sobre condições médicas percebidas em mais de uma ocasião.",
  "Quando eu procuro um sintoma on-line, eu sinto que o ranking dos resultados de busca da Internet reflete o quão comum é uma doença, com os problemas de saúde mais prováveis aparecendo no início da página de resultados?",
  "Eu penso estar bem até ler sobre um problema de saúde sério na Internet?",
  "Eu visito fontes confiáveis (por exemplo, http://bvsms.saude.gov.br/) ao pesquisar os sintomas ou os possíveis problemas de saúde que percebi.",
  "Eu me sinto mais ansioso ou estressado após pesquisar online sobre sintomas ou condições médicas percebidas.",
  "Eu perco meu apetite depois de pesquisar na Internet sobre os sintomas ou os possíveis problemas de saúde que percebi, pois fico enjoado.",
  "Pesquisar na Internet sobre os sintomas ou os possíveis problemas de saúde que percebi interrompe ou torna mais lenta a minha comunicação on-line (por exemplo, mensagens instantâneas, Skype).",
  "Pesquisar na Internet sobre os sintomas ou os possíveis problemas de saúde que percebi interrompe minhas atividades de trabalho fora da Internet.",
  "Pesquisar na Internet os sintomas ou os possíveis problemas de saúde que percebi me faz consultar outras especialidades médicas.",
  "Discutir informações da Internet sobre um problema de saúde com meu médico me tranquiliza.",
  "Eu confio mais no diagnóstico do meu médico/profissional de saúde do que em meu autodiagnóstico na Internet.",
  "Eu acho difícil parar de me preocupar com os sintomas ou os possíveis problemas de saúde sobre os quais eu pesquisei na Internet.",
  "Ao pesquisar sintomas ou problemas de saúde na Internet eu visito tanto os sites confiáveis quanto fóruns de usuários.",
  "Eu tenho problemas para dormir depois de pesquisar na Internet sobre os sintomas ou os possíveis problemas de saúde que percebi, pois os resultados ficam se repetindo na minha mente.",
  "Eu me pego pensando: \"Eu não teria ido ao médico se eu não tivesse lido sobre esse sintoma/problema de saúde na Internet\".",
  "Quando o meu médico/profissional de saúde descarta minha pesquisa médica na Internet, eu paro de me preocupar com isso.",
];

export const CSS33_SCALE = [
  { value: 0, label: "Nunca" },
  { value: 1, label: "Raramente" },
  { value: 2, label: "Às vezes" },
  { value: 3, label: "Frequentemente" },
  { value: 4, label: "Sempre" },
];

export const CSS33_SUBSCALES = {
  compulsion: [1, 2, 5, 13, 18, 29, 31],
  distress: [7, 10, 22, 32],
  excess: [3, 6, 8, 12, 14, 17, 24, 25],
  reassurance: [4, 15, 16, 26],
  distrust: [9, 19, 28, 30, 33],
};

// ─── BAI — Beck Anxiety Inventory (Cunha, 2001) ────────────────────────────

export const BAI_ITEMS = [
  "Dormência ou formigamento",
  "Sensação de calor",
  "Tremores nas pernas",
  "Incapaz de relaxar",
  "Medo que aconteça o pior",
  "Atordoado ou tonto",
  "Palpitação ou aceleração do coração",
  "Sem equilíbrio",
  "Aterrorizado",
  "Nervoso",
  "Sensação de sufocação",
  "Tremores nas mãos",
  "Trêmulo",
  "Medo de perder o controle",
  "Dificuldade de respirar",
  "Medo de morrer",
  "Assustado",
  "Indigestão ou desconforto no abdômen",
  "Sensação de desmaio",
  "Rosto afogueado",
  "Suor (não devido ao calor)",
];

export const BAI_SCALE = [
  { value: 0, label: "Absolutamente não" },
  { value: 1, label: "Levemente — Não me incomodou muito" },
  { value: 2, label: "Moderadamente — Foi muito desagradável, mas pude suportar" },
  { value: 3, label: "Gravemente — Dificilmente pude suportar" },
];

export const BAI_INTERPRETATION = [
  { min: 0, max: 10, level: "Mínimo", color: "#22c55e" },
  { min: 11, max: 19, level: "Leve", color: "#eab308" },
  { min: 20, max: 30, level: "Moderado", color: "#f97316" },
  { min: 31, max: 63, level: "Grave", color: "#ef4444" },
];

// ─── GSE — Escala de Autoeficácia Geral (Schwarzer & Jerusalem, 1995; Teixeira & Ferreira, 2020) ──

export const GSE_ITEMS = [
  "Consigo sempre resolver os problemas difíceis se me esforçar o suficiente.",
  "Se alguém se opuser, posso encontrar meios e formas de alcançar o que quero.",
  "É fácil para mim agarrar as minhas intenções e atingir os meus objetivos.",
  "Estou confiante que posso lidar eficientemente com acontecimentos inesperados.",
  "Graças ao meu engenho, sei como lidar com situações imprevistas.",
  "Posso resolver a maioria dos problemas se investir o esforço necessário.",
  "Posso manter a calma quando confrontado com dificuldades porque posso confiar nas minhas capacidades para lidar com elas.",
  "Quando confrontado com um problema, geralmente consigo encontrar várias soluções.",
  "Se estiver com problemas, geralmente consigo pensar em algo para fazer.",
  "Quando tenho um problema pela frente, geralmente ocorrem-me várias formas para lidar com ele.",
];

export const GSE_SCALE = [
  { value: 1, label: "Discordo totalmente" },
  { value: 2, label: "Discordo" },
  { value: 3, label: "Concordo" },
  { value: 4, label: "Concordo totalmente" },
];
