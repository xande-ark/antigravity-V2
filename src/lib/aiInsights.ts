import type { AnalysisResult } from '../types';

export const generateAIInsights = async (result: AnalysisResult): Promise<string> => {
  // Simulate a slight delay so it feels like it's analyzing
  await new Promise(resolve => setTimeout(resolve, 800));

  let markdown = '### 🚨 Diagnóstico Principal\n';
  let issuesCount = 0;

  if (!result.indexing.isIndexed) {
    markdown += 'A página não está indexada no Google, o que significa que não receberá tráfego orgânico.\n';
    issuesCount++;
  }
  
  if (result.score < 50) {
    markdown += 'A performance no PageSpeed está crítica (abaixo de 50), o que prejudica a experiência do usuário e o ranqueamento.\n';
    issuesCount++;
  } else if (result.score < 90) {
    markdown += 'A performance no PageSpeed está mediana. Há espaço para melhorar o ranqueamento e a conversão.\n';
  }

  if (issuesCount === 0) {
    markdown += 'A página está saudável e indexada, mas sempre há pequenos ajustes de otimização que podem ser feitos.\n';
  }

  markdown += '\n### 🛠️ Plano de Ação (Passo a Passo)\n\n';

  // Indexing Actions
  if (!result.indexing.isIndexed) {
    markdown += '**1. Resolver a Indexação:**\n';
    markdown += '- Verifique se a tag `robots` ou o arquivo `robots.txt` não estão bloqueando o Googlebot.\n';
    markdown += '- Envie a URL manualmente pelo Google Search Console usando a ferramenta de "Inspeção de URL".\n';
    markdown += '- Certifique-se de que a página está listada no seu arquivo Sitemap XML.\n\n';
  }

  if (result.indexing.canonicalStatus === 'mismatch' || result.indexing.canonicalStatus === 'missing') {
    markdown += '**2. Ajustar Tag Canonical:**\n';
    markdown += '- A tag canonical está ausente ou apontando para um endereço diferente. Se usar WordPress, verifique as configurações do Yoast ou RankMath para garantir que a página aponta para si mesma.\n\n';
  }

  // Performance Actions
  let step = result.indexing.isIndexed ? 1 : 3;

  const lcpValue = parseFloat(result.pageSpeed.lcp.value);
  if (!isNaN(lcpValue) && lcpValue > 2.5) {
    markdown += `**${step}. Melhorar o LCP (Carregamento da Imagem Principal):**\n`;
    markdown += '- O conteúdo principal está demorando muito. Otimize a imagem ou banner principal do topo (hero image) convertendo para o formato WebP.\n';
    markdown += '- Adicione o atributo `fetchpriority="high"` ou `<link rel="preload">` na imagem de destaque.\n\n';
    step++;
  }

  const clsValue = parseFloat(result.pageSpeed.cls.value);
  if (!isNaN(clsValue) && clsValue > 0.1) {
    markdown += `**${step}. Estabilizar o Layout (Corrigir CLS):**\n`;
    markdown += '- Elementos estão pulando na tela. Adicione os atributos `width` e `height` em todas as tags `<img>` e `<iframe>`.\n';
    markdown += '- Reserve espaço no CSS para banners ou anúncios que carregam dinamicamente.\n\n';
    step++;
  }

  // Lighthouse Opportunities
  if (result.pageSpeed.opportunities.length > 0) {
    markdown += `**${step}. Corrigir Gargalos Técnicos Detectados:**\n`;
    result.pageSpeed.opportunities.forEach(opp => {
      if (opp.id === 'unused-javascript') {
        markdown += '- **JavaScript Não Utilizado:** Instale um plugin como WP Rocket ou Perfmatters e ative a opção "Delay JavaScript Execution" (Atrasar execução de JS).\n';
      } else if (opp.id === 'render-blocking-resources') {
        markdown += '- **Recursos Bloqueadores:** Mova scripts não críticos para o rodapé ou use os atributos `defer` ou `async` nas tags `<script>`.\n';
      } else if (opp.id === 'unminified-css' || opp.id === 'unminified-javascript') {
        markdown += '- **Minificação:** Ative a minificação de CSS e JS no seu plugin de cache ou na Cloudflare.\n';
      } else {
        markdown += `- **${opp.title}:** ${opp.description}\n`;
      }
    });
  }

  if (step === 1 && result.pageSpeed.opportunities.length === 0) {
    markdown += 'Nenhuma ação técnica pendente. Excelente trabalho!\n\n';
  }

  markdown += '\n### 💡 Dica de Ouro\n';
  if (!result.indexing.isIndexed) {
    markdown += 'A indexação é a prioridade zero. De nada adianta a página ser rápida se o Google não a exibe. Foco no Search Console!';
  } else if (result.score < 90) {
    markdown += 'Na maioria dos sites, ativar um cache avançado (como WP Rocket + Cloudflare) resolve 80% dos problemas de velocidade listados acima em 5 minutos.';
  } else {
    markdown += 'Sua página está voando! Agora o foco deve ser criar conteúdo de alta qualidade e conseguir backlinks.';
  }

  return markdown;
};

