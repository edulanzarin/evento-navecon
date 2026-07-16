/**
 * Single source of truth for all event content.
 *
 * Filling in pending content later means editing the values below — no
 * structural or layout changes are required. Fields set to `null` or empty
 * arrays render their respective `Pending_Content_State` placeholders.
 *
 * Speaker `photoSrc` values are `null` until photos are provided; the
 * SpeakersSection renders a named-alt placeholder image in that case.
 */

import type { EventContent } from "./types";

export const eventContent: EventContent = {
  // Fixed, known-now content
  eventName: "Transforme sua empresa em uma máquina de vendas online",
  speakerNames: ["Fábio Edelberg", "Mailson Junior"],
  dateLabel: "16 e 17 de setembro de 2026",
  venueLabel: "Navecon Contabilidade – Unidade Brusque",
  fullAddress:
    "Av. 1º de Maio, 38 – Sala 12 – Centro 2, Brusque – SC, CEP 88353202",

  // Pending-capable content (null/empty → pending state)
  eventTime: null,
  aboutDetail:
    "A maioria dos treinamentos ensina apenas como vender mais. Nesta " +
    "imersão, você vai aprender a vender mais, organizar sua operação e " +
    "preparar sua empresa para crescer com segurança, unindo duas " +
    "competências fundamentais: a estratégia comercial, os marketplaces, a " +
    "gestão e a escala com Mailson Junior, e a inteligência tributária, o " +
    "planejamento fiscal e a estrutura empresarial com Fábio Edelberg. Essa " +
    "integração proporciona uma visão completa do negócio, permitindo que o " +
    "crescimento das vendas aconteça com organização, rentabilidade e " +
    "sustentabilidade.",
  themes: [
    "Estruturação da operação em marketplaces",
    "Gestão empresarial aplicada ao crescimento",
    "Formação e gestão de equipes",
    "Criação e otimização de anúncios",
    "Estratégias de Marketplace Ads",
    "Escalabilidade da operação",
    "Inteligência tributária aplicada ao e-commerce",
    "Reforma Tributária e seus impactos",
    "Planejamento tributário para aumentar a lucratividade",
    "Como crescer pagando o imposto correto",
  ],
  audience: [
    "Empresários que querem transformar a operação física em um negócio de vendas online escalável",
    "Distribuidores, fabricantes e importadores que desejam expandir para os principais marketplaces do Brasil",
    "Lojistas que já vendem online, mas buscam organizar processos e aumentar a lucratividade",
    "Empresas que querem estruturar equipes e escalar as vendas aliando crescimento comercial à inteligência tributária",
  ],
  speakers: [
    {
      name: "Fábio Edelberg",
      role: "CEO da Navecon Contabilidade & Assessoria",
      bio:
        "Fábio Edelberg atua há mais de 13 anos auxiliando empresas a " +
        "reduzirem custos tributários de forma legal, aumentarem sua " +
        "lucratividade e se prepararem para os impactos da Reforma " +
        "Tributária.\n\nÀ frente da Navecon, já participou da transformação " +
        "estratégica de mais de 1.350 empresas, desenvolvendo planejamentos " +
        "tributários, reorganizações societárias e estratégias de " +
        "crescimento.",
      highlights: [
        "+13 anos de experiência",
        "+1.350 empresas transformadas",
      ],
      immersion:
        "Apresenta como estruturar a empresa para crescer nos marketplaces " +
        "sem comprometer a margem de lucro.",
      photoSrc: "/assets/gallery/fabio.jpg",
    },
    {
      name: "Mailson Junior",
      role: "Especialista em crescimento de empresas através dos marketplaces",
      bio:
        "Mailson Junior é empresário, mentor e referência nacional na " +
        "construção de operações escaláveis para vendas em marketplaces. Com " +
        "mais de 17 anos de experiência no setor da moda, é fundador da " +
        "Império Moda Atacadista, do Seu Império Online e do Grupo Império, " +
        "além de criador do Método S.I.O, metodologia desenvolvida para " +
        "estruturar, organizar e escalar empresas no ambiente " +
        "digital.\n\nAtualmente, gerencia mais de R$ 2 milhões em faturamento " +
        "mensal por meio dos marketplaces e já mentorou mais de 300 " +
        "empresários, fabricantes e indústrias em todo o Brasil.",
      highlights: [
        "+17 anos de experiência",
        "R$ 2 mi+ por mês em marketplaces",
        "+300 empresários mentorados",
      ],
      immersion:
        "Compartilha sua experiência prática mostrando como estruturar um " +
        "negócio para crescer nos marketplaces com segurança, eficiência " +
        "tributária e maior rentabilidade, preservando a margem de lucro e " +
        "preparando a empresa para uma operação escalável.",
      photoSrc: "/assets/gallery/mailson.jpeg",
    },
  ],
  faq: [
    {
      question: "Para quem é esta imersão?",
      answer:
        "Para empresários, distribuidores, fabricantes, importadores e " +
        "lojistas que desejam expandir suas operações para os principais " +
        "marketplaces do Brasil. Também é ideal para empresas que já vendem " +
        "online, mas buscam organizar processos, aumentar a lucratividade, " +
        "estruturar equipes e escalar suas vendas de forma sustentável, " +
        "aliando crescimento comercial à inteligência tributária.",
    },
    {
      question: "O evento é presencial?",
      answer:
        "Sim. A imersão será realizada 100% presencialmente na Navecon " +
        "Contabilidade, em Brusque/SC. Além do conteúdo prático, o evento " +
        "foi pensado para proporcionar networking, troca de experiências e " +
        "interação direta com os especialistas.",
    },
    {
      question: "O que está incluso na inscrição?",
      answer:
        "Sua inscrição garante participação nos 2 dias de imersão " +
        "presencial, material de apoio exclusivo, coffee break durante o " +
        "evento, networking com empresários de diferentes segmentos e " +
        "conteúdo prático ministrado por Mailson Junior e Fábio Edelberg.",
    },
    {
      question: "Preciso já vender em marketplaces?",
      answer:
        "Não. A imersão atende tanto empresários que desejam iniciar sua " +
        "operação quanto empresas que já vendem online e querem estruturar " +
        "processos, aumentar performance e crescer com mais segurança.",
    },
    {
      question: "Como faço minha inscrição?",
      answer:
        'Basta clicar no botão "Quero garantir minha vaga" ou entrar em ' +
        "contato pelo WhatsApp oficial do evento. Nossa equipe apresentará " +
        "as formas de pagamento disponíveis, à vista e parceladas, e após a " +
        "confirmação do pagamento sua vaga será reservada.",
    },
    {
      question: "As vagas são limitadas?",
      answer:
        "Sim. Para garantir uma experiência de alto nível e maior interação " +
        "entre participantes e especialistas, as vagas são limitadas. " +
        "Recomendamos realizar sua inscrição com antecedência para garantir " +
        "sua participação.",
    },
  ],
  contacts: [
    { kind: "phone", label: "(47) 3000-0000", href: "tel:+554730000000" },
    {
      kind: "email",
      label: "contato@navecon.com.br",
      href: "mailto:contato@navecon.com.br",
    },
    {
      kind: "instagram",
      label: "@navecon",
      href: "https://instagram.com/navecon",
    },
    {
      kind: "whatsapp",
      label: "Fale no WhatsApp",
      href: "https://wa.me/5547900000000",
    },
  ],

  // Event timing — 16 September 2026, start of day in Brasília time (UTC−03:00)
  eventStartDatetime: "2026-09-16T00:00:00-03:00",
};

export default eventContent;
