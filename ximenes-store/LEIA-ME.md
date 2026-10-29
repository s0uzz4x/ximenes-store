# Ximenes Store

Site da loja com pedido direto pelo WhatsApp.

## Estrutura

```
index.html        página principal (só a estrutura)
css/style.css     visual, animações e layout para celular
js/dados.js       produtos e dados da loja (é o arquivo que você atualiza)
js/utils.js       funções de apoio
js/app.js         vitrine, produto, sacola e pedido pelo WhatsApp
js/admin.js       painel da loja
assets/           logotipo e ícone
```

## Como publicar
Envie a pasta inteira para a hospedagem, mantendo as subpastas. Não envie só o index.html solto.

## Como cadastrar produtos
1. Abra o site com `#admin` no final do endereço (exemplo: seusite.com/#admin).
2. Em "Produtos", adicione, edite ou remova peças. Em "Loja", altere nome, frase, WhatsApp e Instagram.
3. Clique em "Baixar dados atualizados". Será baixado o arquivo `dados.js`.
4. Envie esse arquivo para a pasta `js` da hospedagem, substituindo o antigo.
5. Se o navegador mostrar a versão antiga, recarregue a página forçando (Ctrl+F5 no computador).

## Efeitos
Entrada suave dos blocos ao rolar, faixa animada, brilho e giro no logotipo, zoom e segunda foto ao passar o mouse nos produtos, foto que voa até a sacola, barra de progresso e botão flutuante do WhatsApp. Quem usa "reduzir movimento" no aparelho não vê as animações.
