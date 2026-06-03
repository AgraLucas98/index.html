Pinguim da Colina - Jogo de Plataforma 2D Retrô
Este é um jogo de plataforma 2D desenvolvido em JavaScript puro (Vanilla JS) utilizando a API do Canvas HTML5. O projeto foi construído seguindo a estética e mecânicas clássicas de jogos de 8-bits, combinando elementos inspirados em Super Mario Bros. com uma identidade visual personalizada.

Funcionalidades e Mecânicas Implementadas
Física Avançada de Plataforma: Sistema de movimentação baseado em vetores, incluindo inércia, aceleração e mecânica de deslize simulando superfícies de gelo.

Animação por Código: Renderização de sprites pixel art gerados dinamicamente via matrizes (arrays bidimensionais) diretamente no Canvas, alternando estados para animação de caminhada e pulo.

Mecanismo de Câmera: Scroll lateral automático baseado na posição horizontal do jogador.

Geração Dinâmica de Mapas: Sistema baseado em matrizes de caracteres (strings) que interpretam e posicionam blocos, colecionáveis, inimigos e elementos lógicos do cenário.

Blocos Especiais e Interativos: Implementação de blocos de interrogação com lógica de colisão inferior que liberam itens e alteram o estado do bloco após o impacto.

Inteligência Artificial de Patrulha (Inimigos): Caranguejos e focas com padrões de movimento definidos. O sistema gerencia eventos distintos para detecção de dano (colisão lateral) e eliminação do inimigo (colisão superior via pulo).

Mecânica de Transição de Fase (Mastro Clássico): Sistema de animação em cutscene acionado ao colidir com o mastro. O controle do jogador é desativado temporariamente enquanto o sprite e a bandeira deslizam verticalmente em sincronia, seguido pelo deslocamento automatizado até o iglu de finalização.

Áudio Sintetizado Retrô: Geração de efeitos sonoros de 8-bits (pulo, moedas, impactos e melodia de vitória) em tempo real utilizando a Web Audio API, eliminando a dependência de arquivos externos de áudio.

Paletas de Cores Dinâmicas: Mudança automática na identidade visual e no esquema de cores do cenário a cada nova fase.

Estrutura do Projeto
index.html: Estrutura base contendo o elemento Canvas e os botões para suporte a dispositivos móveis.

game.js: Arquivo principal contendo os estados do jogo, arrays de sprites, lógica de física, tratamento de colisões e o loop principal (requestAnimationFrame).

Como Executar
Clone este repositório.

Abra o arquivo index.html diretamente em qualquer navegador web moderno.

Utilize as setas direcionais do teclado (ou as teclas A, D, W) para controlar o personagem.
