Tarefa de Jogos de Azar em Iowa
PsyToolkit
principal|Biblioteca de Experimentos|Direitos autorais
Introdução
Publicidade
O esquema original
Sobre essa implementação
Análise
Execute a demo
Arquivo de saída de dados
Parâmetros para melhor definir
Confira o código-fonte
Baixar
Leitura adicional
Introdução
O Iowa original A Tarefa de Jogo estuda a tomada de decisão usando cartas. O o participante precisa escolher um dos quatro baralhos de cartas (chamados A,B,C, e D). O participante pode ganhar ou perder dinheiro com cada carta.

A tarefa foi projetada por Bechera e colegas, em 1994. Nota que o autor Antonio Damasio é um dos neurocientistas cognitivos mais famosos e isso Este artigo específico é muito citado.

O jornal original usava cartas reais, enquanto hoje em dia, o Iowa O Jogo de Jogos geralmente é baseado em computador. A tarefa era originalmente desenvolvido para detectar problemas em pacientes com danos no ventromedial córtex pré-frontal. Essa parte do cérebro é, entre outras coisas, envolvido no processamento de risco, medo, emoção e tomada de decisão:

Após danos ao córtex pré-frontal ventromedial, os humanos desenvolvem-se um defeito na tomada de decisão da vida real, que contrasta com outras Funções intelectuais normais. Atualmente, não há sonda neuropsicológica para detectar no laboratório, e o Os mecanismos cognitivos e neurais responsáveis por esse defeito têm resistiu a explicações. Aqui, usando uma tarefa inovadora que simula tomada de decisão na vida real na forma como ela considera a incerteza de premissas e resultados, assim como recompensa e punição, encontramos que Pacientes pré-frontais, ao contrário dos controles, estão alheios ao futuro consequências de suas ações, e parecem ser guiados por consequências imediatas Apenas prospectos. Essa descoberta oferece, pela primeira vez, o Possibilidade de detectar a incapacidade elusiva desses pacientes no laboratório, medindo e investigando suas possíveis causas.

— Bechara et al.
1994
Publicidade
Por favor, note que o anúncio abaixo é para apoiar a plataforma PsyToolit. Clicar nele nos ajuda.

Acima está um anúncio. O restante abaixo é livre de anúncios. Obrigado por assistir a isso.

O esquema original
No artigo original (Bechera e colegas, 1994), o O procedimento seguinte foi seguido:

Havia 4 baralhos de cartas (A, B, C e D)

Os participantes precisavam escolher no total 100 cartas, uma por vez

Cada vez que escolhem uma carta, recebem feedback sobre ganhar e/ou perder algum dinheiro

Os participantes não sabiam antecipadamente quanto cada carta renderia (ou seja, como em uma loteria)

Os participantes começaram com um "empréstimo" de $2000 e foram orientados a obter lucro

Os baralhos A e B sempre renderam $100

Os baralhos C e D sempre renderam $50

Para cada cartão escolhido, há 50% de chance de ter que pagar um Penalidade também. Para os baralhos A e B, a penalidade é de $250, enquanto para decks C e D custam $50.

"Os decks A e B são desfavoráveis a longo prazo porque eles custam mais a longo prazo, enquanto decks C e D são vantajosos porque resultam em um ganho geral a longo prazo." (Bechara et al., 1994, p.10).
Sobre essa implementação
O básico é o mesmo, exceto que este é um online experimentar. Em vez de quatro baralhos de cartas, agora você vê quatro "botões" como em uma máquina caça-níqueis rotulada com A, B, C ou D.

As recompensas são as mesmas do estudo original. Como você vai notar, É bem fácil de entender. Claro, você pode fazer as regras mais complicado por mudar um pouco o código.

Análise
Ao analisar os dados, é preciso pensar cuidadosamente O que exatamente você quer descobrir.

Um resultado interessante é com que frequência as pessoas decidem pelo "efeito "alto" baralhos de risco" (A/B) ou os baralhos de "baixo risco" (C/D).

Outra questão interessante é quanto tempo as pessoas levaram para decidir antes de tomarem uma decisão de baixo ou alto risco.

Atualmente, não existem maneiras "diretas" e fáceis de analisar isso dentro do Site PsyToolkit. Em vez disso, recomenda-se olhar para o "bruto" e leia você mesmo (por exemplo, com R) e procure o Os resultados que você tem interesse.

Execute a demo
Neste experimento, você verá uma instrução básica seguida de 100 Provas da Tarefa de Jogos de Azar de Iowa. Cada vez, você precisa selecionar A, B, C, ou D e você pode ganhar/perder algum dinheiro. No topo da tela você Veja quanto dinheiro você tem. Você começa com 2000 dólares.

Clique aqui para rodar uma demonstração

Arquivo de saída de dados
No PsyToolkit, o arquivo de saída de dados é simplesmente um arquivo de texto. A linha de salvamento do script do experimento PsyToolkit determina o que é sendo salvo no arquivo de saída de dados. Normalmente, para cada experimento Teste, você teria exatamente uma linha no seu arquivo de texto, e cada O número/palavra nessa linha te dá a informação que você precisa para seu análise de dados, como a condição, velocidade de resposta e se um Erro foi cometido.
Significado das colunas no arquivo de dados de saída. Você precisa dessas informações para sua análise de dados.

Colum	Significado
1

Tempo de reação (clique do mouse em um dos botões)

2

qual botão foi clicado (A=1,B=2,C=3,D=4)

3

se o conjunto desvantajoso (A ou B) foi clicado (1) ou não (0)

4

se havia uma taxa para pagar (1) ou não (0)

5

O valor no banco antes do participante clicar

6

o valor no banco após o participante clicar

7

o valor ganho no julgamento atual ($50 ou $100)

8

a taxa a pagar ($0, $50 ou $250)

Parâmetros para melhor definir
A pontuação principal nessa tarefa é quanto dinheiro as pessoas acabam ganhando com. Quem entende a regra vai se sair melhor.

A análise mais simples é apenas analisar para cada participante quanto O dinheiro lá está no banco. Para isso, você escolhe o seguinte parâmetros na seção "Analisar" do seu experimento:

Parâmetro	Valor
Variável dependente

6

Inclua apenas as últimas n linhas

1

Confira o código-fonte
O código do PsyToolkit

Baixar
O arquivo zip do código PsyToolkit

Se você tem uma conta PsyToolkit, pode enviar o arquivo zip. diretamente para sua conta PsyToolkit.

Se você quiser enviar o arquivo zip para sua conta do PsyToolkit, Certifique-se de que o arquivo não seja descomprimido automaticamente (alguns navegadores, especialmente no Mac Safari, por padrão descomprime o zip arquivos). Leia aqui como lidar facilmente com isso.

Leitura adicional
Bechara, A., Damasio A.R., Damasio H., Anderson S.W. (1994). Insensibilidade a consequências futuras após danos ao córtex pré-frontal humano. Cognição, 50, 7-15.